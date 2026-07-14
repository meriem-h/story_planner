const BaseRepository = require('./BaseRepository')
const db = require('./db')

class TimelineRepository extends BaseRepository {
    constructor() {
        super('timeline_item')
        this.joins = [
            {
                table: 'chapter',
                alias: 'c',
                on: { foreign: 'id', local: 'chapter_id' },
                fields: ['title']
            },
            {
                table: 'snippet',
                alias: 's',
                on: { foreign: 'id', local: 'snippet_id' },
                fields: ['title', 'type', 'content']
            }
        ]
    }

    async findBy(conditions) {
        return super.findBy(conditions, this.joins)
    }


    async reorder(items) {
        const promises = items.map((item) =>
            db.query(
                `UPDATE timeline_item SET position = ?, chapter_id = ? WHERE id = ?`,
                [item.position, item.chapter_id ?? null, item.id]
            )
        )
        await Promise.all(promises)
        return true
    }
}

module.exports = TimelineRepository