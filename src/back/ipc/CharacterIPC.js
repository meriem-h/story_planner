const BaseIPC = require('./baseIpc')
const CharacterRepository = require('../database/CharacterRepository')
const { ipcMain } = require('electron')

class CharacterIPC extends BaseIPC {
    constructor() {
        super('characters', new CharacterRepository())
        this.custom()
    }

    custom() {
        // supprime le create de base si je veut le remplacer par un create custom
        // ipcMain.removeHandler('task:create')

        // //exemple pour des requette custom et hor base
        // ipcMain.handle('task:create', async (event, {}) => {
        // })

    }
}

module.exports = new CharacterIPC()