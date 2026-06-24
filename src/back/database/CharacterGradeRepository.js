const BaseRepository = require('./BaseRepository')
const db = require('./db')
const ChapterRepository = require('./ChapterRepository')

class CharacterGradeRepository extends BaseRepository {
    constructor() {
        super('character_grade')
        this.chapterRepo = new ChapterRepository()
    }

    // toutes les attributions de grade d'un perso, tous organisations confondues. Enrichi avec
    // le nom de l'organisation et les titres des chapitres bornes, pour un affichage direct
    // cote front sans requetes supplementaires.
    async findByCharacter(characterId) {
        const [rows] = await db.query(
            `SELECT cg.*,
                    g.title AS grade_title, g.organization_id,
                    o.name AS organization_name,
                    cd.title AS chapter_debut_title,
                    cf.title AS chapter_fin_title
             FROM character_grade cg
             JOIN grade g ON g.id = cg.grade_id
             JOIN organization o ON o.id = g.organization_id
             LEFT JOIN chapter cd ON cd.id = cg.chapter_id_debut
             LEFT JOIN chapter cf ON cf.id = cg.chapter_id_fin
             WHERE cg.character_id = ?`,
            [characterId]
        )
        return rows
    }

    // tous les ids de personnages ayant au moins UNE attribution de grade dans cette
    // organisation, peu importe la plage de chapitres concernee. Utilise pour le bouton
    // "selectionner tous les membres de cette organisation" cote front.
    async findCharacterIdsByOrganization(organizationId) {
        const [rows] = await db.query(
            `SELECT DISTINCT cg.character_id
             FROM character_grade cg
             JOIN grade g ON g.id = cg.grade_id
             WHERE g.organization_id = ?`,
            [organizationId]
        )
        return rows.map(r => r.character_id)
    }

    // toutes les attributions d'un perso pour une organisation donnee (optionnellement
    // en excluant une ligne precise, utile lors d'une modification)
    async findByCharacterAndOrganization(characterId, organizationId, excludeId = null) {
        let query = `
            SELECT cg.* FROM character_grade cg
            JOIN grade g ON g.id = cg.grade_id
            WHERE cg.character_id = ? AND g.organization_id = ?
        `
        const params = [characterId, organizationId]
        if (excludeId) {
            query += ` AND cg.id != ?`
            params.push(excludeId)
        }
        const [rows] = await db.query(query, params)
        return rows
    }

    // compare deux plages [aDebut, aFin] et [bDebut, bFin] (chapter ids, nullable) et dit si
    // elles se chevauchent narrativement. NULL = infini de ce cote-la.
    async rangesOverlap(aDebut, aFin, bDebut, bFin) {
        if (!aDebut && !aFin) return true
        if (!bDebut && !bFin) return true

        const aStartsBeforeBEnds = !bFin || !aDebut || !(await this.chapterRepo.isAfter(aDebut, bFin))
        const bStartsBeforeAEnds = !aFin || !bDebut || !(await this.chapterRepo.isAfter(bDebut, aFin))

        return aStartsBeforeBEnds && bStartsBeforeAEnds
    }

    // verifie si une NOUVELLE plage (characterId, organizationId, debut, fin) chevauche une
    // plage existante du MEME perso DANS LA MEME organisation (deux organisations differentes
    // ne se genent jamais, un perso peut avoir un grade chez les Mages ET chez les Verants).
    async hasOverlap(characterId, organizationId, chapterIdDebut, chapterIdFin, excludeId = null) {
        const existing = await this.findByCharacterAndOrganization(characterId, organizationId, excludeId)

        for (const row of existing) {
            const overlap = await this.rangesOverlap(
                chapterIdDebut, chapterIdFin,
                row.chapter_id_debut, row.chapter_id_fin
            )
            if (overlap) return true
        }
        return false
    }

    // attribution "securisee" : verifie l'absence de chevauchement avant insertion
    async assign(characterId, gradeId, organizationId, chapterIdDebut = null, chapterIdFin = null) {
        const conflict = await this.hasOverlap(characterId, organizationId, chapterIdDebut, chapterIdFin)
        if (conflict) {
            throw new Error('Ce personnage a deja un grade attribue sur une plage de chapitres qui chevauche celle-ci, pour cette organisation.')
        }
        return this.create({
            character_id: characterId,
            grade_id: gradeId,
            chapter_id_debut: chapterIdDebut,
            chapter_id_fin: chapterIdFin,
        })
    }

    // mise a jour securisee (memes verifs, en excluant la ligne qu'on modifie)
    async reassign(id, gradeId, chapterIdDebut, chapterIdFin) {
        const current = await this.findById(id)
        if (!current) throw new Error('Attribution introuvable.')

        const [gradeRows] = await db.query(`SELECT organization_id FROM grade WHERE id = ?`, [gradeId])
        const organizationId = gradeRows[0]?.organization_id

        const conflict = await this.hasOverlap(current.character_id, organizationId, chapterIdDebut, chapterIdFin, id)
        if (conflict) {
            throw new Error('Ce personnage a deja un grade attribue sur une plage de chapitres qui chevauche celle-ci, pour cette organisation.')
        }

        return this.update(id, { grade_id: gradeId, chapter_id_debut: chapterIdDebut, chapter_id_fin: chapterIdFin })
    }

    // LE coeur de la feature organigramme : pour un personnage + une organisation + un chapitre
    // cible donne, quel est son grade actuel ? Si aucune ligne ne couvre ce chapitre -> null
    // (= grade le plus bas implicite, gere cote front/affichage).
    async getGradeForCharacterAtChapter(characterId, organizationId, targetChapterId) {
        const [rows] = await db.query(
            `SELECT cg.*, g.title AS grade_title, g.parent_grade_id
             FROM character_grade cg
             JOIN grade g ON g.id = cg.grade_id
             LEFT JOIN chapter cd ON cd.id = cg.chapter_id_debut
             LEFT JOIN tome td ON td.id = cd.tome_id
             LEFT JOIN chapter cf ON cf.id = cg.chapter_id_fin
             LEFT JOIN tome tf ON tf.id = cf.tome_id
             JOIN chapter target ON target.id = ?
             JOIN tome ttarget ON ttarget.id = target.tome_id
             WHERE cg.character_id = ? AND g.organization_id = ?
             AND (
                cg.chapter_id_debut IS NULL
                OR (ttarget.number > td.number)
                OR (ttarget.number = td.number AND target.position >= cd.position)
             )
             AND (
                cg.chapter_id_fin IS NULL
                OR (ttarget.number < tf.number)
                OR (ttarget.number = tf.number AND target.position <= cf.position)
             )
             LIMIT 1`,
            [targetChapterId, characterId, organizationId]
        )
        return rows[0] || null
    }

    // meme chose, mais pour PLUSIEURS personnages d'un coup (vue organigramme avec selection
    // multiple). Retourne un objet { [characterId]: ligne_grade_ou_null }
    async getGradesForCharactersAtChapter(characterIds, organizationId, targetChapterId) {
        const result = {}
        await Promise.all(characterIds.map(async (characterId) => {
            result[characterId] = await this.getGradeForCharacterAtChapter(characterId, organizationId, targetChapterId)
        }))
        return result
    }

    // grade "permanent" (sans filtre chapitre), utile pour un affichage simple type fiche perso
    async getCurrentGrade(characterId, organizationId) {
        const [rows] = await db.query(
            `SELECT cg.*, g.title AS grade_title
             FROM character_grade cg
             JOIN grade g ON g.id = cg.grade_id
             WHERE cg.character_id = ? AND g.organization_id = ?
             ORDER BY cg.chapter_id_debut IS NULL ASC
             LIMIT 1`,
            [characterId, organizationId]
        )
        return rows[0] || null
    }
}

module.exports = CharacterGradeRepository