-- =========================================
-- TABLE BOOKS
-- =========================================

CREATE TABLE books (
    id CHAR(36) PRIMARY KEY,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================
-- TABLE CHAPTERS
-- =========================================

CREATE TABLE chapters (
    id CHAR(36) PRIMARY KEY,
    book_id CHAR(36) NOT NULL,

    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content LONGTEXT,

    position INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- =========================================
-- TABLE CHARACTERS
-- =========================================

CREATE TABLE characters (
    id CHAR(36) PRIMARY KEY,
    book_id CHAR(36) NOT NULL,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    personality TEXT,
    notes TEXT,
    image_url TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- =========================================
-- TABLE LORE
-- =========================================

CREATE TABLE lore_entries (
    id CHAR(36) PRIMARY KEY,
    book_id CHAR(36) NOT NULL,

    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    content TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- =========================================
-- TABLE SNIPPETS
-- =========================================

CREATE TABLE snippets (
    id CHAR(36) PRIMARY KEY,
    book_id CHAR(36) NOT NULL,

    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    content LONGTEXT NOT NULL,

    pinned BOOLEAN DEFAULT FALSE,
    used BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- =========================================
-- TABLE NOTES
-- =========================================

CREATE TABLE notes (
    id CHAR(36) PRIMARY KEY,
    book_id CHAR(36) NOT NULL,

    title VARCHAR(255),
    content LONGTEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);
