const BaseIPC = require('./baseIpc')
const TomeRepository = require('../database/TomeRepository')
const ChapterRepository = require('../database/ChapterRepository')
const { ipcMain } = require('electron')

class TomeIPC extends BaseIPC {
    constructor() {
        super('tome', new TomeRepository())
        this.chapterRepo = new ChapterRepository()
        this.custom()
    }

    custom() {
        ipcMain.handle('tome:createWithChapter', async (event, data) => {
            try {
                const tomeId = await this.repo.create(data)
                await this.chapterRepo.create({
                    book_id: data.book_id,
                    tome_id: tomeId,
                    title: 'Chapitre 1',
                    position: 1
                })
                return { success: true, id: tomeId }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })
    }
}

module.exports = new TomeIPC()