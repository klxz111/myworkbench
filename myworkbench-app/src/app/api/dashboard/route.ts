import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { listEntities, EntityType } from '@/lib/markdown';
import { normalizeDateValue } from '@/lib/date-utils';
import { diffDays } from '@/lib/due-items';
import { syncMarkdownToSqlite } from '@/lib/sync';

export const runtime = 'nodejs';

interface DashboardItem {
  id: string;
  type: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

interface CapitalSummary {
  count: number;
  latest_updated: string | null;
  items: DashboardItem[];
}

interface DecisionGate {
  invalidate_if?: string;
  review_date?: string;
  pivot_signals?: string[];
}

interface DashboardResponse {
  recent_changes: DashboardItem[];
  active_decisions: DashboardItem[];
  active_research: DashboardItem[];
  active_projects: DashboardItem[];
  capital_summary: CapitalSummary;
  next_actions: DashboardItem[];
  pending_reviews: Array<DashboardItem & { gate_status: string; diff_days?: number; gate?: DecisionGate }>;
  recent_events: DashboardItem[];
  follow_ups: Array<DashboardItem & { diff_days: number }>;
  overdue_count: number;
  upcoming_count: number;
}

const DASHBOARD_CACHE_TTL_MS = 60_000;
let cachedDashboard: { data: DashboardResponse; expiresAt: number } | null = null;

function readDashboardCache(): DashboardResponse | null {
  if (!cachedDashboard) return null;
  if (Date.now() > cachedDashboard.expiresAt) {
    cachedDashboard = null;
    return null;
  }
  return cachedDashboard.data;
}

function writeDashboardCache(data: DashboardResponse) {
  cachedDashboard = { data, expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS };
}

export async function GET(request: NextRequest) {
  try {
    const cached = readDashboardCache();
    if (cached) {
      return NextResponse.json(cached);
    }

    const db = initDb();
    // 自愈：保证 SQLite 缓存与 Markdown 一致（含旧库重建后的回填）
    syncMarkdownToSqlite();

    const recentRows = db.prepare(
      'SELECT id, type, title, status, tags, updated_at FROM entities ORDER BY updated_at DESC LIMIT 20'
    ).all() as any[];

    const recent_changes: DashboardItem[] = recentRows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      status: row.status,
      tags: JSON.parse(row.tags || '[]'),
      updated_at: row.updated_at,
    }));

    const decisionRows = db.prepare(
      'SELECT id, type, title, status, tags, updated_at FROM entities WHERE type = ? AND status = ? ORDER BY updated_at DESC'
    ).all('decision', 'active') as any[];

    const active_decisions: DashboardItem[] = decisionRows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      status: row.status,
      tags: JSON.parse(row.tags || '[]'),
      updated_at: row.updated_at,
    }));

    const projectRows = db.prepare(
      'SELECT id, type, title, status, tags, updated_at FROM entities WHERE type = ? AND status = ? ORDER BY updated_at DESC'
    ).all('project', 'active') as any[];

    const active_projects: DashboardItem[] = projectRows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      status: row.status,
      tags: JSON.parse(row.tags || '[]'),
      updated_at: row.updated_at,
    }));

    const researchRows = db.prepare(
      'SELECT id, type, title, status, tags, updated_at FROM entities WHERE type = ? AND status = ? ORDER BY updated_at DESC'
    ).all('research', 'active') as any[];

    const active_research: DashboardItem[] = researchRows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      status: row.status,
      tags: JSON.parse(row.tags || '[]'),
      updated_at: row.updated_at,
    }));

    const capitalRows = db.prepare(
      'SELECT id, type, title, status, tags, updated_at FROM entities WHERE type = ? ORDER BY updated_at DESC'
    ).all('capital') as any[];

    const capitalItems: DashboardItem[] = capitalRows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      status: row.status,
      tags: JSON.parse(row.tags || '[]'),
      updated_at: row.updated_at,
    }));

    const capital_summary: CapitalSummary = {
      count: capitalItems.length,
      latest_updated: capitalItems.length > 0 ? capitalItems[0].updated_at : null,
      items: capitalItems,
    };

    const next_actions = recent_changes.slice(0, 8);

    const eventRows = db.prepare(
      'SELECT id, type, title, status, tags, updated_at FROM entities WHERE type = ? ORDER BY updated_at DESC LIMIT 8'
    ).all('event') as any[];

    const recent_events: DashboardItem[] = eventRows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      status: row.status,
      tags: JSON.parse(row.tags || '[]'),
      updated_at: row.updated_at,
    }));

    // SQLite 的 content 列只存 Markdown 正文，frontmatter 不在其中；
    // 跟进提醒与门控审核必须读 Markdown 文件本身
    const followUps: Array<DashboardItem & { diff_days: number }> = listEntities('person' as EntityType)
      .map((p) => {
        const fm = p.frontmatter as Record<string, unknown>;
        const nextActionDate = normalizeDateValue(fm.next_action_date);
        if (!nextActionDate) return null;
        return {
          id: p.id,
          type: p.type as string,
          title: String(fm.title || p.id),
          status: String(fm.status || 'active'),
          tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
          updated_at: String(fm.updated_at || ''),
          diff_days: diffDays(nextActionDate),
        };
      })
      .filter((item): item is DashboardItem & { diff_days: number } => item !== null)
      .sort((a, b) => a.diff_days - b.diff_days)
      .slice(0, 8);

    const pending_reviews = listEntities('decision' as EntityType)
      .map((d) => {
        const fm = d.frontmatter as Record<string, unknown>;
        const gate = (fm.gate as DecisionGate) || undefined;
        const reviewDate = normalizeDateValue(gate?.review_date);
        let gateStatus = 'scheduled';
        let diff: number | undefined;
        if (!reviewDate) {
          gateStatus = 'no_review_date';
        } else {
          diff = diffDays(reviewDate);
          if (diff < 0) gateStatus = 'overdue';
          else if (diff <= 7) gateStatus = 'upcoming';
        }
        return {
          id: d.id,
          type: d.type as string,
          title: String(fm.title || d.id),
          status: String(fm.status || 'active'),
          tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
          updated_at: String(fm.updated_at || ''),
          gate_status: gateStatus,
          diff_days: diff,
          gate,
        };
      })
      .filter((item) => item.gate_status !== 'no_review_date')
      .sort((a, b) => {
        if (a.gate_status === 'overdue' && b.gate_status !== 'overdue') return -1;
        if (b.gate_status === 'overdue' && a.gate_status !== 'overdue') return 1;
        if (a.gate_status === 'upcoming' && b.gate_status !== 'upcoming') return -1;
        if (b.gate_status === 'upcoming' && a.gate_status !== 'upcoming') return 1;
        return 0;
      })
      .slice(0, 8);

    const overdueCount =
      pending_reviews.filter((item) => item.gate_status === 'overdue').length +
      followUps.filter((item) => item.diff_days < 0).length;

    const upcomingCount =
      pending_reviews.filter((item) => item.gate_status === 'upcoming').length +
      followUps.filter((item) => item.diff_days >= 0 && item.diff_days <= 7).length;

    const response: DashboardResponse = {
      recent_changes,
      active_decisions,
      active_research,
      active_projects,
      capital_summary,
      next_actions,
      pending_reviews,
      recent_events,
      follow_ups: followUps,
      overdue_count: overdueCount,
      upcoming_count: upcomingCount,
    };

    writeDashboardCache(response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
