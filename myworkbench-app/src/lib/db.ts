import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(
  process.env.MYWORKBENCH_DIR || process.cwd(),
  '.myworkbench',
  'index.db'
);

function ensureDbDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getDb() {
  ensureDbDir();
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      file_path TEXT NOT NULL UNIQUE,
      content_hash TEXT,
      content TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_id TEXT NOT NULL,
      to_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      weight REAL DEFAULT 1.0,
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (from_id) REFERENCES entities(id) ON DELETE CASCADE,
      FOREIGN KEY (to_id) REFERENCES entities(id) ON DELETE CASCADE,
      CHECK(from_id != to_id)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS entities_fts USING fts5(
      title, content,
      content='entities',
      content_rowid='rowid'
    );

    CREATE TRIGGER IF NOT EXISTS entities_ai AFTER INSERT ON entities BEGIN
      INSERT INTO entities_fts(rowid, title, content)
      VALUES (new.rowid, new.title, new.content);
    END;

    CREATE TRIGGER IF NOT EXISTS entities_ad AFTER DELETE ON entities BEGIN
      INSERT INTO entities_fts(entities_fts, rowid, title, content)
      VALUES ('delete', old.rowid, old.title, old.content);
    END;

    CREATE TRIGGER IF NOT EXISTS entities_au AFTER UPDATE ON entities BEGIN
      INSERT INTO entities_fts(entities_fts, rowid, title, content)
      VALUES ('delete', old.rowid, old.title, old.content);
      INSERT INTO entities_fts(rowid, title, content)
      VALUES (new.rowid, new.title, new.content);
    END;
  `);

  return db;
}
