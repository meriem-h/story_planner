const BaseRepository = require('./BaseRepository')

class AssetRepository extends BaseRepository {
    constructor() {
        super('asset')
    }
}

module.exports = AssetRepository