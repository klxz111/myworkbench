import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { listEntities, EntityType } from '@/lib/markdown';
import { WIKI_LINK_RE } from '@/lib/wiki-links';
import { entityHref } from '@/lib/entity-paths';

export const runtime = 'nodejs';

// 遍历的实体类型目录（与 ENTITY_DIRS 键一致，避免循环依赖）
const ENTITY_TYPES_SAFE = [
  'strategy', 'research', 'decision', 'project', 'experiment', 'person',
  'evidence', 'belief', 'opportunity', 'radar', 'capital', 'profile',
  'event', 'organization', 'task', 'idea',
] as const;

const CACHE_TTL_MS = 60_000;
let wikiIndex: { refs: Map<string, IndexEntry[]>; expiresAt: number } | null = null;

interface IndexEntry {
  from_id: string;
  from_type: string;
  from_title: string;
  context: string;
}

function buildContext(content: string, matchedIndex: number): string {
  const start = Math.max(0, matchedIndex - 40);
  const end = Math.min(content.length, matchedIndex + 60);
  return (start > 0 ? '...' : '') + content.slice(start, end).replace(/\n/g, ' ') + (end < content.length ? '...' : '');
}

function getWikiIndex() {
  if (wikiIndex && Date.now() < wikiIndex.expiresAt) return wikiIndex;

  const map = new Map<string, IndexEntry[]>();
  for (const type of ENTITY_TYPES_SAFE) {
    for (const e of listEntities(type as EntityType)) {
      for (const match of e.content.matchAll(WIKI_LINK_RE)) {
        const targetId = match[1];
        const entry: IndexEntry = {
          from_id: e.id,
          from_type: e.type,
          from_title: e.frontmatter.title,
          context: buildContext(e.content, match.index ?? 0),
        };
        const list = map.get(targetId) || [];
        list.push(entry);
        map.set(targetId, list);
      }
    }
  }
  wikiIndex = { refs: map, expiresAt: Date.now() + CACHE_TTL_MS };
  return wikiIndex;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;
    const db = initDb();

    // 1. 正文 [[id]] 引用（排除自身）
    const index = getWikiIndex();
    const content_backlinks = (index.refs.get(id) || [])
      .filter((e) => e.from_id !== id)
      .map((e) => ({ ...e, href: entityHref(e.from_type, e.from_id) }));

    // 2. 关系入边（x --relation--> 当前实体；buildRelations 已把 linked_* 映射进 relations 表）
    const relRows = db.prepare(`
      SELECT r.from_id, r.relation, e.type, e.title
      FROM relations r
      JOIN entities e ON e.id = r.from_id
      WHERE r.to_id = ? AND r.from_id != ?
      ORDER BY r.relation, e.title
    `).all(id, id) as { from_id: string; relation: string; type: string; title: string }[];

    const relation_backlinks = relRows.map((r) => ({
      from_id: r.from_id,
      from_type: r.type,
      from_title: r.title,
      relation: r.relation,
      href: entityHref(r.type, r.from_id),
    }));

    return NextResponse.json({
      id,
      content_backlinks,
      relation_backlinks,
    });
  } catch (error) {
    console.error('Error building backlinks:', error);
    return NextResponse.json({ error: 'Failed to build backlinks' }, { status: 500 });
  }
}
