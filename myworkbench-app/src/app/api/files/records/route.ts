import { NextResponse } from 'next/server';
import { listEntities, EntityType, EntityFile } from '@/lib/markdown';

const ALL_TYPES: EntityType[] = [
  'strategy',
  'research',
  'decision',
  'project',
  'experiment',
  'person',
  'evidence',
  'belief',
  'opportunity',
  'radar',
  'capital',
  'profile',
  'event',
  'organization',
];

export async function GET() {
  try {
    const records: Array<{
      id: string;
      type: EntityType;
      title: string;
      updated_at?: string;
      path: string;
    }> = [];

    for (const type of ALL_TYPES) {
      const entities = listEntities(type);
      for (const entity of entities) {
        records.push({
          id: entity.id,
          type: entity.type,
          title: entity.frontmatter.title,
          updated_at: entity.frontmatter.updated_at,
          path: entity.filePath,
        });
      }
    }

    records.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Failed to load file records:', error);
    return NextResponse.json(
      { error: 'Failed to load file records' },
      { status: 500 }
    );
  }
}
