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
      extra TEXT,
      file_stat TEXT,
      UNIQUE(type, slug)
    )
  `);

  // 增量迁移：extra/file_stat 列加入前建的老库补列（旧 UNIQUE schema 的整表重建走上面的 drop 分支）
  const existingCols = db.prepare(`PRAGMA table_info(entities)`).all() as { name: string }[];
  for (const col of ['extra', 'file_stat']) {
    if (existingCols.length > 0 && !existingCols.some((c) => c.name === col)) {
      db.exec(`ALTER TABLE entities ADD COLUMN ${col} TEXT`);
    }
  }

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

  // RSS 订阅：独立于 Markdown 实体的"源数据缓存"（数据来自网络抓取，不参与 sync/导出）。
  // 删库重建后订阅源可重新抓取，但已读状态会丢。
  db.exec(`
    CREATE TABLE IF NOT EXISTS rss_feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      site_url TEXT,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_fetched_at TEXT,
      last_error TEXT
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS rss_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feed_id INTEGER NOT NULL REFERENCES rss_feeds(id) ON DELETE CASCADE,
      guid TEXT NOT NULL,
      title TEXT NOT NULL,
      link TEXT,
      author TEXT,
      published_at TEXT,
      summary TEXT,
      read INTEGER DEFAULT 0,
      fetched_at TEXT DEFAULT (datetime('now')),
      UNIQUE(feed_id, guid)
    )
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_rss_entries_feed_published ON rss_entries(feed_id, published_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_rss_entries_read ON rss_entries(feed_id, read)`);

  // 增量迁移：rss_feeds 分类列（ai/quant/invest，空串=未分类）
  const rssFeedCols = db.prepare(`PRAGMA table_info(rss_feeds)`).all() as { name: string }[];
  if (rssFeedCols.length > 0 && !rssFeedCols.some((c) => c.name === 'category')) {
    db.exec(`ALTER TABLE rss_feeds ADD COLUMN category TEXT DEFAULT ''`);
  }

  db.exec(`CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_entities_updated_at ON entities(updated_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_entities_type_status ON entities(type, status)`);
  // 分页查询 WHERE type=? ORDER BY updated_at DESC 的复合索引
  db.exec(`CREATE INDEX IF NOT EXISTS idx_entities_type_updated ON entities(type, updated_at DESC)`);
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
