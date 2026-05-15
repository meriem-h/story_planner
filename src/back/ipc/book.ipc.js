const BaseIPC = require('./baseIpc')
const BookRepository = require('../database/BookRepository')
const { ipcMain } = require('electron')

class BookIPC extends BaseIPC {
    constructor() {
        super('book', new BookRepository())
        this.custom()
    }

    custom() {

        // supprime le create de base si je veut le remplacer par un create custom
        // ipcMain.removeHandler('book:create')

        // //exemple pour des requette custom et hor base
        // ipcMain.handle('book:login', async (event, { email, password }) => {
        //     try {
        //         const book = await this.repo.findByEmail(email)
        //         if (!book) return { success: false, type: "email", message: 'Utilisateur introuvable' }
        
        //         const isValid = await this.repo.verifyPassword(password, book.password)
        //         if (!isValid) return { success: false, type: "password", message: 'Mot de passe incorrect' }
        
        //         const { password: _, ...safeBook } = book
        //         return { success: true, book: safeBook }
        
        //     } catch (err) {
        //         return { success: false, message: err.message }
        //     }
        // })
        
    }
}

module.exports = new BookIPC()