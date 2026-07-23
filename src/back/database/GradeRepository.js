const BaseRepository = require('./BaseRepository')
const GradeParentRepository = require('./GradeParentRepository')
const db = require('./db')

class GradeRepository extends BaseRepository {
    constructor() {
        super('grade')
        this.gradeParent = new GradeParentRepository()
    }

    async findByOrganization(organizationId) {
        const [rows] = await db.query(
            `SELECT g.*, gp.id as relation_id, gp.parent_grade_id
             FROM grade g
             LEFT JOIN grade_parent gp ON gp.grade_id = g.id
             WHERE g.organization_id = ?
             ORDER BY g.position ASC`,
            [organizationId]
        )
        return rows
    }

    async getTree(organizationId) {
        const rows = await this.findByOrganization(organizationId)

        // regroupe les lignes par grade (un grade peut apparaitre plusieurs fois si plusieurs parents)
        const byId = new Map()
        for (const row of rows) {
            if (!byId.has(row.id)) {
                byId.set(row.id, { ...row, parents: [], children: [] })
            }
            if (row.parent_grade_id) {
                byId.get(row.id).parents.push(row.parent_grade_id)
            }
        }

        // construit les children
        for (const grade of byId.values()) {
            for (const parentId of grade.parents) {
                if (byId.has(parentId)) {
                    byId.get(parentId).children.push(grade)
                }
            }
        }

        // racines = grades sans parents
        const roots = [...byId.values()].filter(g => g.parents.length === 0)

        const sortRec = (nodes) => {
            nodes.sort((a, b) => a.position - b.position)
            nodes.forEach(n => sortRec(n.children))
        }
        sortRec(roots)

        return roots
    }

    async wouldCreateCycle(gradeId, candidateParentId) {
        if (!candidateParentId) return false
        if (candidateParentId === gradeId) return true

        // remonte tous les ancetres du candidat via grade_parent
        const visited = new Set()
        const queue = [candidateParentId]

        while (queue.length > 0) {
            const current = queue.shift()
            if (current === gradeId) return true
            if (visited.has(current)) continue
            visited.add(current)

            const [rows] = await db.query(
                `SELECT parent_grade_id FROM grade_parent WHERE grade_id = ?`,
                [current]
            )
            rows.forEach(r => queue.push(r.parent_grade_id))
        }
        return false
    }

    async create(data) {
        const { parent_grade_ids = [], ...gradeData } = data

        // position au sein de la fratrie (ou racine si pas de parents)
        const firstParentId = parent_grade_ids[0] || null
        const [rows] = await db.query(
            `SELECT MAX(position) as maxPos FROM grade WHERE organization_id = ?`,
            [gradeData.organization_id]
        )
        const cleanData = await this.clean(gradeData)
        cleanData.position = (rows[0].maxPos || 0) + 1

        const [result] = await db.query(`INSERT INTO grade SET ?`, [cleanData])
        const newId = result.insertId

        // insert les relations dans grade_parent
        for (const parentId of parent_grade_ids) {
            await this.gradeParent.create({ grade_id: newId, parent_grade_id: parentId })
        }

        return newId
    }

    async update(id, data) {
        const { parent_grade_ids = null, ...gradeData } = data

        // verification anti-cycle pour chaque parent
        if (parent_grade_ids) {
            for (const parentId of parent_grade_ids) {
                const cycle = await this.wouldCreateCycle(id, parentId)
                if (cycle) throw new Error('Ce choix creerait une boucle dans la hierarchie.')
            }

            // remplace toutes les relations existantes
            await db.query(`DELETE FROM grade_parent WHERE grade_id = ?`, [id])
            for (const parentId of parent_grade_ids) {
                await this.gradeParent.create({ grade_id: id, parent_grade_id: parentId })
            }
        }

        return super.update(id, gradeData)
    }

    async delete(id) {
        // remonte les enfants vers les parents du grade supprime
        const [parents] = await db.query(
            `SELECT parent_grade_id FROM grade_parent WHERE grade_id = ?`,
            [id]
        )
        const [children] = await db.query(
            `SELECT grade_id FROM grade_parent WHERE parent_grade_id = ?`,
            [id]
        )

        // pour chaque enfant, on remplace le lien vers "id" par les parents de "id"
        for (const child of children) {
            await db.query(
                `DELETE FROM grade_parent WHERE grade_id = ? AND parent_grade_id = ?`,
                [child.grade_id, id]
            )
            for (const parent of parents) {
                // evite les doublons
                const [existing] = await db.query(
                    `SELECT id FROM grade_parent WHERE grade_id = ? AND parent_grade_id = ?`,
                    [child.grade_id, parent.parent_grade_id]
                )
                if (existing.length === 0) {
                    await this.gradeParent.create({
                        grade_id: child.grade_id,
                        parent_grade_id: parent.parent_grade_id
                    })
                }
            }
        }

        return super.delete(id)
    }

    async reorderSiblings(items) {
        const promises = items.map((item, index) =>
            db.query(`UPDATE grade SET position = ? WHERE id = ?`, [index + 1, item.id])
        )
        await Promise.all(promises)
        return true
    }
}

module.exports = GradeRepository