const BaseRepository = require('./BaseRepository')
const db = require('./db')

class SnippetRepository extends BaseRepository {
    constructor() {
        super('snippet')
    }

    async findWithoutTimeline(tomeId) {
    const [rows] = await db.query(`
        SELECT s.* FROM snippet s
        LEFT JOIN timeline_item t ON t.snippet_id = s.id
        WHERE t.id IS NULL AND s.tome_id = ?
        ORDER BY s.position ASC
    `, [tomeId])
    return rows
}
}

module.exports = SnippetRepository