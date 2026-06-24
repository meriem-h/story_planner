const BaseRepository = require('./BaseRepository')
const db = require('./db')

class WeekRepository extends BaseRepository {
    constructor() {
        super('week')
    }

    // tous les jours d'un groupe donné, triés par leur ordre d'affichage
    // (override car BaseRepository trie par `position`, ici la colonne s'appelle `order`)
    async findByGroupe(groupe) {
        const [rows] = await db.query(
            `SELECT * FROM \`week\` WHERE groupe = ? ORDER BY \`order\` ASC`,
            [groupe]
        )
        return rows
    }
}

module.exports = WeekRepository