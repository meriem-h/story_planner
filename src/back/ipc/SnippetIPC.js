const BaseIPC = require('./baseIpc')
const SnippetRepository = require('../database/SnippetRepository')
const { ipcMain } = require('electron')

class SnippetIPC extends BaseIPC {
    constructor() {
        super('snippet', new SnippetRepository())
        this.custom()
    }

    custom() {
        ipcMain.handle('snippet:findWithoutTimeline', async (_, tomeId) => {
            const result = await this.repo.findWithoutTimeline(tomeId)
            return { success: true, data: result }
        })

        ipcMain.handle('snippet:createVersion', async (_, snippetId) => {
            try {
                const id = await this.repo.createVersion(snippetId)
                return { success: true, id }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        ipcMain.handle('snippet:setDefault', async (_, { id, version_group }) => {
            try {
                await this.repo.setDefault(id, version_group)
                return { success: true }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })
    }
}

module.exports = new SnippetIPC()