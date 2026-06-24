const BaseRepository = require('./BaseRepository')
const db = require('./db')

class ChapterRepository extends BaseRepository {
    constructor() {
        super('chapter')
    }

    // trouve le chapitre juste APRÈS celui donné, en traversant les tomes si besoin
    // (même tome, position+1 ; sinon premier chapitre du tome suivant)
    async findNextChapter(chapterId) {
        const current = await this.findById(chapterId)
        if (!current) return null

        // d'abord, chapitre suivant dans le même tome
        const [sameBook] = await db.query(
            `SELECT c.* FROM chapter c
             WHERE c.tome_id = ? AND c.position > ?
             ORDER BY c.position ASC LIMIT 1`,
            [current.tome_id, current.position]
        )
        if (sameBook[0]) return sameBook[0]

        // sinon, premier chapitre du tome suivant (même book_id, tome.number supérieur)
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

    // trouve le chapitre juste AVANT celui donné, en traversant les tomes si besoin
    async findPreviousChapter(chapterId) {
        const current = await this.findById(chapterId)
        if (!current) return null

        // d'abord, chapitre précédent dans le même tome
        const [sameBook] = await db.query(
            `SELECT c.* FROM chapter c
             WHERE c.tome_id = ? AND c.position < ?
             ORDER BY c.position DESC LIMIT 1`,
            [current.tome_id, current.position]
        )
        if (sameBook[0]) return sameBook[0]

        // sinon, dernier chapitre du tome précédent
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

    // compare deux chapitres par leur position narrative (tome.number puis chapter.position)
    // retourne true si chapitreA est strictement après chapitreB
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

    // compte le nombre de chapitres compris entre deux bornes (inclusivement), pour un même livre.
    // Utilisé pour mesurer "la longueur" d'une plage chapter_id_debut -> chapter_id_fin sur une
    // activité (une plage qui couvre moins de chapitres est considérée plus "spécifique"/courte).
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

    // surcharge reorder : après tout changement de position des chapitres (drag-and-drop),
    // on vérifie que chaque activité (schedule) ayant une plage chapter_id_debut -> chapter_id_fin
    // reste cohérente (début toujours avant ou égal à la fin). Si une plage est cassée par le
    // nouvel ordre, on supprime l'activité concernée (même règle que pour la suppression).
    async reorder(items) {
        const result = await super.reorder(items)

        // toutes les activités qui ont une vraie plage définie (les deux bornes non NULL)
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

    // surcharge delete : avant de supprimer le chapitre, on répare toutes les activités (schedule)
    // qui l'utilisent comme borne de plage (chapter_id_debut ou chapter_id_fin)
    async delete(id) {
        // toutes les activités où ce chapitre est une borne (début ou fin, ou les deux)
        const [affected] = await db.query(
            `SELECT * FROM schedule WHERE chapter_id_debut = ? OR chapter_id_fin = ?`,
            [id, id]
        )

        for (const sched of affected) {
            const isDebut = sched.chapter_id_debut === id
            const isFin = sched.chapter_id_fin === id

            // plage d'un seul chapitre (début = fin = celui qu'on supprime) -> l'activité entière disparaît
            if (isDebut && isFin) {
                await db.query(`DELETE FROM schedule WHERE id = ?`, [sched.id])
                continue
            }

            let newDebut = sched.chapter_id_debut
            let newFin = sched.chapter_id_fin

            if (isDebut) {
                const next = await this.findNextChapter(id)
                newDebut = next ? next.id : null // plus rien après -> plage invalide, sera nettoyée ci-dessous
            }
            if (isFin) {
                const prev = await this.findPreviousChapter(id)
                newFin = prev ? prev.id : null
            }

            // si après rétrécissement il ne reste plus de chapitre dans la plage (debut après fin,
            // ou une borne devenue introuvable alors qu'elle existait avant), on supprime l'activité
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

        // suppression réelle du chapitre, comportement standard
        return super.delete(id)
    }
}

module.exports = ChapterRepository