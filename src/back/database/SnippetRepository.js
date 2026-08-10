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

    async createVersion({ snippetId, label = null }) {
        const original = await this.findById(snippetId)
        if (!original) return null

        // calcul du version_group
        let groupId = original.version_group
        if (!groupId) {
            const [rows] = await db.query(`SELECT MAX(version_group) as maxGroup FROM snippet`)
            groupId = (rows[0].maxGroup || 0) + 1
            // on assigne le group au snippet original
            await this.update(snippetId, { version_group: groupId, is_default: 1, version_label: '1' })
        }

        // calcul du prochain label
        const [siblings] = await db.query(
            `SELECT COUNT(*) as total FROM snippet WHERE version_group = ?`,
            [groupId]
        )


        if (!label) {
            label = String(siblings[0].total + 1)
        }

        return await this.duplicate(snippetId, {
            content: '',
            version_label: label,
            is_default: 0,
            version_group: groupId
        })
    }

    async setDefault(id, version_group) {
        await db.query(`UPDATE snippet SET is_default = 0 WHERE version_group = ?`, [version_group])
        await db.query(`UPDATE snippet SET is_default = 1 WHERE id = ?`, [id])
    }

    async delete(id) {
        const snippet = await this.findById(id)

        if (snippet && snippet.is_default == 1 && snippet.version_group) {
            // trouver une autre version du même groupe
            const [rows] = await db.query(
                `SELECT id FROM snippet WHERE version_group = ? AND id != ? LIMIT 1`,
                [snippet.version_group, id]
            )
            if (rows.length > 0) {
                await db.query(`UPDATE snippet SET is_default = 1 WHERE id = ?`, [rows[0].id])
            }
        }

        const [result] = await db.query(`DELETE FROM snippet WHERE id = ?`, [id])
        return result.affectedRows
    }
}

module.exports = SnippetRepository