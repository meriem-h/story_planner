const BaseRepository = require('./BaseRepository')
const db = require('./db')

class CharacterRepository extends BaseRepository {
    constructor() {
        super('characters')
    }
}

module.exports = CharacterRepository