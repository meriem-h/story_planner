const BaseRepository = require('./BaseRepository')
const db = require('./db')

class NoteRepository extends BaseRepository {
    constructor() {
        super('note')
    }
}

module.exports = NoteRepository