const BaseIPC = require('./baseIpc')
const SnippetRepository = require('../database/SnippetRepository')
const { ipcMain } = require('electron')

class SnippetIPC extends BaseIPC {
    constructor() {
        super('snippet', new SnippetRepository())
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

module.exports = new SnippetIPC()