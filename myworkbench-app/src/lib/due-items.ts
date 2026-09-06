import { listEntities, EntityType } from './markdown';
import {
  dayStartMs,
  parseDateOnly,
  normalizeDateValue,
  formatDateOnly,
  isRecurrenceFreq,
  nextOccurrence,
} from './date-utils';

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
  /** 循环规则（task/event 的 recurrence 字段），展开条目与锚点条目都会带 */
  recurrence?: string;
  recurrence_until?: string;
  /** 循环展开出的虚拟发生日；id 始终是真实实体 id，PUT 时直接用 id */
  occurrence?: string;
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
  date: unknown,
  extra?: Partial<DatedItem>
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
    ...extra,
  };
  out.push(item);
  return item;
}

const MAX_OCCURRENCES = 100;

/**
 * 从锚点展开循环发生日（不含锚点本身，锚点由调用方单独 push）。
 * fromInclusive：只保留 >= 该日期的发生日（任务传今天，避免已错过的未来发生日变成幽灵条目）。
 * until：循环硬截止（recurrence_until 与调用方视野上限取较小者）。
 */
function expandOccurrences(
  anchor: string,
  freq: string,
  until: string | null,
  fromInclusive?: string
): string[] {
  if (!isRecurrenceFreq(freq)) return [];
  const from = fromInclusive && fromInclusive > anchor ? fromInclusive : anchor;
  const occurrences: string[] = [];
  let cur = anchor;
  // 步进上限：周期步进本身很廉价，这里只防病态数据（如锚点在多年前的 daily）无限循环
  let guard = 2000;
  while (occurrences.length < MAX_OCCURRENCES && guard > 0) {
    guard--;
    const next = nextOccurrence(cur, freq);
    if (!next) break;
    cur = next;
    if (until && next > until) break;
    if (next < from) continue;
    occurrences.push(next);
  }
  return occurrences;
}

/** 循环展开的视野上限：min(recurrence_until, today + horizonDays) */
function recurrenceHorizon(untilRaw: unknown, horizonDays: number): string | null {
  const until = normalizeDate(untilRaw);
  const horizon = formatDateOnly(new Date(Date.now() + horizonDays * 24 * 60 * 60 * 1000));
  if (until && until < horizon) return until;
  return horizon;
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
    const freq = isRecurrenceFreq(t.frontmatter.recurrence) ? t.frontmatter.recurrence : undefined;
    const recurringMeta: Partial<DatedItem> | undefined = freq
      ? {
          recurrence: freq,
          recurrence_until: normalizeDate(t.frontmatter.recurrence_until) || undefined,
        }
      : undefined;
    const item = push(out, 'task', t.id, 'task', t.frontmatter.title, t.frontmatter.due_date as string | undefined, recurringMeta);
    if (item) {
      item.task_status = status;
      const notes = t.frontmatter.notes;
      if (typeof notes === 'string' && notes.trim()) item.notes = notes.trim();
    }
    // 循环任务：锚点之外展开未来发生日（锚点在过去的已错过发生日不重复展开，避免幽灵逾期）
    if (freq) {
      const anchor = normalizeDate(t.frontmatter.due_date);
      if (anchor) {
        const today = formatDateOnly(new Date());
        const until = recurrenceHorizon(t.frontmatter.recurrence_until, 90);
        for (const occ of expandOccurrences(anchor, freq, until, today)) {
          push(out, 'task', t.id, 'task', t.frontmatter.title, occ, { ...recurringMeta, occurrence: occ, task_status: status });
        }
      }
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
    const freq = isRecurrenceFreq(e.frontmatter.recurrence) ? e.frontmatter.recurrence : undefined;
    const recurringMeta: Partial<DatedItem> | undefined = freq
      ? {
          recurrence: freq,
          recurrence_until: normalizeDate(e.frontmatter.recurrence_until) || undefined,
        }
      : undefined;
    push(out, 'event', e.id, 'event', e.frontmatter.title, e.frontmatter.event_date as string | undefined, recurringMeta);
    // 循环事件：纯展示展开（事件没有完成态），视野锚点后 180 天
    if (freq) {
      const anchor = normalizeDate(e.frontmatter.event_date);
      if (anchor) {
        const until = recurrenceHorizon(e.frontmatter.recurrence_until, 180);
        for (const occ of expandOccurrences(anchor, freq, until)) {
          push(out, 'event', e.id, 'event', e.frontmatter.title, occ, { ...recurringMeta, occurrence: occ });
        }
      }
    }
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
