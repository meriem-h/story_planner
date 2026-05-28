const BaseRepository = require('./BaseRepository')

class CharacterTypeRepository extends BaseRepository {
    constructor() {
        super('character_type')
    }
}

module.exports = CharacterTypeRepository