const BaseIPC = require('./baseIpc')
const ChapterRepository = require('../database/ChapterRepository')
const { ipcMain } = require('electron')

class ChapterIPC extends BaseIPC {
    constructor() {
        super('chapter', new ChapterRepository())
        this.custom()
    }

    custom() {
        ipcMain.handle('chapter:countChaptersBetween', async (_, { chapterIdDebut, chapterIdFin }) => {
            try {
                const data = await this.repo.countChaptersBetween(chapterIdDebut, chapterIdFin)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        ipcMain.handle('chapter:splitInsertAfter', async (_, { chapterIdActuel, itemPosition, newTitle }) => {
            try {
                const newChapter = await this.repo.insertAfter(chapterIdActuel, newTitle)
                await this.repo.moveTimelineItems(chapterIdActuel, newChapter.id, itemPosition)
                return { success: true, data: newChapter }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        ipcMain.handle('chapter:splitCascade', async (_, { tomeId, bookId, chaptersOrdered, itemPosition, currentChapterId, newTitle }) => {
            try {
                const newChapter = await this.repo.appendToTome(tomeId, bookId, newTitle)

                for (let i = chaptersOrdered.length - 1; i >= 0; i--) {
                    const ch = chaptersOrdered[i]
                    const nextCh = chaptersOrdered[i + 1] || newChapter

                    if (ch.id === currentChapterId) {
                        await this.repo.moveTimelineItems(ch.id, nextCh.id, itemPosition)
                        break
                    } else if (i > chaptersOrdered.findIndex(c => c.id === currentChapterId)) {
                        await this.repo.moveTimelineItems(ch.id, nextCh.id, 0)
                    }
                }

                return { success: true, data: newChapter }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        ipcMain.handle('chapter:createVariant', async (_, { chapterId, copyContent, isAdult }) => {
            try {
                const data = await this.repo.createVariant(chapterId, copyContent, isAdult)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })
    }
}

module.exports = new ChapterIPC()