const BaseRepository = require('./BaseRepository')
const db = require('./db')

class CharacterRepository extends BaseRepository {
    constructor() {
        super('characters')
        this.joins = [
            {
                table: 'character_type',
                alias: 'ct',
                on: { foreign: 'id', local: 'type_id' },
                fields: ['label', 'icon']
            }
        ]
    }

    async findAll() {
        return super.findAll(this.joins)
    }

    async findBy(conditions) {
        return super.findBy(conditions, this.joins)
    }
}

module.exports = CharacterRepository