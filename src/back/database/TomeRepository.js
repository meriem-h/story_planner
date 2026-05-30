const BaseRepository = require('./BaseRepository')

class TomeRepository extends BaseRepository {
    constructor() {
        super('tome')
    }
}

module.exports = TomeRepository