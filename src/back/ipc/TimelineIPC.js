const { ipcMain } = require('electron')
const BaseIPC = require('./baseIpc')
const TimelineRepository = require('../database/TimelineRepository')



class TimelineIPC extends BaseIPC {
    constructor() {
        super('timeline', new TimelineRepository())
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

module.exports = new TimelineIPC()
