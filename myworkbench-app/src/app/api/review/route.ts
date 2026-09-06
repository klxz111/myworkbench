import { NextResponse } from 'next/server';
import { listEntities, EntityType } from '@/lib/markdown';
import { bucketDueItems, collectDatedItems, KIND_LABELS } from '@/lib/due-items';

export const runtime = 'nodejs';

function mondayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (dow - 1));
  return d;
}

function inThisWeek(iso: string | undefined, weekStart: Date): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return false;
  return t >= weekStart.getTime();
}

const ALL_TYPES = [
  'strategy', 'research', 'decision', 'project', 'experiment', 'person',
  'evidence', 'belief', 'opportunity', 'radar', 'capital', 'profile',
  'event', 'organization', 'task',
] as const;

export async function GET() {
  try {
    const weekStart = mondayStart();
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    const created: { type: string; count: number; items: { id: string; title: string }[] }[] = [];
    const updated: { type: string; count: number; items: { id: string; title: string }[] }[] = [];

    let tasksDone = 0;
    let beliefsUpdated = 0;
    const decisionsJudged: { id: string; title: string; verdict: string }[] = [];
    const capitalAdded: { id: string; title: string }[] = [];

    for (const type of ALL_TYPES) {
      const entities = listEntities(type as EntityType);
      const createdItems: { id: string; title: string }[] = [];
      const updatedItems: { id: string; title: string }[] = [];

      for (const e of entities) {
        const fm = e.frontmatter as Record<string, unknown>;
        const createdAt = typeof fm.created_at === 'string' ? fm.created_at : undefined;
        const updatedAt = typeof fm.updated_at === 'string' ? fm.updated_at : undefined;
        if (inThisWeek(createdAt, weekStart)) createdItems.push({ id: e.id, title: e.frontmatter.title });
        else if (inThisWeek(updatedAt, weekStart)) updatedItems.push({ id: e.id, title: e.frontmatter.title });

        if (type === 'task' && fm.status === 'done' && inThisWeek(updatedAt, weekStart)) tasksDone++;
        if (type === 'belief' && inThisWeek(updatedAt, weekStart)) beliefsUpdated++;
        if (type === 'decision' && typeof fm.verdict === 'string' && typeof fm.result_recorded_at === 'string' && fm.result_recorded_at >= weekStartStr) {
          decisionsJudged.push({ id: e.id, title: e.frontmatter.title, verdict: fm.verdict });
        }
        if (type === 'capital' && inThisWeek(updatedAt, weekStart)) {
          capitalAdded.push({ id: e.id, title: e.frontmatter.title });
        }
      }

      if (createdItems.length > 0) created.push({ type, count: createdItems.length, items: createdItems });
      if (updatedItems.length > 0) updated.push({ type, count: updatedItems.length, items: updatedItems });
    }

    // 下周门控与到期（复用 due-items）
    const buckets = bucketDueItems(collectDatedItems(), 7);
    const dueSoon = [...buckets.overdue, ...buckets.today, ...buckets.upcoming].map((i) => ({
      ...i,
      kind_label: KIND_LABELS[i.kind],
    }));

    const VERDICT_LABELS: Record<string, string> = {
      confirmed: '成立',
      partially_confirmed: '部分成立',
      invalidated: '被推翻',
      inconclusive: '待定',
    };

    return NextResponse.json({
      week_start: weekStartStr,
      created,
      updated,
      tasks_done: tasksDone,
      beliefs_updated: beliefsUpdated,
      decisions_judged: decisionsJudged.map((d) => ({
        ...d,
        verdict_label: VERDICT_LABELS[d.verdict] || d.verdict,
      })),
      capital_added: capitalAdded,
      due_soon: dueSoon,
    });
  } catch (error) {
    console.error('Error building review:', error);
    return NextResponse.json({ error: 'Failed to build review' }, { status: 500 });
  }
}
