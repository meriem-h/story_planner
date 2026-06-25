const BaseIPC = require('./baseIpc')
const CharacterStatusRepository = require('../database/CharacterStatusRepository')
const { ipcMain } = require('electron')

class CharacterStatusIPC extends BaseIPC {
    constructor() {
        super('characterStatus', new CharacterStatusRepository())
        this.custom()
    }

    custom() {
        // tous les statuts d'un personnage (toutes plages confondues)
        ipcMain.handle('characterStatus:findByCharacter', async (_, characterId) => {
            try {
                const data = await this.repo.findByCharacter(characterId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // labels deja utilises dans ce livre, pour l'autocomplete cote front
        ipcMain.handle('characterStatus:findDistinctLabels', async (_, bookId) => {
            try {
                const data = await this.repo.findDistinctLabels(bookId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // statuts actifs a un chapitre cible, pour plusieurs personnages d'un coup
        ipcMain.handle('characterStatus:getActiveStatusesForCharactersAtChapter', async (_, { characterIds, targetChapterId }) => {
            try {
                const data = await this.repo.getActiveStatusesForCharactersAtChapter(characterIds, targetChapterId)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })
    }
}

module.exports = new CharacterStatusIPC()