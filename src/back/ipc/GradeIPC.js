const BaseIPC = require('./baseIpc')
const GradeRepository = require('../database/GradeRepository')
const { ipcMain } = require('electron')

class GradeIPC extends BaseIPC {
    constructor() {
        super('grade', new GradeRepository())
        this.custom()
    }

    custom() {
        ipcMain.handle('grade:findByOrganization', async (_, organizationId) => {
            try {
                const data = await this.repo.findByOrganization(organizationId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        ipcMain.handle('grade:getTree', async (_, organizationId) => {
            try {
                const data = await this.repo.getTree(organizationId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        ipcMain.handle('grade:reorderSiblings', async (_, items) => {
            try {
                await this.repo.reorderSiblings(items)
                return { success: true }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })
    }
}

module.exports = new GradeIPC()