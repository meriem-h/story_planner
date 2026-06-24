const BaseIPC = require('./baseIpc')
const GradeRepository = require('../database/GradeRepository')
const { ipcMain } = require('electron')

class GradeIPC extends BaseIPC {
    constructor() {
        super('grade', new GradeRepository())
        this.custom()
    }

    custom() {
        // liste plate des grades d'une organisation, triee par position
        ipcMain.handle('grade:findByOrganization', async (_, organizationId) => {
            try {
                const data = await this.repo.findByOrganization(organizationId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // l'arbre complet (avec children) d'une organisation, pret a etre dessine
        ipcMain.handle('grade:getTree', async (_, organizationId) => {
            try {
                const data = await this.repo.getTree(organizationId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // reordonne une fratrie (memes parent_grade_id) apres un drag and drop
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