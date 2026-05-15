const BaseIPC = require('./baseIpc')
const ChapterRepository = require('../database/ChapterRepository')
const { ipcMain } = require('electron')

class ChapterIPC extends BaseIPC {
    constructor() {
        super('chapter', new ChapterRepository())
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

module.exports = new ChapterIPC()