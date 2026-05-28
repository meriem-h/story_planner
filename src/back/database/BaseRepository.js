// src/back/database/BaseRepository.js
const db = require('./db')

class BaseRepository {
    constructor(table) {
        this.table = table
    }

    async reorder(items) {
        const promises = items.map((item, index) =>
            db.query(`UPDATE ${this.table} SET position = ? WHERE id = ?`, [index + 1, item.id])
        )
        await Promise.all(promises)
        return true
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

    async findAll(joins = []) {
        const hasPosition = await this.getColumns().then(cols => cols.includes('position'))
        const orderBy = hasPosition ? 'ORDER BY position ASC' : ''

        if (joins.length === 0) {
            const [rows] = await db.query(`SELECT * FROM ${this.table} ${orderBy}`)
            return rows
        }

        const joinSQL = joins.map(j =>
            `${j.type || 'LEFT'} JOIN ${j.table} ${j.alias} ON ${j.alias}.${j.on.foreign} = t.${j.on.local}`
        ).join(' ')

        const selectExtra = joins.map(j =>
            j.fields.map(f => `${j.alias}.${f} AS ${j.alias}_${f}`).join(', ')
        ).join(', ')

        const [rows] = await db.query(
            `SELECT t.*, ${selectExtra}
            FROM ${this.table} t
            ${joinSQL}
            ${orderBy}`
        )
        return rows
    }


    async findById(id) {
        const [rows] = await db.query(
            `SELECT * FROM ${this.table} WHERE id = ?`,
            [id]
        )
        return rows[0] || null
    }

    async findBy(conditions, joins = []) {
        const hasPosition = await this.getColumns().then(cols => cols.includes('position'))
        const orderBy = hasPosition ? 'ORDER BY position ASC' : ''

        const keys = Object.keys(conditions)
        const values = Object.values(conditions)

        if (joins.length === 0) {
            const where = keys.map(key => `${key} = ?`).join(' AND ')
            const [rows] = await db.query(
                `SELECT * FROM ${this.table} WHERE ${where} ${orderBy}`,
                values
            )
            return rows
        }

        const where = keys.map(key => `t.${key} = ?`).join(' AND ')

        const joinSQL = joins.map(j =>
            `${j.type || 'LEFT'} JOIN ${j.table} ${j.alias} ON ${j.alias}.${j.on.foreign} = t.${j.on.local}`
        ).join(' ')

        const selectExtra = joins.map(j =>
            j.fields.map(f => `${j.alias}.${f} AS ${j.alias}_${f}`).join(', ')
        ).join(', ')

        const [rows] = await db.query(
            `SELECT t.*, ${selectExtra}
            FROM ${this.table} t
            ${joinSQL}
            WHERE ${where}
            ${orderBy}`,
            values
        )
        return rows
    }

    // async findBy(conditions, joins = []) {
    //     const keys = Object.keys(conditions)
    //     const values = Object.values(conditions)

    //     if (joins.length === 0) {
    //         const where = keys.map(key => `${key} = ?`).join(' AND ')
    //         const [rows] = await db.query(
    //             `SELECT * FROM ${this.table} WHERE ${where}`,
    //             values
    //         )
    //         return rows
    //     }

    //     const where = keys.map(key => `t.${key} = ?`).join(' AND ')

    //     const joinSQL = joins.map(j =>
    //         `${j.type || 'LEFT'} JOIN ${j.table} ${j.alias} ON ${j.alias}.${j.on.foreign} = t.${j.on.local}`
    //     ).join(' ')

    //     const selectExtra = joins.map(j =>
    //         j.fields.map(f => `${j.alias}.${f} AS ${j.alias}_${f}`).join(', ')
    //     ).join(', ')

    //     const [rows] = await db.query(
    //         `SELECT t.*, ${selectExtra}
    //      FROM ${this.table} t
    //      ${joinSQL}
    //      WHERE ${where}`,
    //         values
    //     )
    //     return rows
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