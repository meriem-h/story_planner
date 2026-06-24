const BaseRepository = require('./BaseRepository')

class OrganizationRepository extends BaseRepository {
    constructor() {
        super('organization')
    }
}

module.exports = OrganizationRepository