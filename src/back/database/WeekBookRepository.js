const BaseRepository = require('./BaseRepository')
const db = require('./db')
const WeekRepository = require('./WeekRepository')

class WeekBookRepository extends BaseRepository {
    constructor() {
        super('week_book')
        this.weekRepo = new WeekRepository()
    }

    // le groupe de jours utilisé par un livre donné
    async findByBook(bookId) {
        const [rows] = await db.query(
            `SELECT * FROM week_book WHERE book_id = ?`,
            [bookId]
        )
        return rows[0] || null
    }

    // pratique : récupère direct les jours (week) utilisés par ce livre,
    // sans que le front ait à faire 2 appels (findByBook puis WeekRepository.findByGroupe)
    async findDaysForBook(bookId) {
        const weekBook = await this.findByBook(bookId)

        // si aucun groupe custom défini pour ce livre, on retombe sur le groupe 1 (les 7 jours classiques)
        const groupe = weekBook ? weekBook.groupe : 1

        return this.weekRepo.findByGroupe(groupe)
    }
}

module.exports = WeekBookRepository