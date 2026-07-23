const BaseIPC = require('./baseIpc')
const GradeParentRepository = require('../database/GradeParentRepository')

class GradeParentIPC extends BaseIPC {
    constructor() {
        super('gradeParent', new GradeParentRepository())
    }
}

module.exports = new GradeParentIPC()