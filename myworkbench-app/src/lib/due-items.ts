import { listEntities, EntityType } from './markdown';
import { dayStartMs, parseDateOnly, normalizeDateValue } from './date-utils';

export type DueKind = 'task' | 'gate' | 'followup' | 'deadline' | 'event';

export interface DatedItem {
  id: string;
  type: string;
  title: string;
  kind: DueKind;
  date: string;
  /** 任务的执行状态；任务完成/归档后不再算作到期项 */
  task_status?: string;
  /** 任务备注（现有 notes 字段），日历/今日条目展示用 */
  notes?: string;
  href: string;
}

const HREFS: Record<string, string> = {
  task: '/entities/task',
  decision: '/decisions',
  person: '/people',
  opportunity: '/opportunity',
  event: '/events',
};

export const KIND_LABELS: Record<DueKind, string> = {
  task: '任务截止',
  gate: '门控审核',
  followup: '人脉跟进',
  deadline: '机会截止',
  event: '事件',
};

function dayStart(d: Date): number {
  return dayStartMs(d);
}

export function diffDays(dateStr: string): number {
  const target = parseDateOnly(dateStr);
  if (!target) return 0;
  return Math.round((dayStartMs(target) - dayStartMs(new Date())) / (1000 * 60 * 60 * 24));
}

/** 归一化日期：gray-matter 会把未加引号的 YAML 日期解析成 Date 对象，统一转为 YYYY-MM-DD */
function normalizeDate(d: unknown): string | null {
  return normalizeDateValue(d);
}

function push(
  out: DatedItem[],
  kind: DueKind,
  id: string,
  type: string,
  title: string,
  date: unknown
): DatedItem | null {
  const normalized = normalizeDate(date);
  if (!normalized) return null;
  const item: DatedItem = {
    id,
    type,
    title,
    kind,
    date: normalized,
    href: `${HREFS[type] || '/entities'}/${id}`,
  };
  out.push(item);
  return item;
}

/**
 * 收集全部带日期的行动项：
 * - task.due_date（跳过 done/archived）
 * - decision.gate.review_date
 * - person.next_action_date
 * - opportunity.deadline
 * - event.event_date
 */
export function collectDatedItems(): DatedItem[] {
  const out: DatedItem[] = [];

  for (const t of listEntities('task' as EntityType)) {
    const status = String(t.frontmatter.status || 'todo');
    if (status === 'done' || status === 'archived') continue;
    const item = push(out, 'task', t.id, 'task', t.frontmatter.title, t.frontmatter.due_date as string | undefined);
    if (item) {
      item.task_status = status;
      const notes = t.frontmatter.notes;
      if (typeof notes === 'string' && notes.trim()) item.notes = notes.trim();
    }
  }

  for (const d of listEntities('decision' as EntityType)) {
    const gate = d.frontmatter.gate as { review_date?: string } | undefined;
    push(out, 'gate', d.id, 'decision', d.frontmatter.title, gate?.review_date);
  }

  for (const p of listEntities('person' as EntityType)) {
    push(out, 'followup', p.id, 'person', p.frontmatter.title, p.frontmatter.next_action_date as string | undefined);
  }

  for (const o of listEntities('opportunity' as EntityType)) {
    push(out, 'deadline', o.id, 'opportunity', o.frontmatter.title, o.frontmatter.deadline as string | undefined);
  }

  for (const e of listEntities('event' as EntityType)) {
    push(out, 'event', e.id, 'event', e.frontmatter.title, e.frontmatter.event_date as string | undefined);
  }

  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

export interface DueBuckets {
  overdue: DatedItem[];
  today: DatedItem[];
  upcoming: DatedItem[];
}

/** 按逾期/今天/未来 7 天分桶（不含 event；事件由调用方单独取当日值） */
export function bucketDueItems(items: DatedItem[], upcomingDays = 7): DueBuckets {
  const buckets: DueBuckets = { overdue: [], today: [], upcoming: [] };
  for (const item of items) {
    const dd = diffDays(item.date);
    if (item.kind === 'event') continue;
    if (dd < 0) buckets.overdue.push(item);
    else if (dd === 0) buckets.today.push(item);
    else if (dd <= upcomingDays) buckets.upcoming.push(item);
  }
  return buckets;
}
