// src/back/database/BaseRepository.js
const db = require('./db')

class BaseRepository {
    constructor(table) {
        this.table = table
    }


    // on recupere les champs possible
    async getColumns() {
        const [rows] = await db.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
            [process.env.DB_NAME, this.table]
        )
        return rows.map(row => row.COLUMN_NAME)
    }
    
    // on retire les champs qui ne sont pas disponible en bdd
    async clean(data) {
        const columns = await this.getColumns()
        return Object.fromEntries(
            Object.entries(data).filter(([key]) => columns.includes(key))
        )
    }



    // les requette generique et repetitif
    async findAll() {
        const [rows] = await db.query(`SELECT * FROM ${this.table}`)
        return rows
    }

    async findById(id) {
        const [rows] = await db.query(
            `SELECT * FROM ${this.table} WHERE id = ?`,
            [id]
        )
        return rows[0] || null
    }

    async findBy(conditions) {
        const keys = Object.keys(conditions)
        const where = keys.map(key => `${key} = ?`).join(' AND ')
        const values = Object.values(conditions)
        
        const [rows] = await db.query(
            `SELECT * FROM ${this.table} WHERE ${where}`,
            values
        )
        return rows
    }

    // async findBy(field, value) {

    //     const [rows] = await db.query(
    //         `SELECT * FROM ${this.table} WHERE ${[field]} = ?`,
    //         [value]
    //     )
    //     return rows[0] || null
    // }

    async create(data) {
        const cleanData = await this.clean(data)
        const [result] = await db.query(
            `INSERT INTO ${this.table} SET ?`,
            [cleanData]
        )
        return result.insertId
    }

    async update(id, data) {
        const cleanData = await this.clean(data)
        const [result] = await db.query(
            `UPDATE ${this.table} SET ? WHERE id = ?`,
            [cleanData, id]
        )
        return result.affectedRows
    }

    async delete(id) {
        const [result] = await db.query(
            `DELETE FROM ${this.table} WHERE id = ?`,
            [id]
        )
        return result.affectedRows
    }
}

module.exports = BaseRepository