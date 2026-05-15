const BaseRepository = require('./BaseRepository')
const db = require('./db')

class SnippetRepository extends BaseRepository {
    constructor() {
        super('snippet')
    }
}

module.exports = SnippetRepository