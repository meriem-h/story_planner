const BaseIPC = require('./baseIpc')
const ScheduleRepository = require('../database/ScheduleRepository')
const { ipcMain } = require('electron')

class ScheduleIPC extends BaseIPC {
    constructor() {
        super('schedule', new ScheduleRepository())
        this.custom()
    }

    custom() {
        // toutes les activités d'un perso (tous jours), triées
        ipcMain.handle('schedule:findByCharacter', async (_, characterId) => {
            try {
                const data = await this.repo.findByCharacter(characterId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // les activités d'un perso pour un seul jour (sans filtre chapitre)
        ipcMain.handle('schedule:findByCharacterAndWeek', async (_, { characterId, weekId }) => {
            try {
                const data = await this.repo.findByCharacterAndWeek(characterId, weekId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // les activités d'un perso pour un jour donné, FILTRÉES par chapitre (plage chapter_id_debut/fin)
        ipcMain.handle('schedule:findByCharacterAndWeekForChapter', async (_, { characterId, weekId, chapterId }) => {
            try {
                const data = await this.repo.findByCharacterAndWeekForChapter(characterId, weekId, chapterId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // vue comparaison multi-persos, filtrée par chapitre
        ipcMain.handle('schedule:findByCharactersAndWeekForChapter', async (_, { characterIds, weekId, chapterId }) => {
            try {
                const data = await this.repo.findByCharactersAndWeekForChapter(characterIds, weekId, chapterId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // vérif de chevauchement avant create/resize d'une activité
        ipcMain.handle('schedule:hasOverlap', async (_, { characterId, weekId, heureDebut, heureFin, excludeScheduleId }) => {
            try {
                const data = await this.repo.hasOverlap(characterId, weekId, heureDebut, heureFin, excludeScheduleId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // redimensionnement du rectangle (drag du bord) : juste les heures
        ipcMain.handle('schedule:resize', async (_, { id, heureDebut, heureFin }) => {
            try {
                const data = await this.repo.resize(id, heureDebut, heureFin)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // toutes les activités du même groupe (issues d'une même duplication)
        ipcMain.handle('schedule:findByGroupe', async (_, groupe) => {
            try {
                const data = await this.repo.findByGroupe(groupe)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // assigne un groupe à une activité qui n'en a pas encore (1ère duplication)
        ipcMain.handle('schedule:ensureGroupe', async (_, scheduleId) => {
            try {
                const data = await this.repo.ensureGroupe(scheduleId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // déplace toutes les activités d'un groupe vers un nouveau créneau horaire commun
        ipcMain.handle('schedule:moveAllInGroupe', async (_, { groupe, heureDebut, heureFin }) => {
            try {
                const data = await this.repo.moveAllInGroupe(groupe, heureDebut, heureFin)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })
    }
}

module.exports = new ScheduleIPC()