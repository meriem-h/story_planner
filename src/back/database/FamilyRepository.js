const BaseRepository = require('./BaseRepository')

class FamilyRepository extends BaseRepository {
    constructor() {
        super('family')
    }
}

module.exports = FamilyRepository