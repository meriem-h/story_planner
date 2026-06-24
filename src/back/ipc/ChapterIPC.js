const BaseIPC = require('./baseIpc')
const ChapterRepository = require('../database/ChapterRepository')
const { ipcMain } = require('electron')

class ChapterIPC extends BaseIPC {
    constructor() {
        super('chapter', new ChapterRepository())
        this.custom()
    }

    custom() {
        // compte le nombre de chapitres entre 2 bornes (inclus) -> sert à mesurer
        // la "longueur" d'une plage chapter_id_debut -> chapter_id_fin sur une activité
        ipcMain.handle('chapter:countChaptersBetween', async (_, { chapterIdDebut, chapterIdFin }) => {
            try {
                const data = await this.repo.countChaptersBetween(chapterIdDebut, chapterIdFin)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })
    }
}

module.exports = new ChapterIPC()