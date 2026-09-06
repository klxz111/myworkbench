import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(
  process.env.MYWORKBENCH_DIR || process.cwd(),
  '.myworkbench',
  'index.db'
);

let dbInstance: Database.Database | null = null;

function ensureDbDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(/* turbopackIgnore: true */ dir)) {
    fs.mkdirSync(/* turbopackIgnore: true */ dir, { recursive: true });
  }
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    ensureDbDir();
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
  }
  return dbInstance;
}

export function initDb() {
  const db = getDb();

  // 旧库迁移：slug 曾是全局 UNIQUE，跨类型同名文件（tasks/x.md 与 projects/x.md）会让整个同步事务回滚。
  // Markdown 是数据源、SQLite 仅是缓存，直接重建表，随后由 syncMarkdownToSqlite 全量回填。
  const tableSql = db
    .prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'entities'`)
    .get() as { sql: string } | undefined;
  if (tableSql && !/UNIQUE\s*\(\s*type\s*,\s*slug/i.test(tableSql.sql.replace(/\s+/g, ' '))) {
    db.exec(`DROP TABLE IF EXISTS entities_fts`);
    db.exec(`DROP TABLE IF EXISTS entities`);
    db.exec(`DROP TABLE IF EXISTS relations`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      file_path TEXT NOT NULL UNIQUE,
      content_hash TEXT,
      content TEXT,
      UNIQUE(type, slug)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_id TEXT NOT NULL,
      to_id TEXT NOT NULL,
      relation TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(from_id, to_id, relation)
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_entities_updated_at ON entities(updated_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_entities_type_status ON entities(type, status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_relations_from_id ON relations(from_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_relations_to_id ON relations(to_id)`);

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

export interface GraphNode {
  id: string;
  type: string;
  title: string;
  status: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
}

export function getEvidenceChain(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const db = initDb();
  const entities = db.prepare('SELECT id, type, title, status FROM entities').all() as GraphNode[];
  const relations = db.prepare('SELECT from_id, to_id, relation FROM relations').all() as { from_id: string; to_id: string; relation: string }[];

  const nodes = entities.map((e) => ({ ...e }));
  const edges = relations.map((r, i) => ({
    id: `e-${i}`,
    source: r.from_id,
    target: r.to_id,
    relation: r.relation,
  }));

  return { nodes, edges };
}
