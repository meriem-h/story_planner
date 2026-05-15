// src/back/ipc/BaseIPC.js
const { ipcMain } = require('electron')

class BaseIPC {
    constructor(name, repository) {
        this.name = name
        this.repo = repository
        this.rootes()
    }

    rootes() {
        ipcMain.handle(`${this.name}:findAll`, async () => {
            try {
                const data = await this.repo.findAll()
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        ipcMain.handle(`${this.name}:findById`, async (event, id) => {
            try {
                const data = await this.repo.findById(id)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        ipcMain.handle(`${this.name}:create`, async (event, data) => {
            try {
                const id = await this.repo.create(data)
                return { success: true, id }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        ipcMain.handle(`${this.name}:update`, async (event, { id, data }) => {
            try {
                const result = await this.repo.update(id, data)
                return { success: true, result }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        ipcMain.handle(`${this.name}:delete`, async (event, id) => {
            try {
                const result = await this.repo.delete(id)
                return { success: true, result }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })

        ipcMain.handle(`${this.name}:findBy`, async (event, conditions) => {
            try {
                const data = await this.repo.findBy(conditions)
                return { success: true, data }
            } catch (err) {
                return { success: false, message: err.message }
            }
        })
    }
}

module.exports = BaseIPC