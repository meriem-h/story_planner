const BaseRepository = require('./BaseRepository')
const db = require('./db')
const bcrypt = require('bcryptjs')

// jamais renvoyer le hash au front, meme par accident via un spread {...book}
const stripPasswordHash = (row) => {
    if (!row) return row
    const { password, ...rest } = row
    return rest
}

class BookRepository extends BaseRepository {
    constructor() {
        super('book')
    }

    // surcharge des lectures generiques pour ne jamais exposer le hash au front
    async findAll(joins = []) {
        const rows = await super.findAll(joins)
        return rows.map(stripPasswordHash)
    }

    async findById(id) {
        const row = await super.findById(id)
        return stripPasswordHash(row)
    }

    async findBy(conditions, joins = []) {
        const rows = await super.findBy(conditions, joins)
        return rows.map(stripPasswordHash)
    }

    // a la creation : si is_private est coche avec un mot de passe en clair fourni,
    // on le hash avant insertion. Le front envoie le mdp en clair sous le nom
    // "plainPassword" (jamais "password", qui est le nom de la colonne BDD contenant
    // le hash -- les deux noms doivent rester distincts, sinon impossible de les separer).
    async create(data) {
        const payload = { ...data }
        if (payload.is_private && payload.plainPassword) {
            payload.password = await bcrypt.hash(payload.plainPassword, 10)
        } else {
            payload.is_private = 0
            payload.password = null
        }
        delete payload.plainPassword
        const id = await super.create(payload)
        return id
    }

    // a la modification : 3 cas -> on rend prive avec un nouveau mdp (hash) ; on retire
    // la protection (is_private=0, hash remis a null) ; ou aucun changement de mdp demande
    // (le front n'envoie alors pas "plainPassword", donc on ne touche pas au hash existant)
    async update(id, data) {
        const payload = { ...data }
        if (payload.is_private === false || payload.is_private === 0) {
            payload.is_private = 0
            payload.password = null
        } else if (payload.plainPassword) {
            payload.password = await bcrypt.hash(payload.plainPassword, 10)
        }
        delete payload.plainPassword
        return super.update(id, payload)
    }

    // verifie le mot de passe d'un livre prive. Retourne true/false, ne renvoie jamais
    // le hash. Si le livre n'est pas prive ou n'a pas de hash, on considere l'acces refuse
    // par precaution plutot que de planter.
    async verifyPassword(id, plainPassword) {
        const [rows] = await db.query(
            `SELECT password FROM book WHERE id = ?`,
            [id]
        )
        const hash = rows[0]?.password
        if (!hash) return false
        return bcrypt.compare(plainPassword || '', hash)
    }
}

module.exports = BookRepository