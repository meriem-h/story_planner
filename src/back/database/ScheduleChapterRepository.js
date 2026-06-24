const BaseRepository = require('./BaseRepository')
const db = require('./db')

class ScheduleChapterRepository extends BaseRepository {
    constructor() {
        super('schedule_chapter')
    }

    // tous les chapitres liés à un planning (une activité) donné
    async findBySchedule(scheduleId) {
        return super.findBy({ schedule_id: scheduleId })
    }

    // tous les liens (toutes activités confondues) pour un chapitre donné
    async findByChapter(chapterId) {
        return super.findBy({ chapter_id: chapterId })
    }

    // LA vérification clé : est-ce que ce chapitre est déjà pris par un AUTRE
    // planning du même personnage ?
    // On remonte le character_id via schedule_id -> schedule.character_id (pas de
    // duplication en BDD, donc jointure obligatoire ici).
    async isChapterTakenByCharacter(chapterId, characterId, excludeScheduleId = null) {
        let query = `
            SELECT COUNT(*) as count
            FROM schedule_chapter sc
            JOIN schedule s ON s.id = sc.schedule_id
            WHERE sc.chapter_id = ? AND s.character_id = ?
        `
        const params = [chapterId, characterId]

        if (excludeScheduleId) {
            query += ` AND sc.schedule_id != ?`
            params.push(excludeScheduleId)
        }

        const [rows] = await db.query(query, params)
        return rows[0].count > 0
    }

    // création "sécurisée" : vérifie l'absence de conflit avant d'insérer
    // characterId est fourni par l'appelant (déjà connu côté front/IPC, pas besoin
    // de le re-requêter ici)
    async linkChapter(scheduleId, chapterId, characterId) {
        const alreadyTaken = await this.isChapterTakenByCharacter(chapterId, characterId, scheduleId)
        if (alreadyTaken) {
            throw new Error('Ce chapitre est déjà lié à un autre planning pour ce personnage.')
        }
        return this.create({ schedule_id: scheduleId, chapter_id: chapterId })
    }

    // lie plusieurs chapitres d'un coup à un planning (ex: sélection d'une plage de chapitres)
    async linkChapters(scheduleId, chapterIds, characterId) {
        const results = []
        for (const chapterId of chapterIds) {
            results.push(await this.linkChapter(scheduleId, chapterId, characterId))
        }
        return results
    }

    // retire tous les chapitres liés à un planning (avant d'en relier de nouveaux, par ex.)
    async clearForSchedule(scheduleId) {
        const [result] = await db.query(
            `DELETE FROM schedule_chapter WHERE schedule_id = ?`,
            [scheduleId]
        )
        return result.affectedRows
    }
}

module.exports = ScheduleChapterRepository