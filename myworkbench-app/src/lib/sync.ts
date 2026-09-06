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

function stableHash(obj: unknown, content: string): string {
  const normalized = JSON.stringify(
    obj,
    Object.keys(obj as Record<string, unknown>).sort()
  );
  return computeContentHash(normalized + content);
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

    for (const dir of entityTypeDirs) {
      if (!dir.isDirectory()) continue;
      const type = DIR_TO_TYPE[dir.name];
      if (!type) continue;
      const entities = listEntities(type);

      for (const entity of entities) {
        result.scanned++;
        seenPaths.add(entity.filePath);

        const contentHash = stableHash(entity.frontmatter, entity.content);

        const existing = db.prepare(
          'SELECT id, content_hash FROM entities WHERE id = ?'
        ).get(entity.id) as { id: string; content_hash: string } | undefined;

        if (!existing) {
          db.prepare(
            `INSERT INTO entities (id, type, slug, title, status, tags, file_path, content_hash, content)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            entity.id,
            entity.type,
            entity.slug,
            entity.frontmatter.title,
            entity.frontmatter.status || 'active',
            JSON.stringify(entity.frontmatter.tags || []),
            entity.filePath,
            contentHash,
            entity.content
          );
          result.created++;
        } else if (existing.content_hash !== contentHash) {
          db.prepare(
            `UPDATE entities SET title = ?, status = ?, tags = ?, content_hash = ?, content = ?, updated_at = datetime('now')
             WHERE id = ?`
          ).run(
            entity.frontmatter.title,
            entity.frontmatter.status || 'active',
            JSON.stringify(entity.frontmatter.tags || []),
            contentHash,
            entity.content,
            entity.id
          );
          result.updated++;
        } else {
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

  const contentHash = stableHash(normalized, normalized.content);

  db.prepare(
    `INSERT OR IGNORE INTO entities (id, type, slug, title, status, tags, file_path, content_hash, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).run(
    entity.id,
    entity.type,
    entity.slug,
    normalized.title,
    normalized.status || 'active',
    JSON.stringify(normalized.tags || []),
    entity.filePath,
    contentHash,
    normalized.content
  );

  const exists = db.prepare('SELECT id FROM entities WHERE id = ?').get(entity.id);
  if (exists) {
    db.prepare(
      `UPDATE entities SET title = ?, status = ?, tags = ?, content_hash = ?, content = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      normalized.title,
      normalized.status || 'active',
      JSON.stringify(normalized.tags || []),
      contentHash,
      normalized.content,
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
