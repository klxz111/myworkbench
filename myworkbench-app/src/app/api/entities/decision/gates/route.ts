import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { readEntity, EntityType } from '@/lib/markdown';

export const runtime = 'nodejs';

interface GateDecision {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  gate: {
    review_date?: string;
    invalidate_if?: string;
    pivot_signals?: string[];
  } | null;
  gate_status: 'no_review_date' | 'overdue' | 'upcoming' | 'scheduled';
  diff_days?: number;
}

export async function GET(request: NextRequest) {
  try {
    const db = initDb();
    const rows = db.prepare(
      'SELECT id, title, status, tags, updated_at FROM entities WHERE type = ? ORDER BY updated_at DESC'
    ).all('decision') as any[];

    const now = new Date();

    const result: GateDecision[] = rows.map((row) => {
      const fileEntity = readEntity('decision' as EntityType, row.id);
      const gate = fileEntity?.frontmatter.gate as GateDecision['gate'] || null;

      if (!gate?.review_date) {
        return {
          id: row.id,
          title: row.title,
          status: row.status,
          tags: JSON.parse(row.tags || '[]'),
          updated_at: row.updated_at,
          gate,
          gate_status: 'no_review_date',
        };
      }

      const reviewDate = new Date(gate.review_date);
      const diffDays = Math.ceil((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return { id: row.id, title: row.title, status: row.status, tags: JSON.parse(row.tags || '[]'), updated_at: row.updated_at, gate, gate_status: 'overdue', diff_days: diffDays };
      }
      if (diffDays <= 7) {
        return { id: row.id, title: row.title, status: row.status, tags: JSON.parse(row.tags || '[]'), updated_at: row.updated_at, gate, gate_status: 'upcoming', diff_days: diffDays };
      }
      return { id: row.id, title: row.title, status: row.status, tags: JSON.parse(row.tags || '[]'), updated_at: row.updated_at, gate, gate_status: 'scheduled', diff_days: diffDays };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching decision gates:', error);
    return NextResponse.json({ error: 'Failed to fetch decision gates' }, { status: 500 });
  }
}
