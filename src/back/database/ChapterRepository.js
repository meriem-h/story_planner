const BaseRepository = require('./BaseRepository')
const db = require('./db')

class ChapterRepository extends BaseRepository {
    constructor() {
        super('chapter')
    }
}

module.exports = ChapterRepository