import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import {
  readEntity,
  writeEntity,
  moveEntityToTrash,
  listEntities,
  isKnownEntityType,
  isValidSlug,
  EntityType,
  ENTITY_DIRS,
} from '@/lib/markdown';
import { syncMarkdownToSqlite, buildRelations, stableHash } from '@/lib/sync';

export const runtime = 'nodejs';

function validateParams(type: string, id: string): string | null {
  if (!isKnownEntityType(type)) return 'Unknown entity type';
  if (!isValidSlug(id)) return 'Invalid entity id';
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;
    const invalid = validateParams(type, id);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 404 });
    }
    const entity = readEntity(type as EntityType, id);
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    // 展开完整 frontmatter：各类型详情页读取各自字段，白名单会导致新字段永远渲染为空
    return NextResponse.json({
      ...entity.frontmatter,
      id: entity.frontmatter.id ?? entity.id,
      type: entity.type,
      slug: entity.slug,
      content: entity.content,
      frontmatter: entity.frontmatter,
    });
  } catch (error) {
    console.error('Error fetching entity:', error);
    return NextResponse.json({ error: 'Failed to fetch entity' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;
    const invalid = validateParams(type, id);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 404 });
    }
    const body = await request.json();

    const existing = readEntity(type as EntityType, id);
    if (!existing) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }
    if (!body.data || typeof body.data !== 'object') {
      return NextResponse.json({ error: 'Missing required field: data' }, { status: 400 });
    }

    const updatedData = {
      ...existing.frontmatter,
      ...body.data,
      updated_at: new Date().toISOString(),
    };

    // typeof 判断而非真值判断：允许把正文清空为 ''
    const content = typeof body.content === 'string' ? body.content : existing.content;

    const entity = writeEntity(type as EntityType, id, updatedData, content);

    // 与 syncMarkdownToSqlite/createEntity 相同的 hash 公式，避免下次同步误判为已变更
    const contentHash = stableHash(entity.frontmatter, entity.content);
    const db = initDb();
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

    // linked_*/relations 可能被本次编辑修改，重建关系表供 /api/graph、/api/relations、backlinks 使用
    buildRelations();

    return NextResponse.json({
      ...entity.frontmatter,
      id: entity.frontmatter.id ?? entity.id,
      type: entity.type,
      slug: entity.slug,
      content: entity.content,
      frontmatter: entity.frontmatter,
    });
  } catch (error) {
    console.error('Error updating entity:', error);
    return NextResponse.json({ error: 'Failed to update entity' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;
    const invalid = validateParams(type, id);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 404 });
    }

    const trashName = moveEntityToTrash(type as EntityType, id);
    if (!trashName) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    // 清理其他实体 frontmatter 中指向被删实体的引用（relations / linked_*）
    for (const otherType of Object.keys(ENTITY_DIRS) as EntityType[]) {
      for (const other of listEntities(otherType)) {
        if (other.id === id) continue;
        const fm = { ...other.frontmatter };
        let changed = false;

        if (Array.isArray(fm.relations)) {
          const before = fm.relations as { to?: string; id?: string }[];
          const next = before.filter((r) => (r.to ?? r.id) !== id);
          if (next.length !== before.length) {
            if (next.length === 0) delete fm.relations;
            else fm.relations = next;
            changed = true;
          }
        }

        for (const key of Object.keys(fm)) {
          if (!key.startsWith('linked_') || !Array.isArray(fm[key])) continue;
          const before = fm[key] as string[];
          const next = before.filter((v) => String(v) !== id);
          if (next.length !== before.length) {
            if (next.length === 0) delete fm[key];
            else fm[key] = next;
            changed = true;
          }
        }

        if (changed) {
          writeEntity(otherType, other.slug, fm, other.content);
        }
      }
    }

    // 全量重建缓存（实体行删除 + 关系表重建）
    syncMarkdownToSqlite();

    return NextResponse.json({ success: true, trashed: trashName });
  } catch (error) {
    console.error('Error deleting entity:', error);
    return NextResponse.json({ error: 'Failed to delete entity' }, { status: 500 });
  }
}
