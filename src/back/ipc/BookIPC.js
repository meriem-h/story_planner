const BaseIPC = require('./baseIpc')
const BookRepository = require('../database/BookRepository')
const ChapterRepository = require('../database/ChapterRepository')
const TomeRepository = require('../database/TomeRepository')
const { ipcMain } = require('electron')

class BookIPC extends BaseIPC {
    constructor() {
        super('book', new BookRepository())
        this.chapterRepo = new ChapterRepository()
        this.tomeRepo = new TomeRepository()
        this.custom()
    }

    custom() {
        ipcMain.handle('book:createWithChapter', async (event, data) => {
            try {
                // 1. crée le livre
                const bookId = await this.repo.create(data)

                // 2. crée le tome 1
                const tomeId = await this.tomeRepo.create({
                    book_id: bookId,
                    number: 1,
                    title: 'Tome 1',
                    position: 1
                })

                // 3. crée le chapitre 1 lié au tome
                const chapterId = await this.chapterRepo.create({
                    book_id: bookId,
                    tome_id: tomeId,
                    title: 'Chapitre 1',
                    position: 1
                })

                return { success: true, bookId, tomeId, chapterId }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        // verifie le mot de passe d'un livre prive. Ne renvoie jamais le hash, seulement
        // un booleen "ok" -- c'est tout ce dont le front a besoin pour deverrouiller l'acces.
        ipcMain.handle('book:verifyPassword', async (event, { id, password }) => {
            try {
                const ok = await this.repo.verifyPassword(id, password)
                return { success: true, ok }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })
    }
}

module.exports = new BookIPC()