import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { collectDatedItems, bucketDueItems, diffDays, KIND_LABELS } from '@/lib/due-items';

export const runtime = 'nodejs';

function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export async function GET() {
  try {
    const all = collectDatedItems();
    const buckets = bucketDueItems(all, 7);

    const eventsToday = all.filter((i) => i.kind === 'event' && diffDays(i.date) === 0);
    const eventsThisWeek = all.filter((i) => {
      if (i.kind !== 'event') return false;
      const dd = diffDays(i.date);
      return dd > 0 && dd <= 7;
    });

    const db = initDb();
    const taskRows = db.prepare(
      `SELECT id, title, status, tags, updated_at FROM entities WHERE type = 'task' AND status IN ('todo','doing') ORDER BY updated_at DESC`
    ).all() as { id: string; title: string; status: string; tags: string; updated_at: string }[];
    const doing = taskRows.filter((r) => r.status === 'doing').map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      tags: JSON.parse(r.tags || '[]'),
      href: `/entities/task/${r.id}`,
    }));
    const todoCount = taskRows.filter((r) => r.status === 'todo').length;

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const recentRows = db.prepare(
      `SELECT id, type, title, status, tags, updated_at FROM entities WHERE type != 'task' AND updated_at >= ? ORDER BY updated_at DESC LIMIT 8`
    ).all(weekAgo) as { id: string; type: string; title: string; status: string; tags: string; updated_at: string }[];

    const HREFS: Record<string, string> = {
      strategy: '/strategy', decision: '/decisions', research: '/research', evidence: '/evidence',
      project: '/projects', experiment: '/experiment', belief: '/belief', person: '/people',
      opportunity: '/opportunity', radar: '/radar', capital: '/capital', profile: '/profile',
      event: '/events', organization: '/organizations',
    };

    const recent = recentRows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      status: r.status,
      updated_at: r.updated_at,
      href: `${HREFS[r.type] || '/entities'}/${r.id}`,
    }));

    const decorate = (items: typeof buckets.overdue) =>
      items.map((i) => ({ ...i, kind_label: KIND_LABELS[i.kind], diff_days: diffDays(i.date) }));

    return NextResponse.json({
      date: todayStr(),
      overdue: decorate(buckets.overdue),
      today: decorate(buckets.today),
      upcoming: decorate(buckets.upcoming),
      events_today: eventsToday,
      events_this_week: eventsThisWeek,
      doing,
      todo_count: todoCount,
      recent,
    });
  } catch (error) {
    console.error('Error building today view:', error);
    return NextResponse.json({ error: 'Failed to build today view' }, { status: 500 });
  }
}
