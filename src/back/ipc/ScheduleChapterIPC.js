const BaseIPC = require('./baseIpc')
const ScheduleChapterRepository = require('../database/ScheduleChapterRepository')
const { ipcMain } = require('electron')

class ScheduleChapterIPC extends BaseIPC {
    constructor() {
        super('scheduleChapter', new ScheduleChapterRepository())
        this.custom()
    }

    custom() {
        // les chapitres liés à un planning (une activité) donné
        ipcMain.handle('scheduleChapter:findBySchedule', async (_, scheduleId) => {
            try {
                const data = await this.repo.findBySchedule(scheduleId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // les liens existants pour un chapitre donné (tous persos confondus)
        ipcMain.handle('scheduleChapter:findByChapter', async (_, chapterId) => {
            try {
                const data = await this.repo.findByChapter(chapterId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // lier un planning à un seul chapitre (avec vérif anti-conflit intégrée)
        ipcMain.handle('scheduleChapter:linkChapter', async (_, { scheduleId, chapterId, characterId }) => {
            try {
                const id = await this.repo.linkChapter(scheduleId, chapterId, characterId)
                return { success: true, id }
            } catch (err) {
                // err.message contient le message clair "Ce chapitre est déjà lié..."
                return { success: false, message: err.message }
            }
        })

        // lier un planning à plusieurs chapitres d'un coup (sélection de plage)
        ipcMain.handle('scheduleChapter:linkChapters', async (_, { scheduleId, chapterIds, characterId }) => {
            try {
                const ids = await this.repo.linkChapters(scheduleId, chapterIds, characterId)
                return { success: true, ids }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // retire tous les chapitres liés à un planning
        ipcMain.handle('scheduleChapter:clearForSchedule', async (_, scheduleId) => {
            try {
                const data = await this.repo.clearForSchedule(scheduleId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })
    }
}

module.exports = new ScheduleChapterIPC()