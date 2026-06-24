const BaseRepository = require('./BaseRepository')
const db = require('./db')
const ChapterRepository = require('./ChapterRepository')

class ScheduleRepository extends BaseRepository {
    constructor() {
        super('schedule')
        this.chapterRepo = new ChapterRepository()
    }

    // toutes les activités d'un perso (tous jours confondus), triées par jour puis heure
    async findByCharacter(characterId) {
        const [rows] = await db.query(
            `SELECT s.*, w.name AS week_name, w.\`order\` AS week_order
             FROM schedule s
             JOIN \`week\` w ON w.id = s.week_id
             WHERE s.character_id = ?
             ORDER BY w.\`order\` ASC, s.heure_debut ASC`,
            [characterId]
        )
        return rows
    }

    // les activités d'un perso pour UN seul jour (vue détaillée)
    async findByCharacterAndWeek(characterId, weekId) {
        const [rows] = await db.query(
            `SELECT * FROM schedule
             WHERE character_id = ? AND week_id = ?
             ORDER BY heure_debut ASC`,
            [characterId, weekId]
        )
        return rows
    }

    // LE coeur de la feature chapitre : activités d'un perso pour un jour donné, filtrées pour
    // n'afficher que celles dont la plage chapter_id_debut -> chapter_id_fin couvre le chapitre cible.
    // Règle :
    //   - chapter_id_debut NULL ET chapter_id_fin NULL -> toujours visible (aucune restriction)
    //   - chapter_id_debut NULL seul -> pas de limite basse ("depuis le début du livre")
    //   - chapter_id_fin NULL seul -> pas de limite haute ("jusqu'à la fin du livre")
    //   - les deux définis -> le chapitre cible doit être entre les deux (inclus)
    // La comparaison se fait sur (tome.number, chapter.position), jamais sur les id bruts.
    async findByCharacterAndWeekForChapter(characterId, weekId, targetChapterId) {
        const [rows] = await db.query(
            `SELECT s.* FROM schedule s
             LEFT JOIN chapter cd ON cd.id = s.chapter_id_debut
             LEFT JOIN tome td ON td.id = cd.tome_id
             LEFT JOIN chapter cf ON cf.id = s.chapter_id_fin
             LEFT JOIN tome tf ON tf.id = cf.tome_id
             JOIN chapter target ON target.id = ?
             JOIN tome ttarget ON ttarget.id = target.tome_id
             WHERE s.character_id = ? AND s.week_id = ?
             AND (
                s.chapter_id_debut IS NULL
                OR (ttarget.number > td.number)
                OR (ttarget.number = td.number AND target.position >= cd.position)
             )
             AND (
                s.chapter_id_fin IS NULL
                OR (ttarget.number < tf.number)
                OR (ttarget.number = tf.number AND target.position <= cf.position)
             )
             ORDER BY s.heure_debut ASC`,
            [targetChapterId, characterId, weekId]
        )
        return this.resolveOverlapPriority(rows)
    }

    // règle de priorité quand 2 activités du même perso/jour se chevauchent en heure ET sont
    // toutes les deux valides au chapitre affiché : celle avec la plage chapitre la PLUS COURTE
    // gagne et masque l'autre sur la portion d'heure concernée. Une plage NULL/NULL ("toujours")
    // est considérée comme infiniment longue, donc toujours perdante face à une vraie plage définie.
    // Aucune modification en BDD : ce filtrage est purement pour l'affichage.
    async resolveOverlapPriority(schedules) {
        if (schedules.length <= 1) return schedules

        // longueur de chaque activité : Infinity si pas de plage définie, sinon nombre de chapitres couverts
        const lengths = await Promise.all(
            schedules.map(async s => {
                if (!s.chapter_id_debut || !s.chapter_id_fin) return Infinity
                return this.chapterRepo.countChaptersBetween(s.chapter_id_debut, s.chapter_id_fin)
            })
        )

        const timesOverlap = (a, b) => a.heure_debut < b.heure_fin && a.heure_fin > b.heure_debut

        // on garde une activité sauf si une AUTRE activité qui la chevauche en heure a une plage strictement plus courte
        const winners = schedules.filter((s, i) => {
            return !schedules.some((other, j) => {
                if (i === j) return false
                if (!timesOverlap(s, other)) return false
                return lengths[j] < lengths[i] // l'autre est strictement plus courte -> s perd
            })
        })

        return winners
    }

    // vue comparaison : activités de PLUSIEURS persos pour un jour donné, filtrées par chapitre
    async findByCharactersAndWeekForChapter(characterIds, weekId, targetChapterId) {
        if (!characterIds.length) return []

        const results = await Promise.all(
            characterIds.map(id => this.findByCharacterAndWeekForChapter(id, weekId, targetChapterId))
        )
        return results.flat()
    }

    // vérifie qu'un nouveau créneau ne chevauche pas un créneau existant du même perso/jour
    async hasOverlap(characterId, weekId, heureDebut, heureFin, excludeScheduleId = null) {
        let query = `
            SELECT COUNT(*) as count FROM schedule
            WHERE character_id = ? AND week_id = ?
            AND heure_debut < ? AND heure_fin > ?
        `
        const params = [characterId, weekId, heureFin, heureDebut]

        if (excludeScheduleId) {
            query += ` AND id != ?`
            params.push(excludeScheduleId)
        }

        const [rows] = await db.query(query, params)
        return rows[0].count > 0
    }

    // redimensionnement du rectangle (drag du bord) : met à jour juste les heures
    async resize(id, heureDebut, heureFin) {
        const [result] = await db.query(
            `UPDATE schedule SET heure_debut = ?, heure_fin = ? WHERE id = ?`,
            [heureDebut, heureFin, id]
        )
        return result.affectedRows
    }

    // déplace TOUTES les activités d'un groupe en appliquant le même nouveau créneau horaire
    // (utilisé quand l'utilisateur choisit "Appliquer partout" après un drag sur une activité groupée)
    async moveAllInGroupe(groupe, heureDebut, heureFin) {
        const [result] = await db.query(
            `UPDATE schedule SET heure_debut = ?, heure_fin = ? WHERE groupe = ?`,
            [heureDebut, heureFin, groupe]
        )
        return result.affectedRows
    }

    // toutes les activités partageant le même numéro de groupe (issues d'une même duplication)
    async findByGroupe(groupe) {
        if (!groupe) return []
        const [rows] = await db.query(`SELECT * FROM schedule WHERE groupe = ?`, [groupe])
        return rows
    }

    // assigne un groupe à une activité qui n'en a pas encore (1ère duplication) :
    // on réutilise simplement son propre id comme numéro de groupe, garanti unique
    async ensureGroupe(scheduleId) {
        const current = await this.findById(scheduleId)
        if (!current) return null
        if (current.groupe) return current.groupe // déjà dans un groupe, rien à faire

        await db.query(`UPDATE schedule SET groupe = ? WHERE id = ?`, [scheduleId, scheduleId])
        return scheduleId
    }
}

module.exports = ScheduleRepository