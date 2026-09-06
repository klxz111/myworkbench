/**
 * 日期工具：纯日期字符串（YYYY-MM-DD）必须按本地时区解析。
 * `new Date('2026-09-06')` 会按 UTC 零点解析，在非 UTC 时区与本地"今天"相减时产生偏移。
 */

/** 解析日期字符串为本地时区 Date；无法解析返回 null */
export function parseDateOnly(s: string): Date | null {
  if (typeof s !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s.trim());
  if (!m) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** 当地零点的时间戳 */
export function dayStartMs(d: Date = new Date()): number {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c.getTime();
}

/** 格式化为本地 YYYY-MM-DD */
export function formatDateOnly(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export type RecurrenceFreq = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

const RECURRENCE_FREQS: readonly string[] = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];

export function isRecurrenceFreq(v: unknown): v is RecurrenceFreq {
  return typeof v === 'string' && RECURRENCE_FREQS.includes(v);
}

/** 月/年推进时把日期 clamp 到月末（1 月 31 日循环 → 2 月 28/29 日） */
function addMonthsClamped(d: Date, months: number): Date {
  const targetMonth = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
  return new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(d.getDate(), lastDay));
}

/** 循环的下一次发生日；freq 非法或日期解析失败返回 null */
export function nextOccurrence(date: string, freq: string): string | null {
  const base = parseDateOnly(date);
  if (!base || !isRecurrenceFreq(freq)) return null;
  switch (freq) {
    case 'daily':
      base.setDate(base.getDate() + 1);
      break;
    case 'weekly':
      base.setDate(base.getDate() + 7);
      break;
    case 'biweekly':
      base.setDate(base.getDate() + 14);
      break;
    case 'monthly':
      return formatDateOnly(addMonthsClamped(base, 1));
    case 'yearly':
      return formatDateOnly(addMonthsClamped(base, 12));
  }
  return formatDateOnly(base);
}

/**
 * 将 gray-matter 解析出的日期值归一化为 YYYY-MM-DD 字符串。
 * 无引号 YAML 日期会被解析成 UTC 零点 Date，需按 UTC 分量还原；完整日期时间按本地分量。
 */
export function normalizeDateValue(d: unknown): string | null {
  if (!d) return null;
  if (d instanceof Date) {
    if (isNaN(d.getTime())) return null;
    if (
      d.getUTCHours() === 0 &&
      d.getUTCMinutes() === 0 &&
      d.getUTCSeconds() === 0 &&
      d.getUTCMilliseconds() === 0
    ) {
      const p = (n: number) => String(n).padStart(2, '0');
      return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
    }
    return formatDateOnly(d);
  }
  if (typeof d === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return null;
    return formatDateOnly(parsed);
  }
  if (typeof d === 'number') {
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return null;
    return formatDateOnly(parsed);
  }
  return null;
}
