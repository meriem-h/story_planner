const BaseIPC = require('./baseIpc')
const WeekRepository = require('../database/WeekRepository')
const { ipcMain } = require('electron')

class WeekIPC extends BaseIPC {
    constructor() {
        super('week', new WeekRepository())
        this.custom()
    }

    custom() {
        // tous les jours d'un groupe donné, triés
        ipcMain.handle('week:findByGroupe', async (_, groupe) => {
            try {
                const data = await this.repo.findByGroupe(groupe)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })
    }
}

module.exports = new WeekIPC()