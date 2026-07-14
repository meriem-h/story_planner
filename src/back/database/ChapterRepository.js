const BaseRepository = require('./BaseRepository')
const db = require('./db')

class ChapterRepository extends BaseRepository {
    constructor() {
        super('chapter')
    }

    async findNextChapter(chapterId) {
        const current = await this.findById(chapterId)
        if (!current) return null

        const [sameBook] = await db.query(
            `SELECT c.* FROM chapter c
             WHERE c.tome_id = ? AND c.position > ?
             ORDER BY c.position ASC LIMIT 1`,
            [current.tome_id, current.position]
        )
        if (sameBook[0]) return sameBook[0]

        const [nextTome] = await db.query(
            `SELECT c.* FROM chapter c
             JOIN tome t ON t.id = c.tome_id
             WHERE c.book_id = ?
             AND t.number > (SELECT number FROM tome WHERE id = ?)
             ORDER BY t.number ASC, c.position ASC LIMIT 1`,
            [current.book_id, current.tome_id]
        )
        return nextTome[0] || null
    }

    async findPreviousChapter(chapterId) {
        const current = await this.findById(chapterId)
        if (!current) return null

        const [sameBook] = await db.query(
            `SELECT c.* FROM chapter c
             WHERE c.tome_id = ? AND c.position < ?
             ORDER BY c.position DESC LIMIT 1`,
            [current.tome_id, current.position]
        )
        if (sameBook[0]) return sameBook[0]

        const [prevTome] = await db.query(
            `SELECT c.* FROM chapter c
             JOIN tome t ON t.id = c.tome_id
             WHERE c.book_id = ?
             AND t.number < (SELECT number FROM tome WHERE id = ?)
             ORDER BY t.number DESC, c.position DESC LIMIT 1`,
            [current.book_id, current.tome_id]
        )
        return prevTome[0] || null
    }

    async isAfter(chapterIdA, chapterIdB) {
        const [rows] = await db.query(
            `SELECT
                (ta.number > tb.number OR (ta.number = tb.number AND ca.position > cb.position)) AS is_after
             FROM chapter ca
             JOIN tome ta ON ta.id = ca.tome_id
             JOIN chapter cb ON cb.id = ?
             JOIN tome tb ON tb.id = cb.tome_id
             WHERE ca.id = ?`,
            [chapterIdB, chapterIdA]
        )
        return !!rows[0]?.is_after
    }

    async countChaptersBetween(chapterIdDebut, chapterIdFin) {
        const [rows] = await db.query(
            `SELECT COUNT(*) as count
             FROM chapter c
             JOIN tome t ON t.id = c.tome_id
             JOIN chapter cd ON cd.id = ?
             JOIN tome td ON td.id = cd.tome_id
             JOIN chapter cf ON cf.id = ?
             JOIN tome tf ON tf.id = cf.tome_id
             WHERE c.book_id = cd.book_id
             AND (t.number > td.number OR (t.number = td.number AND c.position >= cd.position))
             AND (t.number < tf.number OR (t.number = tf.number AND c.position <= cf.position))`,
            [chapterIdDebut, chapterIdFin]
        )
        return rows[0]?.count || 0
    }

    async reorder(items) {
        const result = await super.reorder(items)

        const [schedulesWithRange] = await db.query(
            `SELECT * FROM schedule WHERE chapter_id_debut IS NOT NULL AND chapter_id_fin IS NOT NULL`
        )

        for (const sched of schedulesWithRange) {
            const broken = await this.isAfter(sched.chapter_id_debut, sched.chapter_id_fin)
            if (broken) {
                await db.query(`DELETE FROM schedule WHERE id = ?`, [sched.id])
            }
        }

        return result
    }

    async delete(id) {
        const [affected] = await db.query(
            `SELECT * FROM schedule WHERE chapter_id_debut = ? OR chapter_id_fin = ?`,
            [id, id]
        )

        for (const sched of affected) {
            const isDebut = sched.chapter_id_debut === id
            const isFin = sched.chapter_id_fin === id

            if (isDebut && isFin) {
                await db.query(`DELETE FROM schedule WHERE id = ?`, [sched.id])
                continue
            }

            let newDebut = sched.chapter_id_debut
            let newFin = sched.chapter_id_fin

            if (isDebut) {
                const next = await this.findNextChapter(id)
                newDebut = next ? next.id : null
            }
            if (isFin) {
                const prev = await this.findPreviousChapter(id)
                newFin = prev ? prev.id : null
            }

            const rangeBroken =
                (newDebut === null && sched.chapter_id_debut !== null) ||
                (newFin === null && sched.chapter_id_fin !== null) ||
                (newDebut && newFin && await this.isAfter(newDebut, newFin))

            if (rangeBroken) {
                await db.query(`DELETE FROM schedule WHERE id = ?`, [sched.id])
            } else {
                await db.query(
                    `UPDATE schedule SET chapter_id_debut = ?, chapter_id_fin = ? WHERE id = ?`,
                    [newDebut, newFin, sched.id]
                )
            }
        }

        // casser le lien du jumeau avant de supprimer
        await db.query(
            `UPDATE chapter SET paired_chapter_id = NULL WHERE paired_chapter_id = ?`,
            [id]
        )

        return super.delete(id)
    }

    async insertAfter(chapterIdActuel, title) {
        const current = await this.findById(chapterIdActuel)
        if (!current) throw new Error('Chapitre introuvable')

        await db.query(
            `UPDATE chapter SET position = position + 1 WHERE tome_id = ? AND position > ?`,
            [current.tome_id, current.position]
        )

        const newPosition = current.position + 1
        const [result] = await db.query(
            `INSERT INTO chapter (book_id, tome_id, title, position) VALUES (?, ?, ?, ?)`,
            [current.book_id, current.tome_id, title, newPosition]
        )
        return this.findById(result.insertId)
    }

    async appendToTome(tomeId, bookId, title) {
        const [rows] = await db.query(
            `SELECT COALESCE(MAX(position), 0) as maxPos FROM chapter WHERE tome_id = ?`,
            [tomeId]
        )
        const newPosition = rows[0].maxPos + 1
        const [result] = await db.query(
            `INSERT INTO chapter (book_id, tome_id, title, position) VALUES (?, ?, ?, ?)`,
            [bookId, tomeId, title, newPosition]
        )
        return this.findById(result.insertId)
    }

    async moveTimelineItems(fromChapterId, toChapterId, fromPosition) {
        await db.query(
            `UPDATE timeline_item SET chapter_id = ? WHERE chapter_id = ? AND position >= ?`,
            [toChapterId, fromChapterId, fromPosition]
        )
    }

    // crée un chapitre jumeau et relie les deux via paired_chapter_id
    async createVariant(chapterId, copyContent, isAdult) {
        const original = await this.findById(chapterId)
        if (!original) throw new Error('Chapitre introuvable')

        const [result] = await db.query(
            `INSERT INTO chapter (book_id, tome_id, title, position, is_adult, paired_chapter_id, content)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                original.book_id,
                original.tome_id,
                original.title,
                original.position,
                isAdult ? 1 : 0,
                chapterId,
                copyContent ? (original.content || null) : null
            ]
        )
        const newId = result.insertId

        // relier l'original vers le nouveau
        await db.query(
            `UPDATE chapter SET paired_chapter_id = ?, is_adult = ? WHERE id = ?`,
            [newId, isAdult ? 0 : 1, chapterId]
        )

        return this.findById(newId)
    }
}

module.exports = ChapterRepository