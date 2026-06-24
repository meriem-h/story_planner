const BaseIPC = require('./baseIpc')
const WeekBookRepository = require('../database/WeekBookRepository')
const { ipcMain } = require('electron')

class WeekBookIPC extends BaseIPC {
    constructor() {
        super('weekBook', new WeekBookRepository())
        this.custom()
    }

    custom() {
        // le groupe de jours utilisé par un livre
        ipcMain.handle('weekBook:findByBook', async (_, bookId) => {
            try {
                const data = await this.repo.findByBook(bookId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // les jours (week) prêts à afficher pour ce livre (groupe custom ou défaut)
        ipcMain.handle('weekBook:findDaysForBook', async (_, bookId) => {
            try {
                const data = await this.repo.findDaysForBook(bookId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })
    }
}

module.exports = new WeekBookIPC()