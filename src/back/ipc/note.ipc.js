const BaseIPC = require('./baseIpc')
const NoteRepository = require('../database/NoteRepository')
const { ipcMain } = require('electron')

class NoteIPC extends BaseIPC {
    constructor() {
        super('note', new NoteRepository())
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

module.exports = new NoteIPC()