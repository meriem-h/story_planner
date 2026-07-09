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

        // Option A : insère un nouveau chapitre après l'actuel et déplace les items >= position
        ipcMain.handle('chapter:splitInsertAfter', async (_, { chapterIdActuel, itemPosition, newTitle }) => {
            try {
                const newChapter = await this.repo.insertAfter(chapterIdActuel, newTitle)
                await this.repo.moveTimelineItems(chapterIdActuel, newChapter.id, itemPosition)
                return { success: true, data: newChapter }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // Option B : crée un chapitre à la fin et décale tous les items en cascade
        ipcMain.handle('chapter:splitCascade', async (_, { tomeId, bookId, chaptersOrdered, itemPosition, currentChapterId, newTitle }) => {
            try {
                // crée le chapitre vide à la fin
                const newChapter = await this.repo.appendToTome(tomeId, bookId, newTitle)

                // chaptersOrdered = liste des chapitres du tome triés par position ASC
                // on parcourt à l'envers : chaque chapitre passe ses items au suivant
                // on s'arrête au chapitre actuel (inclus pour les items >= itemPosition)
                for (let i = chaptersOrdered.length - 1; i >= 0; i--) {
                    const ch = chaptersOrdered[i]
                    const nextCh = chaptersOrdered[i + 1] || newChapter

                    if (ch.id === currentChapterId) {
                        // uniquement les items >= position de l'item cliqué
                        await this.repo.moveTimelineItems(ch.id, nextCh.id, itemPosition)
                        break
                    } else if (i > chaptersOrdered.findIndex(c => c.id === currentChapterId)) {
                        // chapitres après le chapitre actuel : tous leurs items cascadent
                        await this.repo.moveTimelineItems(ch.id, nextCh.id, 0)
                    }
                }

                return { success: true, data: newChapter }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })
    }
}

module.exports = new ChapterIPC()