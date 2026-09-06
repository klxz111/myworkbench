import { initDb } from './db';
import { WikiTarget } from './wiki-links';

const CACHE_TTL_MS = 60_000;
let cache: { map: Map<string, WikiTarget>; expiresAt: number } | null = null;

/** id → {type,title} 解析器（SQLite 实体表，60s 缓存） */
export function getWikiResolver(): (id: string) => WikiTarget | null {
  if (!cache || Date.now() > cache.expiresAt) {
    const db = initDb();
    const rows = db.prepare('SELECT id, type, title FROM entities').all() as {
      id: string;
      type: string;
      title: string;
    }[];
    const map = new Map<string, WikiTarget>();
    for (const r of rows) {
      map.set(r.id, { type: r.type, title: r.title });
    }
    cache = { map, expiresAt: Date.now() + CACHE_TTL_MS };
  }
  return (id) => cache!.map.get(id) || null;
}
