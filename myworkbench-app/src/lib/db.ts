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
  if (!fs.existsSync(/* turbopackIgnore: true */ dir)) {
    fs.mkdirSync(/* turbopackIgnore: true */ dir, { recursive: true });
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
      content TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_type TEXT NOT NULL,
      from_slug TEXT NOT NULL,
      to_type TEXT NOT NULL,
      to_slug TEXT NOT NULL,
      relation TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(from_type, from_slug, to_type, to_slug, relation)
    )
  `);

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS entities_fts USING fts5(
      id,
      title,
      tags,
      content,
      content='',
      tokenize='porter'
    )
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS entities_ai AFTER INSERT ON entities BEGIN
      INSERT INTO entities_fts(rowid, id, title, tags, content)
      VALUES (NEW.rowid, NEW.id, NEW.title, NEW.tags, NEW.content);
    END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS entities_ad AFTER DELETE ON entities BEGIN
      INSERT INTO entities_fts(entities_fts, rowid, id, title, tags, content)
      VALUES ('delete', OLD.rowid, OLD.id, OLD.title, OLD.tags, OLD.content);
    END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS entities_au AFTER UPDATE ON entities BEGIN
      INSERT INTO entities_fts(entities_fts, rowid, id, title, tags, content)
      VALUES ('delete', OLD.rowid, OLD.id, OLD.title, OLD.tags, OLD.content);
      INSERT INTO entities_fts(rowid, id, title, tags, content)
      VALUES (NEW.rowid, NEW.id, NEW.title, NEW.tags, NEW.content);
    END
  `);

  return db;
}
