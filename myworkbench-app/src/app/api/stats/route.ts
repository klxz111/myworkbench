import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { listEntities, EntityType } from '@/lib/markdown';
import { ENTITY_LABELS, ENTITY_HREFS } from '@/lib/entity-paths';
import { CAPITAL_DIMENSIONS } from '@/lib/fields';

export const runtime = 'nodejs';

const VERDICT_LABELS: Record<string, string> = {
  confirmed: '成立',
  partially_confirmed: '部分成立',
  invalidated: '被推翻',
  inconclusive: '待定',
};

export async function GET() {
  try {
    const db = initDb();

    // 1. 实体构成
    const rows = db.prepare('SELECT type, COUNT(*) as count FROM entities GROUP BY type').all() as {
      type: string;
      count: number;
    }[];
    const entity_counts = rows
      .map((r) => ({ type: r.type, label: ENTITY_LABELS[r.type] || r.type, href: ENTITY_HREFS[r.type] || '/entities', count: r.count }))
      .sort((a, b) => b.count - a.count);

    // 2. 活动热力图：近 84 天每日更新数（SQLite updated_at 为 'YYYY-MM-DD HH:MM:SS'）
    const activityRows = db
      .prepare(
        `SELECT substr(updated_at, 1, 10) as day, COUNT(*) as count
         FROM entities
         WHERE updated_at >= datetime('now', '-83 days')
         GROUP BY day`
      )
      .all() as { day: string; count: number }[];
    const activityMap = new Map(activityRows.map((r) => [r.day, r.count]));
    const activity: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = 83; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const p = (n: number) => String(n).padStart(2, '0');
      const key = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
      activity.push({ date: key, count: activityMap.get(key) || 0 });
    }

    // 3. 资本趋势：每个资本条目作为数据点（按 updated_at 排序）
    const capitals = listEntities('capital' as EntityType)
      .map((c) => {
        const fm = c.frontmatter as Record<string, unknown>;
        const point: Record<string, string | number | null> = { name: String(fm.title || c.id) };
        for (const dim of CAPITAL_DIMENSIONS) {
          const v = typeof fm[dim.key] === 'number' ? (fm[dim.key] as number) : typeof fm[dim.key] === 'string' ? parseFloat(fm[dim.key] as string) : NaN;
          point[dim.key] = Number.isFinite(v) ? v : null;
        }
        const updated = typeof fm.updated_at === 'string' ? fm.updated_at : '';
        const period = typeof fm.period_start === 'string' ? fm.period_start : '';
        point.sortKey = `${period}|${updated}`;
        return point;
      })
      .sort((a, b) => String(a.sortKey).localeCompare(String(b.sortKey)));
    const capital_trend = capitals.map(({ sortKey: _s, ...rest }) => rest);

    // 4. 决策判定分布
    const verdicts = db
      .prepare(
        `SELECT json_extract(content, '$.verdict') as verdict, COUNT(*) as count
         FROM entities WHERE type = 'decision' GROUP BY verdict`
      )
      .all() as { verdict: string | null; count: number }[];
    const decision_verdicts = verdicts
      .filter((v) => v.verdict)
      .map((v) => ({ verdict: v.verdict as string, label: VERDICT_LABELS[v.verdict as string] || v.verdict, count: v.count }));

    // 5. 任务状态
    const taskRows = db.prepare("SELECT status, COUNT(*) as count FROM entities WHERE type = 'task' GROUP BY status").all() as {
      status: string;
      count: number;
    }[];
    const task_status: Record<string, number> = { todo: 0, doing: 0, done: 0, archived: 0 };
    for (const r of taskRows) task_status[r.status] = r.count;

    return NextResponse.json({
      entity_counts,
      activity,
      capital_trend,
      decision_verdicts,
      task_status,
    });
  } catch (error) {
    console.error('Error building stats:', error);
    return NextResponse.json({ error: 'Failed to build stats' }, { status: 500 });
  }
}
