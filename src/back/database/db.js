const path = require('path')
const fs = require('fs')

const envPath = process.resourcesPath
    ? path.join(process.resourcesPath, '.env')
    : path.join(__dirname, '../../.env')
require('dotenv').config({ path: envPath })
require('dotenv').config()

const USE_MYSQL = !!process.env.DB_HOST

let db = null

if (USE_MYSQL) {
    const mysql = require('mysql2/promise')
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
    })
    pool.getConnection()
        .then(conn => { console.log('✅ Connexion MySQL réussie !'); conn.release() })
        .catch(err => console.error('❌ Erreur connexion MySQL :', err.message))
    db = pool

} else {
    const { app } = require('electron')
    const initSqlJs = require('sql.js')
    const migrate = require('./migrate')

    const dbPath = path.join(app.getPath('userData'), 'story_planner.db')
    console.log('📁 SQLite path:', dbPath)

    let sqliteDb = null

    const saveDb = () => {
        if (!sqliteDb) return
        const data = sqliteDb.export()
        fs.writeFileSync(dbPath, Buffer.from(data))
    }

    const dbReady = initSqlJs().then(SQL => {
        if (fs.existsSync(dbPath)) {
            const fileBuffer = fs.readFileSync(dbPath)
            sqliteDb = new SQL.Database(fileBuffer)
            console.log('✅ SQLite chargé depuis :', dbPath)
        } else {
            sqliteDb = new SQL.Database()
            console.log('✅ SQLite nouvelle base créée :', dbPath)
        }
        migrate(sqliteDb)
        saveDb()
        return sqliteDb
    })

    db = {
        _ready: false,
        query: async (sql, params = []) => {
            if (!db._ready) {
                await dbReady
                db._ready = true
            }
            try {
                const sqlTrimmed = sql.trim().toUpperCase()

                if (sqlTrimmed.startsWith('INSERT INTO') && sql.includes(' SET ')) {
                    const table = sql.match(/INSERT INTO (\w+) SET/)[1]
                    const data = params[0]
                    const keys = Object.keys(data)
                    const values = Object.values(data)
                    const placeholders = keys.map(() => '?').join(', ')
                    sqliteDb.run(
                        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
                        values
                    )
                    const insertId = sqliteDb.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0] || 0
                    saveDb()
                    return [{ insertId, affectedRows: 1 }, []]
                }

                if (sqlTrimmed.startsWith('UPDATE') && sql.match(/SET \? WHERE/)) {
                    const match = sql.match(/UPDATE (\w+) SET \? WHERE id = \?/)
                    const table = match[1]
                    const data = params[0]
                    const id = params[1]
                    const keys = Object.keys(data)
                    const values = Object.values(data)
                    const setClause = keys.map(k => `${k} = ?`).join(', ')
                    sqliteDb.run(
                        `UPDATE ${table} SET ${setClause} WHERE id = ?`,
                        [...values, id]
                    )
                    const changes = sqliteDb.exec('SELECT changes() as c')[0]?.values[0][0] || 0
                    saveDb()
                    return [{ affectedRows: changes }, []]
                }

                if (sqlTrimmed.startsWith('SELECT') || sqlTrimmed.startsWith('PRAGMA') || sqlTrimmed.startsWith('WITH')) {
                    const stmt = sqliteDb.prepare(sql)
                    stmt.bind(params)
                    const rows = []
                    while (stmt.step()) {
                        rows.push(stmt.getAsObject())
                    }
                    stmt.free()
                    return [rows, []]
                }

                sqliteDb.run(sql, params)
                const insertId = sqliteDb.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0] || 0
                const changes = sqliteDb.exec('SELECT changes() as c')[0]?.values[0][0] || 0
                saveDb()
                return [{ insertId, affectedRows: changes }, []]

            } catch (err) {
                return Promise.reject(err)
            }
        }
    }
}

module.exports = db