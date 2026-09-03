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
  const entity = writeEntity(type, slug, data, data.content);

  const contentHash = stableHash(data, data.content);

  db.prepare(
    `INSERT OR IGNORE INTO entities (id, type, slug, title, status, tags, file_path, content_hash, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).run(
    entity.id,
    entity.type,
    entity.slug,
    data.title,
    data.status || 'active',
    JSON.stringify(data.tags || []),
    entity.filePath,
    contentHash,
    data.content
  );

  const exists = db.prepare('SELECT id FROM entities WHERE id = ?').get(entity.id);
  if (exists) {
    db.prepare(
      `UPDATE entities SET title = ?, status = ?, tags = ?, content_hash = ?, content = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      data.title,
      data.status || 'active',
      JSON.stringify(data.tags || []),
      contentHash,
      data.content,
      entity.id
    );
  }

  return entity;
}

export function buildRelations(): number {
  const db = initDb();
  const root = getEntityRoot();
  if (!fs.existsSync(/* turbopackIgnore: true */ root)) return 0;

  const entityTypeDirs = fs.readdirSync(/* turbopackIgnore: true */ root, { withFileTypes: true });
  let count = 0;

  for (const dir of entityTypeDirs) {
    if (!dir.isDirectory()) continue;
    const type = DIR_TO_TYPE[dir.name];
    if (!type) continue;
    const entities = listEntities(type);

    for (const entity of entities) {
      const fm = entity.frontmatter;
      const relations: { target: string; relation: string }[] = [];

      if (fm.linked_evidence && Array.isArray(fm.linked_evidence)) {
        for (const target of fm.linked_evidence) {
          relations.push({ target, relation: 'supports' });
        }
      }
      if (fm.linked_beliefs && Array.isArray(fm.linked_beliefs)) {
        for (const target of fm.linked_beliefs) {
          relations.push({ target, relation: 'informs' });
        }
      }
      if (fm.linked_decisions && Array.isArray(fm.linked_decisions)) {
        for (const target of fm.linked_decisions) {
          relations.push({ target, relation: 'drives' });
        }
      }
      if (fm.linked_experiments && Array.isArray(fm.linked_experiments)) {
        for (const target of fm.linked_experiments) {
          relations.push({ target, relation: 'includes' });
        }
      }

      for (const rel of relations) {
        try {
          db.prepare(
            `INSERT OR IGNORE INTO relations (from_id, to_id, relation) VALUES (?, ?, ?)`
          ).run(entity.id, rel.target, rel.relation);
          count++;
        } catch {
          // skip invalid relations
        }
      }
    }
  }

  return count;
}
