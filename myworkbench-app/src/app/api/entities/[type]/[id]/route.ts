import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import {
  readEntity,
  writeEntity,
  moveEntityToTrash,
  listEntities,
  computeContentHash,
  EntityType,
  ENTITY_DIRS,
} from '@/lib/markdown';
import { syncMarkdownToSqlite } from '@/lib/sync';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;
    const entity = readEntity(type as EntityType, id);
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: entity.frontmatter.id,
      type: entity.type,
      slug: entity.slug,
      title: entity.frontmatter.title,
      status: entity.frontmatter.status,
      tags: entity.frontmatter.tags || [],
      created_at: entity.frontmatter.created_at,
      updated_at: entity.frontmatter.updated_at,
      content: entity.content,
      frontmatter: entity.frontmatter,
      context: entity.frontmatter.context,
      question: entity.frontmatter.question,
      options: entity.frontmatter.options,
      evidence: entity.frontmatter.evidence,
      current_belief: entity.frontmatter.current_belief,
      decision: entity.frontmatter.decision,
      expected_outcome: entity.frontmatter.expected_outcome,
      gate: entity.frontmatter.gate,
      actual_result: entity.frontmatter.actual_result,
      belief_update: entity.frontmatter.belief_update,
      linked_events: entity.frontmatter.linked_events,
      event_date: entity.frontmatter.event_date,
      location: entity.frontmatter.location,
      event_type: entity.frontmatter.event_type,
      linked_strategies: entity.frontmatter.linked_strategies,
      linked_decisions: entity.frontmatter.linked_decisions,
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
    const body = await request.json();

    const existing = readEntity(type as EntityType, id);
    if (!existing) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    const updatedData = {
      ...existing.frontmatter,
      ...body.data,
      updated_at: new Date().toISOString(),
    };

    const entity = writeEntity(type as EntityType, id, updatedData, body.content || existing.content);

    const db = initDb();
    const contentHash = computeContentHash(JSON.stringify(updatedData) + entity.content);
    db.prepare(
      `UPDATE entities SET title = ?, status = ?, tags = ?, content_hash = ?, content = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      updatedData.title,
      updatedData.status || 'active',
      JSON.stringify(updatedData.tags || []),
      contentHash,
      entity.content,
      entity.id
    );

    return NextResponse.json({
      id: entity.frontmatter.id,
      title: entity.frontmatter.title,
      status: entity.frontmatter.status,
      tags: entity.frontmatter.tags || [],
      updated_at: entity.frontmatter.updated_at,
      content: entity.content,
      context: entity.frontmatter.context,
      question: entity.frontmatter.question,
      options: entity.frontmatter.options,
      evidence: entity.frontmatter.evidence,
      current_belief: entity.frontmatter.current_belief,
      decision: entity.frontmatter.decision,
      expected_outcome: entity.frontmatter.expected_outcome,
      gate: entity.frontmatter.gate,
      actual_result: entity.frontmatter.actual_result,
      belief_update: entity.frontmatter.belief_update,
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
