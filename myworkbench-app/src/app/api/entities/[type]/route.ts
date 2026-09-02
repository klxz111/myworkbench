import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import {
  listEntities,
  EntityType,
} from '@/lib/markdown';
import { createEntity } from '@/lib/sync';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const entities = listEntities(type as EntityType);

    const db = initDb();
    const rows = db.prepare('SELECT id, title, status, tags, updated_at FROM entities WHERE type = ? ORDER BY updated_at DESC').all(type) as any[];

    const data = rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      tags: JSON.parse(row.tags || '[]'),
      updated_at: row.updated_at,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching entities:', error);
    return NextResponse.json({ error: 'Failed to fetch entities' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const body = await request.json();
    const { slug, data, content } = body;

    if (!slug || !data || !content) {
      return NextResponse.json({ error: 'Missing required fields: slug, data, content' }, { status: 400 });
    }

    const entity = createEntity(type as EntityType, slug, { ...data, content });

    return NextResponse.json(entity, { status: 201 });
  } catch (error) {
    console.error('Error creating entity:', error);
    return NextResponse.json({ error: 'Failed to create entity' }, { status: 500 });
  }
}
