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
            // const result = await snippetRepo.findWithoutTimeline(tomeId)
            const result = await this.repo.findWithoutTimeline(tomeId)
            return { success: true, data: result }
        })

    }
}

module.exports = new SnippetIPC()