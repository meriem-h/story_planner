const BaseIPC = require('./baseIpc')
const FamilyRepository = require('../database/FamilyRepository')

class FamilyIPC extends BaseIPC {
    constructor() {
        super('family', new FamilyRepository())
        this.custom()
    }

    custom() {
        // rien de specifique, le CRUD de base (findBy book_id, create, update, delete) suffit
    }
}

module.exports = new FamilyIPC()