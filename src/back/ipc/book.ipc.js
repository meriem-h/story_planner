const BaseIPC = require('./baseIpc')
const BookRepository = require('../database/BookRepository')
const ChapterRepository = require('../database/ChapterRepository')
const { ipcMain } = require('electron')

class BookIPC extends BaseIPC {
    constructor() {
        super('book', new BookRepository())
        this.chapterRepo = new ChapterRepository()
        this.custom()
    }

    custom() {
        // supprime le create de base si je veut le remplacer par un create custom
        // ipcMain.removeHandler('task:create')

        // //exemple pour des requette custom et hor base
        // ipcMain.handle('task:create', async (event, {}) => {
        // })

        ipcMain.handle('book:createWithChapter', async (event, data) => {
            try {
              const bookId = await this.repo.create(data)
              const chapterId = await this.chapterRepo.create({
                book_id: bookId,
                title: 'Chapitre 1',
                position: 1
              })
              return { success: true, bookId, chapterId }
            } catch (err) {
              return { success: false, message: err.message }
            }
          })
    }
}

module.exports = new BookIPC()