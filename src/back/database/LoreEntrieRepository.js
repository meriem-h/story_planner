const BaseRepository = require('./BaseRepository')
const db = require('./db')

class LoreEntrieRepository extends BaseRepository {
    constructor() {
        super('lore_entrie')
    }
}

module.exports = LoreEntrieRepository