import { describe, it, expect } from 'vitest';
import {
  parseDateOnly,
  formatDateOnly,
  isRecurrenceFreq,
  nextOccurrence,
  normalizeDateValue,
} from '../date-utils';

describe('parseDateOnly', () => {
  it('解析 YYYY-MM-DD 为本地时区', () => {
    const d = parseDateOnly('2026-01-31');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(0);
    expect(d!.getDate()).toBe(31);
  });
  it('非法输入返回 null', () => {
    expect(parseDateOnly('')).toBeNull();
    expect(parseDateOnly('not-a-date')).toBeNull();
  });
  it('非字符串返回 null', () => {
    expect(parseDateOnly(123 as unknown as string)).toBeNull();
  });
});

describe('formatDateOnly', () => {
  it('格式化为 YYYY-MM-DD', () => {
    expect(formatDateOnly(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('isRecurrenceFreq', () => {
  it('合法频率', () => {
    expect(isRecurrenceFreq('daily')).toBe(true);
    expect(isRecurrenceFreq('weekly')).toBe(true);
    expect(isRecurrenceFreq('biweekly')).toBe(true);
    expect(isRecurrenceFreq('monthly')).toBe(true);
    expect(isRecurrenceFreq('yearly')).toBe(true);
  });
  it('非法频率', () => {
    expect(isRecurrenceFreq('hourly')).toBe(false);
    expect(isRecurrenceFreq(1)).toBe(false);
    expect(isRecurrenceFreq(null)).toBe(false);
  });
});

describe('nextOccurrence', () => {
  it('daily 加一天', () => {
    expect(nextOccurrence('2026-01-31', 'daily')).toBe('2026-02-01');
  });
  it('weekly 加 7 天', () => {
    expect(nextOccurrence('2026-01-01', 'weekly')).toBe('2026-01-08');
  });
  it('biweekly 加 14 天', () => {
    expect(nextOccurrence('2026-01-01', 'biweekly')).toBe('2026-01-15');
  });
  it('monthly 月末 clamp（1 月 31 日 → 2 月 28 日，非闰年）', () => {
    expect(nextOccurrence('2026-01-31', 'monthly')).toBe('2026-02-28');
  });
  it('yearly 闰日 clamp（2 月 29 日 → 次年 2 月 28 日）', () => {
    expect(nextOccurrence('2024-02-29', 'yearly')).toBe('2025-02-28');
  });
  it('非法 freq 返回 null', () => {
    expect(nextOccurrence('2026-01-01', 'hourly')).toBeNull();
  });
  it('非法日期返回 null', () => {
    expect(nextOccurrence('bad', 'daily')).toBeNull();
  });
});

describe('normalizeDateValue', () => {
  it('字符串日期截断为前 10 位', () => {
    expect(normalizeDateValue('2026-01-31')).toBe('2026-01-31');
    expect(normalizeDateValue('2026-01-31T10:00:00Z')).toBe('2026-01-31');
  });
  it('UTC 零点的 Date 按 UTC 分量还原', () => {
    const d = new Date('2026-01-31T00:00:00Z');
    expect(normalizeDateValue(d)).toBe('2026-01-31');
  });
  it('null/undefined/空 返回 null', () => {
    expect(normalizeDateValue(null)).toBeNull();
    expect(normalizeDateValue(undefined)).toBeNull();
    expect(normalizeDateValue('')).toBeNull();
  });
});