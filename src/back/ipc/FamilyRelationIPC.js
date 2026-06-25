const BaseIPC = require('./baseIpc')
const FamilyRelationRepository = require('../database/FamilyRelationRepository')
const { ipcMain } = require('electron')

class FamilyRelationIPC extends BaseIPC {
    constructor() {
        super('familyRelation', new FamilyRelationRepository())
        this.custom()
    }

    custom() {
        // toutes les relations d'un arbre, a plat (le front reconstruit l'affichage)
        ipcMain.handle('familyRelation:findByFamily', async (_, familyId) => {
            try {
                const data = await this.repo.findByFamily(familyId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // historique complet d'un couple (toutes les etapes couple/fiance/marie/divorce)
        ipcMain.handle('familyRelation:findCoupleHistory', async (_, { familyId, characterId1, characterId2 }) => {
            try {
                const data = await this.repo.findCoupleHistory(familyId, characterId1, characterId2)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // l'etape de couple active a un chapitre cible donne
        ipcMain.handle('familyRelation:getCoupleStatusAtChapter', async (_, { familyId, characterId1, characterId2, targetChapterId }) => {
            try {
                const data = await this.repo.getCoupleStatusAtChapter(familyId, characterId1, characterId2, targetChapterId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })
    }
}

module.exports = new FamilyRelationIPC()