/**
 * 列表 API 按类型补充返回的 frontmatter 字段。
 * SQLite entities 表只存 id/title/status/tags，这些字段序列化进 extra JSON 列
 * （sync 时写入），GET 时展开合并，避免列表页为了 due_date/gate 等再查详情。
 */
import { normalizeDateValue } from './date-utils';

export const LIST_EXTRA_FIELDS: Record<string, string[]> = {
  task: ['due_date', 'recurrence', 'recurrence_until', 'priority', 'notes'],
  event: ['event_date', 'recurrence', 'recurrence_until'],
  decision: ['gate'],
  person: ['next_action_date'],
  opportunity: ['deadline'],
  evidence: ['source_type', 'source_url', 'date'],
  experiment: ['hypothesis', 'config', 'metrics', 'result', 'interpretation', 'artifacts'],
  idea: ['hypothesis', 'novelty', 'feasibility', 'next_step'],
};

/** 深归一化：gray-matter 把 frontmatter 里的无引号日期（含嵌套对象内的，如 gate.review_date）解析成 Date */
function normalizeDeep(v: unknown): unknown {
  if (v instanceof Date) return normalizeDateValue(v) ?? v;
  if (Array.isArray(v)) return v.map(normalizeDeep);
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>)) {
      out[k] = normalizeDeep((v as Record<string, unknown>)[k]);
    }
    return out;
  }
  return v;
}

export function pickExtras(type: string, fm: object): string | null {
  const keys = LIST_EXTRA_FIELDS[type];
  if (!keys) return null;
  const source = fm as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    const v = normalizeDeep(source[k]);
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return Object.keys(out).length ? JSON.stringify(out) : null;
}

export function parseExtras(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}
