function migrate(db) {
    const tables = [
        `CREATE TABLE IF NOT EXISTS book (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            archived INTEGER DEFAULT 0,
            is_private INTEGER DEFAULT 0,
            password TEXT DEFAULT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS tome (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            number INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            position INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS chapter (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            tome_id INTEGER DEFAULT NULL,
            title TEXT NOT NULL,
            summary TEXT,
            content TEXT,
            position INTEGER DEFAULT 0,
            is_adult INTEGER DEFAULT 0,
            paired_chapter_id INTEGER DEFAULT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE,
            FOREIGN KEY (tome_id) REFERENCES tome(id) ON DELETE CASCADE,
            FOREIGN KEY (paired_chapter_id) REFERENCES chapter(id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS character_type (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT NOT NULL,
            icon TEXT DEFAULT NULL,
            book_id INTEGER DEFAULT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS characters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            personality TEXT,
            notes TEXT,
            image_url TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            position INTEGER DEFAULT 0,
            age INTEGER DEFAULT NULL,
            role TEXT DEFAULT NULL,
            type_id INTEGER DEFAULT NULL,
            precision TEXT DEFAULT NULL,
            FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE,
            FOREIGN KEY (type_id) REFERENCES character_type(id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS character_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            character_id INTEGER NOT NULL,
            label TEXT NOT NULL,
            color TEXT DEFAULT '#94a3b8',
            chapter_id_debut INTEGER DEFAULT NULL,
            chapter_id_fin INTEGER DEFAULT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE,
            FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
            FOREIGN KEY (chapter_id_debut) REFERENCES chapter(id) ON DELETE SET NULL,
            FOREIGN KEY (chapter_id_fin) REFERENCES chapter(id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS organization (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS grade (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            organization_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            parent_grade_id INTEGER DEFAULT NULL,
            position INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
            FOREIGN KEY (parent_grade_id) REFERENCES grade(id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS character_grade (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            character_id INTEGER NOT NULL,
            grade_id INTEGER NOT NULL,
            chapter_id_debut INTEGER DEFAULT NULL,
            chapter_id_fin INTEGER DEFAULT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
            FOREIGN KEY (grade_id) REFERENCES grade(id) ON DELETE CASCADE,
            FOREIGN KEY (chapter_id_debut) REFERENCES chapter(id) ON DELETE SET NULL,
            FOREIGN KEY (chapter_id_fin) REFERENCES chapter(id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS family (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS family_relation (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            family_id INTEGER NOT NULL,
            character_id_1 INTEGER NOT NULL,
            character_id_2 INTEGER NOT NULL,
            relation TEXT NOT NULL,
            chapter_id_debut INTEGER DEFAULT NULL,
            chapter_id_fin INTEGER DEFAULT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (family_id) REFERENCES family(id) ON DELETE CASCADE,
            FOREIGN KEY (character_id_1) REFERENCES characters(id) ON DELETE CASCADE,
            FOREIGN KEY (character_id_2) REFERENCES characters(id) ON DELETE CASCADE,
            FOREIGN KEY (chapter_id_debut) REFERENCES chapter(id) ON DELETE SET NULL,
            FOREIGN KEY (chapter_id_fin) REFERENCES chapter(id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS snippet (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            tome_id INTEGER DEFAULT NULL,
            type TEXT NOT NULL DEFAULT 'autre',
            title TEXT DEFAULT NULL,
            content TEXT NOT NULL,
            pinned INTEGER DEFAULT 0,
            used TEXT NOT NULL DEFAULT 'disponible',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            position INTEGER DEFAULT 0,
            FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE,
            FOREIGN KEY (tome_id) REFERENCES tome(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS timeline_item (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tome_id INTEGER NOT NULL,
            chapter_id INTEGER DEFAULT NULL,
            snippet_id INTEGER DEFAULT NULL,
            title TEXT NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            status INTEGER NOT NULL DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tome_id) REFERENCES tome(id) ON DELETE CASCADE,
            FOREIGN KEY (chapter_id) REFERENCES chapter(id) ON DELETE CASCADE,
            FOREIGN KEY (snippet_id) REFERENCES snippet(id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS asset (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            url TEXT NOT NULL,
            label TEXT DEFAULT NULL,
            position INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS lore_entrie (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            category TEXT DEFAULT NULL,
            content TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            position INTEGER DEFAULT 0,
            FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS note (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            title TEXT DEFAULT NULL,
            content TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            position INTEGER DEFAULT 0,
            FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS week (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            groupe INTEGER NOT NULL DEFAULT 1,
            \`order\` INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS week_book (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            groupe INTEGER NOT NULL,
            FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS schedule (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            character_id INTEGER NOT NULL,
            week_id INTEGER NOT NULL,
            heure_debut TEXT NOT NULL,
            heure_fin TEXT NOT NULL,
            activite TEXT NOT NULL,
            couleur TEXT DEFAULT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            chapter_id_debut INTEGER DEFAULT NULL,
            chapter_id_fin INTEGER DEFAULT NULL,
            groupe INTEGER DEFAULT NULL,
            FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
            FOREIGN KEY (week_id) REFERENCES week(id) ON DELETE CASCADE,
            FOREIGN KEY (chapter_id_debut) REFERENCES chapter(id) ON DELETE SET NULL,
            FOREIGN KEY (chapter_id_fin) REFERENCES chapter(id) ON DELETE SET NULL
        )`
    ]

    tables.forEach(query => db.run(query))
    console.log('✅ Tables SQLite créées/vérifiées')
}

module.exports = migrate