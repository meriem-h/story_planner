const BaseRepository = require('./BaseRepository')
const db = require('./db')

class GradeRepository extends BaseRepository {
    constructor() {
        super('grade')
    }

    // tous les grades d'une organisation, triés par position (a plat, pas encore en arbre)
    async findByOrganization(organizationId) {
        const [rows] = await db.query(
            `SELECT * FROM grade WHERE organization_id = ? ORDER BY position ASC`,
            [organizationId]
        )
        return rows
    }

    // reconstruit l'arbre complet d'une organisation a partir de la liste plate
    // (chaque noeud recoit un tableau "children"). Les racines (parent_grade_id NULL)
    // sont retournees triees par position, et chaque niveau d'enfants est trie pareil.
    async getTree(organizationId) {
        const flat = await this.findByOrganization(organizationId)

        const byId = new Map(flat.map(g => [g.id, { ...g, children: [] }]))
        const roots = []

        for (const grade of byId.values()) {
            if (grade.parent_grade_id && byId.has(grade.parent_grade_id)) {
                byId.get(grade.parent_grade_id).children.push(grade)
            } else {
                roots.push(grade)
            }
        }

        // tri recursif par position
        const sortRec = (nodes) => {
            nodes.sort((a, b) => a.position - b.position)
            nodes.forEach(n => sortRec(n.children))
        }
        sortRec(roots)

        return roots
    }

    // empeche de choisir comme parent un grade qui est en fait un descendant de soi-meme
    // (sinon on cree une boucle infinie dans l'arbre). Remonte la chaine parent_grade_id
    // depuis candidateParentId : si on retombe sur gradeId, c'est interdit.
    async wouldCreateCycle(gradeId, candidateParentId) {
        if (!candidateParentId) return false
        if (candidateParentId === gradeId) return true

        let current = await this.findById(candidateParentId)
        const seen = new Set()

        while (current && current.parent_grade_id) {
            if (current.parent_grade_id === gradeId) return true
            if (seen.has(current.id)) break // securite anti boucle deja existante
            seen.add(current.id)
            current = await this.findById(current.parent_grade_id)
        }
        return false
    }

    // creation avec position calculee au sein de la fratrie (meme parent_grade_id), pas globale
    async create(data) {
        if (data.parent_grade_id) {
            const valid = await this.findById(data.parent_grade_id)
            if (!valid) throw new Error('Le grade superieur choisi n\'existe pas.')
        }

        const [rows] = await db.query(
            `SELECT MAX(position) as maxPos FROM grade WHERE organization_id = ? AND parent_grade_id ${data.parent_grade_id ? '= ?' : 'IS NULL'}`,
            data.parent_grade_id ? [data.organization_id, data.parent_grade_id] : [data.organization_id]
        )
        const cleanData = await this.clean(data)
        cleanData.position = (rows[0].maxPos || 0) + 1

        const [result] = await db.query(`INSERT INTO grade SET ?`, [cleanData])
        return result.insertId
    }

    // mise a jour avec verification anti-cycle si on change le parent
    async update(id, data) {
        if (data.parent_grade_id) {
            const cycle = await this.wouldCreateCycle(id, data.parent_grade_id)
            if (cycle) throw new Error('Ce choix creerait une boucle dans la hierarchie (un grade ne peut pas dependre de lui-meme ou d\'un de ses subordonnes).')
        }
        return super.update(id, data)
    }

    // reordonne les grades PARMI UNE MEME FRATRIE (meme parent_grade_id). On ne touche
    // jamais a position au niveau global de l'organisation, seulement au sein du groupe
    // de freres/soeurs concerne, pour ne pas perturber les autres branches de l'arbre.
    async reorderSiblings(items) {
        const promises = items.map((item, index) =>
            db.query(`UPDATE grade SET position = ? WHERE id = ?`, [index + 1, item.id])
        )
        await Promise.all(promises)
        return true
    }

    // suppression d'un grade : les enfants directs sont "remontes" au parent du grade supprime
    // (plutot que detaches a la racine, ce qui casserait visuellement l'arbre). Si le grade
    // supprime etait une racine, ses enfants deviennent eux-memes racines.
    async delete(id) {
        const grade = await this.findById(id)
        if (!grade) return 0

        await db.query(
            `UPDATE grade SET parent_grade_id = ? WHERE parent_grade_id = ?`,
            [grade.parent_grade_id, id]
        )

        return super.delete(id)
    }
}

module.exports = GradeRepository