const BaseRepository = require('./BaseRepository')
const db = require('./db')
const ChapterRepository = require('./ChapterRepository')

// les relations dont le sens (1 -> 2) compte (1 = parent, 2 = enfant). Pour les autres
// (fratrie, demi_fratrie, couple, fiance, marie, divorce), 1 et 2 sont interchangeables.
const ORDERED_RELATIONS = ['parent_enfant']

// les statuts successifs d'une relation de couple, dans l'ordre narratif. Utilise pour
// regrouper plusieurs lignes (une par etape) sous un seul "couple" cote front.
const COUPLE_STATUSES = ['couple', 'fiance', 'marie', 'divorce']

class FamilyRelationRepository extends BaseRepository {
    constructor() {
        super('family_relation')
        this.chapterRepo = new ChapterRepository()
    }

    // toutes les relations d'un arbre, a plat. Le tri/regroupement par type se fait
    // cote front (logique d'affichage), ce repository fournit juste la donnee brute.
    async findByFamily(familyId) {
        const [rows] = await db.query(
            `SELECT * FROM family_relation WHERE family_id = ? ORDER BY id ASC`,
            [familyId]
        )
        return rows
    }

    // verifie qu'une paire de personnages n'a pas deja EXACTEMENT cette relation dans cet
    // arbre (peu importe l'ordre 1/2 pour les relations symetriques). N'empeche pas une
    // paire d'avoir PLUSIEURS relations differentes, ni plusieurs etapes de couple
    // (couple puis marie -- chapter_id differents).
    async findExisting(familyId, characterId1, characterId2, relation, excludeId = null) {
        let query = `
            SELECT * FROM family_relation
            WHERE family_id = ? AND relation = ?
            AND (
                (character_id_1 = ? AND character_id_2 = ?)
                ${ORDERED_RELATIONS.includes(relation) ? '' : 'OR (character_id_1 = ? AND character_id_2 = ?)'}
            )
        `
        const params = ORDERED_RELATIONS.includes(relation)
            ? [familyId, relation, characterId1, characterId2]
            : [familyId, relation, characterId1, characterId2, characterId2, characterId1]

        if (excludeId) {
            query += ` AND id != ?`
            params.push(excludeId)
        }

        const [rows] = await db.query(query, params)
        return rows
    }

    // empeche d'enregistrer deux fois la meme relation simple (parent_enfant, fratrie,
    // demi_fratrie -- celles qui n'ont pas de notion d'etapes/chapitres). Les relations de
    // couple sont volontairement exclues de cette regle : plusieurs lignes (couple puis
    // fiance puis marie) sont normales et attendues pour un meme couple.
    async create(data) {
        if (!COUPLE_STATUSES.includes(data.relation)) {
            const existing = await this.findExisting(data.family_id, data.character_id_1, data.character_id_2, data.relation)
            if (existing.length > 0) {
                throw new Error('Cette relation existe deja entre ces deux personnages.')
            }
        }
        if (data.character_id_1 === data.character_id_2) {
            throw new Error('Un personnage ne peut pas avoir de relation avec lui-meme.')
        }
        return super.create(data)
    }

    async update(id, data) {
        if (data.character_id_1 && data.character_id_2 && data.character_id_1 === data.character_id_2) {
            throw new Error('Un personnage ne peut pas avoir de relation avec lui-meme.')
        }
        return super.update(id, data)
    }

    // toutes les lignes de couple (n'importe quel statut) entre deux personnages precis,
    // dans cet arbre. Utilise pour reconstruire l'historique complet d'un couple (popup
    // d'edition : "ils sont passes par couple -> fiance -> marie").
    async findCoupleHistory(familyId, characterId1, characterId2) {
        const [rows] = await db.query(
            `SELECT fr.*, cd.title AS chapter_debut_title, cf.title AS chapter_fin_title
             FROM family_relation fr
             LEFT JOIN chapter cd ON cd.id = fr.chapter_id_debut
             LEFT JOIN chapter cf ON cf.id = fr.chapter_id_fin
             WHERE fr.family_id = ?
             AND fr.relation IN ('couple','fiance','marie','divorce')
             AND (
                (fr.character_id_1 = ? AND fr.character_id_2 = ?)
                OR (fr.character_id_1 = ? AND fr.character_id_2 = ?)
             )
             ORDER BY fr.id ASC`,
            [familyId, characterId1, characterId2, characterId2, characterId1]
        )
        return rows
    }

    // pour un couple (paire de persos), quelle etape (couple/fiance/marie/divorce) est
    // active a un chapitre cible donne ? Meme logique que CharacterGradeRepository.
    // getGradeForCharacterAtChapter : compare la position narrative (tome.number puis
    // chapter.position) du chapitre cible aux bornes [chapter_id_debut, chapter_id_fin]
    // de chaque etape, et retourne celle qui couvre ce chapitre. NULL = pas encore en
    // couple a ce chapitre (aucune etape ne le couvre).
    async getCoupleStatusAtChapter(familyId, characterId1, characterId2, targetChapterId) {
        if (!targetChapterId) {
            // pas de chapitre cible -> on prend la derniere etape enregistree (la plus
            // avancee narrativement), utile pour un affichage "etat actuel" hors contexte
            const history = await this.findCoupleHistory(familyId, characterId1, characterId2)
            return history[history.length - 1] || null
        }

        const [rows] = await db.query(
            `SELECT fr.*
             FROM family_relation fr
             LEFT JOIN chapter cd ON cd.id = fr.chapter_id_debut
             LEFT JOIN tome td ON td.id = cd.tome_id
             LEFT JOIN chapter cf ON cf.id = fr.chapter_id_fin
             LEFT JOIN tome tf ON tf.id = cf.tome_id
             JOIN chapter target ON target.id = ?
             JOIN tome ttarget ON ttarget.id = target.tome_id
             WHERE fr.family_id = ?
             AND fr.relation IN ('couple','fiance','marie','divorce')
             AND (
                (fr.character_id_1 = ? AND fr.character_id_2 = ?)
                OR (fr.character_id_1 = ? AND fr.character_id_2 = ?)
             )
             AND (
                fr.chapter_id_debut IS NULL
                OR (ttarget.number > td.number)
                OR (ttarget.number = td.number AND target.position >= cd.position)
             )
             AND (
                fr.chapter_id_fin IS NULL
                OR (ttarget.number < tf.number)
                OR (ttarget.number = tf.number AND target.position <= cf.position)
             )
             ORDER BY fr.chapter_id_debut IS NULL ASC, fr.id DESC
             LIMIT 1`,
            [targetChapterId, familyId, characterId1, characterId2, characterId2, characterId1]
        )
        return rows[0] || null
    }
}

module.exports = FamilyRelationRepository