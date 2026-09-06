import fs from 'fs';
import path from 'path';
import { getDb, initDb } from './db';
import {
  readEntity,
  writeEntity,
  listEntities,
  getEntityRoot,
  computeContentHash,
  EntityType,
  EntityFrontmatter,
  ENTITY_DIRS,
} from './markdown';
import { pickExtras } from './list-extras';

const DIR_TO_TYPE: Record<string, EntityType> = Object.entries(
  ENTITY_DIRS
).reduce((acc, [type, dir]) => {
  acc[dir] = type as EntityType;
  return acc;
}, {} as Record<string, EntityType>);

export interface SyncResult {
  scanned: number;
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
}

/** 递归排序 key 的稳定序列化：JSON.stringify 的 replacer 数组只会过滤顶层 key，嵌套对象（如 decision.gate）会丢 */
function sortValue(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortValue);
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) {
      out[k] = sortValue((v as Record<string, unknown>)[k]);
    }
    return out;
  }
  return v;
}

/** 实体内容指纹：frontmatter（递归排序 key）+ 正文。所有写入方（create/update/sync）必须共用同一公式 */
export function stableHash(obj: unknown, content: string): string {
  return computeContentHash(JSON.stringify(sortValue(obj)) + content);
}

export function syncMarkdownToSqlite(): SyncResult {
  const db = initDb();
  const root = getEntityRoot();

  if (!fs.existsSync(/* turbopackIgnore: true */ root)) {
    return { scanned: 0, created: 0, updated: 0, deleted: 0, skipped: 0 };
  }

  return db.transaction(() => {
    const result: SyncResult = {
      scanned: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      skipped: 0,
    };

    const entityTypeDirs = fs.readdirSync(/* turbopackIgnore: true */ root, { withFileTypes: true });
    const seenPaths = new Set<string>();
    // mtime+size 快路径：每个请求都会触发 sync，逐文件 stat（不读不解析）后与上次签名比对，
    // 未变化的文件直接跳过读取与解析——这是列表接口真正的 O(n) 成本所在
    const byPathStmt = db.prepare(
      'SELECT id, file_stat FROM entities WHERE file_path = ?'
    );
    const byIdStmt = db.prepare(
      'SELECT id, content_hash, file_path, type, slug, extra FROM entities WHERE id = ?'
    );

    for (const dir of entityTypeDirs) {
      if (!dir.isDirectory()) continue;
      const type = DIR_TO_TYPE[dir.name];
      if (!type) continue;
      const dirPath = path.join(root, dir.name);
      const files = fs.readdirSync(/* turbopackIgnore: true */ dirPath).filter((f) => f.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const st = fs.statSync(/* turbopackIgnore: true */ filePath);
        const sig = `${Math.round(st.mtimeMs)}|${st.size}`;

        const pathRow = byPathStmt.get(filePath) as { id: string; file_stat: string | null } | undefined;
        if (pathRow && pathRow.file_stat === sig) {
          seenPaths.add(filePath);
          result.skipped++;
          continue;
        }

        const entity = readEntity(type, file.replace(/\.md$/, ''));
        if (!entity) continue;
        result.scanned++;
        seenPaths.add(entity.filePath);

        const contentHash = stableHash(entity.frontmatter, entity.content);
        const extra = pickExtras(entity.type, entity.frontmatter);

        // 同一文件路径下 frontmatter 的 id 被改过时，旧行会占据 file_path 的 UNIQUE 位，先驱逐
        if (pathRow && pathRow.id !== entity.id) {
          db.prepare('DELETE FROM entities WHERE id = ?').run(pathRow.id);
        }

        const existing = byIdStmt.get(entity.id) as
          | { id: string; content_hash: string; file_path: string; type: string; slug: string; extra: string | null }
          | undefined;

        if (!existing) {
          db.prepare(
            `INSERT INTO entities (id, type, slug, title, status, tags, file_path, content_hash, content, extra, file_stat)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            entity.id,
            entity.type,
            entity.slug,
            entity.frontmatter.title,
            entity.frontmatter.status || 'active',
            JSON.stringify(entity.frontmatter.tags || []),
            entity.filePath,
            contentHash,
            entity.content,
            extra,
            sig
          );
          result.created++;
        } else if (
          existing.content_hash !== contentHash ||
          existing.file_path !== entity.filePath ||
          existing.type !== entity.type ||
          existing.slug !== entity.slug ||
          // extra 不参与内容指纹；列新增/取值口径变化时靠它自愈回填
          (existing.extra ?? null) !== (extra ?? null)
        ) {
          // 文件路径/类型/slug 变化（重命名、移动目录）也必须写回，
          // 否则下方按 file_path 的删除清判会把实体从索引里误删
          db.prepare(
            `UPDATE entities SET title = ?, status = ?, tags = ?, content_hash = ?, content = ?, extra = ?, file_stat = ?, file_path = ?, type = ?, slug = ?, updated_at = datetime('now')
             WHERE id = ?`
          ).run(
            entity.frontmatter.title,
            entity.frontmatter.status || 'active',
            JSON.stringify(entity.frontmatter.tags || []),
            contentHash,
            entity.content,
            extra,
            sig,
            entity.filePath,
            entity.type,
            entity.slug,
            entity.id
          );
          result.updated++;
        } else {
          // 内容没变但 mtime 动了（如被外部工具触碰）：只回填签名，避免每次请求都重新解析
          db.prepare('UPDATE entities SET file_stat = ? WHERE id = ?').run(sig, entity.id);
          result.skipped++;
        }
      }
    }

    const allDbEntities = db
      .prepare('SELECT id, file_path FROM entities')
      .all() as { id: string; file_path: string }[];

    const toDelete = allDbEntities
      .filter((e) => !seenPaths.has(e.file_path))
      .map((e) => e.id);

    if (toDelete.length > 0) {
      const placeholders = toDelete.map(() => '?').join(',');
      db.prepare(`DELETE FROM relations WHERE from_id IN (${placeholders}) OR to_id IN (${placeholders})`).run(...toDelete, ...toDelete);
      db.prepare(`DELETE FROM entities WHERE id IN (${placeholders})`).run(...toDelete);
      result.deleted = toDelete.length;
    }

    buildRelations();

    return result;
  })();
}

export function createEntity(
  type: EntityType,
  slug: string,
  data: EntityFrontmatter & { content: string }
) {
  const db = initDb();
  const now = new Date().toISOString();
  const normalized: EntityFrontmatter & { content: string } = {
    ...data,
    created_at: (data.created_at as string) || now,
    updated_at: (data.updated_at as string) || now,
  };
  const entity = writeEntity(type, slug, normalized, normalized.content);

  // 与 syncMarkdownToSqlite 完全相同的公式：frontmatter 不含 content 键
  const contentHash = stableHash(entity.frontmatter, normalized.content);
  const extra = pickExtras(entity.type, entity.frontmatter);

  db.prepare(
    `INSERT OR IGNORE INTO entities (id, type, slug, title, status, tags, file_path, content_hash, content, extra, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).run(
    entity.id,
    entity.type,
    entity.slug,
    normalized.title,
    normalized.status || 'active',
    JSON.stringify(normalized.tags || []),
    entity.filePath,
    contentHash,
    normalized.content,
    extra
  );

  const exists = db.prepare('SELECT id FROM entities WHERE id = ?').get(entity.id);
  if (exists) {
    db.prepare(
      `UPDATE entities SET title = ?, status = ?, tags = ?, content_hash = ?, content = ?, extra = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      normalized.title,
      normalized.status || 'active',
      JSON.stringify(normalized.tags || []),
      contentHash,
      normalized.content,
      extra,
      entity.id
    );
  }

  buildRelations();

  return entity;
}

export function buildRelations(): number {
  const db = initDb();
  const root = getEntityRoot();
  if (!fs.existsSync(/* turbopackIgnore: true */ root)) {
    db.prepare(`DELETE FROM relations`).run();
    return 0;
  }

  const entityTypeDirs = fs.readdirSync(/* turbopackIgnore: true */ root, { withFileTypes: true });
  const validIds = new Set<string>();
  const expected: { from: string; to: string; relation: string }[] = [];

  for (const dir of entityTypeDirs) {
    if (!dir.isDirectory()) continue;
    const type = DIR_TO_TYPE[dir.name];
    if (!type) continue;
    const entities = listEntities(type);

    for (const entity of entities) {
      validIds.add(entity.id);
      const fm = entity.frontmatter;

      if (fm.linked_evidence && Array.isArray(fm.linked_evidence)) {
        for (const target of fm.linked_evidence) {
          expected.push({ from: entity.id, to: String(target), relation: 'supports' });
        }
      }
      if (fm.linked_beliefs && Array.isArray(fm.linked_beliefs)) {
        for (const target of fm.linked_beliefs) {
          expected.push({ from: entity.id, to: String(target), relation: 'informs' });
        }
      }
      if (fm.linked_decisions && Array.isArray(fm.linked_decisions)) {
        for (const target of fm.linked_decisions) {
          expected.push({ from: entity.id, to: String(target), relation: 'drives' });
        }
      }
      if (fm.linked_experiments && Array.isArray(fm.linked_experiments)) {
        for (const target of fm.linked_experiments) {
          expected.push({ from: entity.id, to: String(target), relation: 'includes' });
        }
      }
      if (fm.linked_people && Array.isArray(fm.linked_people)) {
        for (const target of fm.linked_people) {
          expected.push({ from: entity.id, to: String(target), relation: 'has_member' });
        }
      }
      if (fm.linked_opportunities && Array.isArray(fm.linked_opportunities)) {
        for (const target of fm.linked_opportunities) {
          expected.push({ from: entity.id, to: String(target), relation: 'has_opportunity' });
        }
      }
      if (fm.linked_strategies && Array.isArray(fm.linked_strategies)) {
        for (const target of fm.linked_strategies) {
          expected.push({ from: entity.id, to: String(target), relation: 'belongs_to_strategy' });
        }
      }

      if (fm.relations && Array.isArray(fm.relations)) {
        for (const raw of fm.relations) {
          const r = raw as { to?: string; id?: string; type?: string; relation?: string };
          const to = r.to ?? r.id;
          const relation = r.type ?? r.relation;
          if (to && relation) {
            expected.push({ from: entity.id, to: String(to), relation: String(relation) });
          }
        }
      }
    }
  }

  const seen = new Set<string>();
  const deduped: { from: string; to: string; relation: string }[] = [];
  for (const rel of expected) {
    if (rel.from === rel.to) continue;
    if (!validIds.has(rel.to)) continue;
    const key = `${rel.from}\u0000${rel.to}\u0000${rel.relation}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(rel);
  }

  return db.transaction(() => {
    db.prepare(`DELETE FROM relations`).run();
    const insert = db.prepare(
      `INSERT INTO relations (from_id, to_id, relation) VALUES (?, ?, ?)`
    );
    for (const rel of deduped) {
      insert.run(rel.from, rel.to, rel.relation);
    }
    return deduped.length;
  })();
}
