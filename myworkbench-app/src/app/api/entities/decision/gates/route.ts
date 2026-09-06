import { NextResponse } from 'next/server';
import { listEntities, EntityType } from '@/lib/markdown';
import { normalizeDateValue } from '@/lib/date-utils';
import { diffDays } from '@/lib/due-items';
import { syncMarkdownToSqlite } from '@/lib/sync';

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

export async function GET() {
  try {
    // 直接读 Markdown：DB 的 id 是 frontmatter id，而 readEntity 按文件 slug 解析，二者可能不同
    syncMarkdownToSqlite();

    const result: GateDecision[] = listEntities('decision' as EntityType).map((entity) => {
      const fm = entity.frontmatter as Record<string, unknown>;
      const gate = (fm.gate as GateDecision['gate']) || null;
      const base = {
        id: String(fm.id || entity.id),
        title: String(fm.title || entity.id),
        status: String(fm.status || 'active'),
        tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
        updated_at: String(fm.updated_at || ''),
        gate,
      };

      const reviewDate = normalizeDateValue(gate?.review_date);
      if (!reviewDate) {
        return { ...base, gate_status: 'no_review_date' };
      }

      const diff = diffDays(reviewDate);
      if (diff < 0) return { ...base, gate_status: 'overdue', diff_days: diff };
      if (diff <= 7) return { ...base, gate_status: 'upcoming', diff_days: diff };
      return { ...base, gate_status: 'scheduled', diff_days: diff };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching decision gates:', error);
    return NextResponse.json({ error: 'Failed to fetch decision gates' }, { status: 500 });
  }
}
