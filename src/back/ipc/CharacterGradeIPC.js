const BaseIPC = require('./baseIpc')
const CharacterGradeRepository = require('../database/CharacterGradeRepository')
const { ipcMain } = require('electron')

class CharacterGradeIPC extends BaseIPC {
    constructor() {
        super('characterGrade', new CharacterGradeRepository())
        this.custom()
    }

    custom() {
        // toutes les attributions de grade d'un perso (toutes organisations confondues)
        ipcMain.handle('characterGrade:findByCharacter', async (_, characterId) => {
            try {
                const data = await this.repo.findByCharacter(characterId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // attributions d'un perso pour une organisation donnee
        ipcMain.handle('characterGrade:findByCharacterAndOrganization', async (_, { characterId, organizationId }) => {
            try {
                const data = await this.repo.findByCharacterAndOrganization(characterId, organizationId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // attribution securisee (avec verif anti-chevauchement) d'un grade a un perso
        ipcMain.handle('characterGrade:assign', async (_, { characterId, gradeId, organizationId, chapterIdDebut, chapterIdFin }) => {
            try {
                const id = await this.repo.assign(characterId, gradeId, organizationId, chapterIdDebut, chapterIdFin)
                return { success: true, id }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // modification securisee d'une attribution existante
        ipcMain.handle('characterGrade:reassign', async (_, { id, gradeId, chapterIdDebut, chapterIdFin }) => {
            try {
                const data = await this.repo.reassign(id, gradeId, chapterIdDebut, chapterIdFin)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // LE coeur de la modal organigramme : grade d'un perso a un chapitre donne, pour une organisation
        ipcMain.handle('characterGrade:getGradeForCharacterAtChapter', async (_, { characterId, organizationId, chapterId }) => {
            try {
                const data = await this.repo.getGradeForCharacterAtChapter(characterId, organizationId, chapterId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // meme chose pour plusieurs persos selectionnes a la fois
        ipcMain.handle('characterGrade:getGradesForCharactersAtChapter', async (_, { characterIds, organizationId, chapterId }) => {
            try {
                const data = await this.repo.getGradesForCharactersAtChapter(characterIds, organizationId, chapterId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // tous les ids de personnages membres de cette organisation (au moins une attribution,
        // peu importe la plage de chapitres). Utilise pour le bouton "tout selectionner".
        ipcMain.handle('characterGrade:findCharacterIdsByOrganization', async (_, organizationId) => {
            try {
                const data = await this.repo.findCharacterIdsByOrganization(organizationId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })
    }
}

module.exports = new CharacterGradeIPC()