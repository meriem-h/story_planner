const BaseRepository = require('./BaseRepository')
const db = require('./db')

class BookRepository extends BaseRepository {
    constructor() {
        super('books')
    }
}

module.exports = BookRepository