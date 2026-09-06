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
