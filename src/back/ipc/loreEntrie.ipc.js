const BaseIPC = require('./baseIpc')
const LoreEntrieRepository = require('../database/LoreEntrieRepository')
const { ipcMain } = require('electron')

class LoreEntrieIPC extends BaseIPC {
    constructor() {
        super('lore_entrie', new LoreEntrieRepository())
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

module.exports = new LoreEntrieIPC()