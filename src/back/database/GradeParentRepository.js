const BaseRepository = require('./BaseRepository')

class GradeParentRepository extends BaseRepository {
    constructor() {
        super('grade_parent')
    }
}

module.exports = GradeParentRepository