const BaseIPC = require('./baseIpc')
const ChapterRepository = require('../database/ChapterRepository')
const { ipcMain } = require('electron')

class CharacterIPC extends BaseIPC {
    constructor() {
        super('character', new ChapterRepository())
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