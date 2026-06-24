const BaseIPC = require('./baseIpc')
const OrganizationRepository = require('../database/OrganizationRepository')
const { ipcMain } = require('electron')

class OrganizationIPC extends BaseIPC {
    constructor() {
        super('organization', new OrganizationRepository())
        this.custom()
    }

    custom() {
        // rien de specifique, le CRUD de base (findBy book_id, create, update, delete) suffit
    }
}

module.exports = new OrganizationIPC()