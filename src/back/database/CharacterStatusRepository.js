const BaseRepository = require('./BaseRepository')
const db = require('./db')

class CharacterStatusRepository extends BaseRepository {
    constructor() {
        super('character_status')
    }

    // tous les statuts d'un personnage (toutes plages confondues), enrichis avec les
    // titres des chapitres bornes pour un affichage direct cote front.
    async findByCharacter(characterId) {
        const [rows] = await db.query(
            `SELECT cs.*, cd.title AS chapter_debut_title, cf.title AS chapter_fin_title
             FROM character_status cs
             LEFT JOIN chapter cd ON cd.id = cs.chapter_id_debut
             LEFT JOIN chapter cf ON cf.id = cs.chapter_id_fin
             WHERE cs.character_id = ?
             ORDER BY cs.id ASC`,
            [characterId]
        )
        return rows
    }

    // labels distincts deja utilises dans ce livre, avec la derniere couleur associee a
    // chaque label -- pour le suggestif cote front (autocomplete "mort, a risque, blesse...").
    // Pas de table de reference separee : on pioche directement dans les statuts existants.
    async findDistinctLabels(bookId) {
        const [rows] = await db.query(
            `SELECT label, color
             FROM character_status cs1
             WHERE book_id = ?
             AND id = (
                SELECT MAX(id) FROM character_status cs2
                WHERE cs2.label = cs1.label AND cs2.book_id = cs1.book_id
             )
             ORDER BY label ASC`,
            [bookId]
        )
        return rows
    }

    // tous les statuts actifs a un chapitre cible donne, pour PLUSIEURS personnages d'un
    // coup (ex: l'arbre genealogique a besoin de savoir qui est mort a ce chapitre, pour
    // tous les persos affiches en une seule requete). Retourne { [characterId]: [statuts] }.
    async getActiveStatusesForCharactersAtChapter(characterIds, targetChapterId) {
        if (!characterIds || characterIds.length === 0) return {}

        const placeholders = characterIds.map(() => '?').join(',')

        if (!targetChapterId) {
            const [rows] = await db.query(
                `SELECT * FROM character_status WHERE character_id IN (${placeholders})`,
                characterIds
            )
            return this.groupByCharacter(rows, characterIds)
        }

        const [rows] = await db.query(
            `SELECT cs.*
             FROM character_status cs
             LEFT JOIN chapter cd ON cd.id = cs.chapter_id_debut
             LEFT JOIN tome td ON td.id = cd.tome_id
             LEFT JOIN chapter cf ON cf.id = cs.chapter_id_fin
             LEFT JOIN tome tf ON tf.id = cf.tome_id
             JOIN chapter target ON target.id = ?
             JOIN tome ttarget ON ttarget.id = target.tome_id
             WHERE cs.character_id IN (${placeholders})
             AND (
                cs.chapter_id_debut IS NULL
                OR (ttarget.number > td.number)
                OR (ttarget.number = td.number AND target.position >= cd.position)
             )
             AND (
                cs.chapter_id_fin IS NULL
                OR (ttarget.number < tf.number)
                OR (ttarget.number = tf.number AND target.position <= cf.position)
             )`,
            [targetChapterId, ...characterIds]
        )
        return this.groupByCharacter(rows, characterIds)
    }

    // regroupe une liste plate de lignes statut par character_id, en garantissant une cle
    // (tableau vide) pour chaque id demande meme s'il n'a aucun statut actif.
    groupByCharacter(rows, characterIds) {
        const result = {}
        characterIds.forEach(id => { result[id] = [] })
        rows.forEach(row => {
            if (!result[row.character_id]) result[row.character_id] = []
            result[row.character_id].push(row)
        })
        return result
    }
}

module.exports = CharacterStatusRepository