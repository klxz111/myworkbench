import { describe, it, expect } from 'vitest';
import { pickExtras, parseExtras, LIST_EXTRA_FIELDS } from '../list-extras';

describe('pickExtras', () => {
  it('无白名单类型返回 null', () => {
    expect(pickExtras('unknown', { foo: 1 })).toBeNull();
  });

  it('白名单字段被提取并 JSON 序列化', () => {
    const raw = pickExtras('task', {
      due_date: '2026-09-10',
      priority: 'high',
      notes: 'abc',
      recurrence: undefined,
      recurrence_until: null,
    });
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual({ due_date: '2026-09-10', priority: 'high', notes: 'abc' });
  });

  it('空值/空字符串被过滤', () => {
    expect(pickExtras('task', {})).toBeNull();
    expect(pickExtras('task', { due_date: '' })).toBeNull();
  });

  it('Date 对象被深归一化', () => {
    const d = new Date(2026, 8, 10);
    const raw = pickExtras('person', { next_action_date: d });
    expect(raw).toBe('{"next_action_date":"2026-09-10"}');
  });

  it('嵌套对象（如 gate）被递归归一化', () => {
    const raw = pickExtras('decision', {
      gate: { review_date: new Date(2026, 8, 15), invalidate_if: 'x', pivot_signals: ['a'] },
    });
    expect(raw).toBe('{"gate":{"review_date":"2026-09-15","invalidate_if":"x","pivot_signals":["a"]}}');
  });
});

describe('parseExtras', () => {
  it('null/undefined 返回空对象', () => {
    expect(parseExtras(null)).toEqual({});
    expect(parseExtras(undefined)).toEqual({});
  });

  it('合法 JSON 解析', () => {
    expect(parseExtras('{"due_date":"2026-09-10"}')).toEqual({ due_date: '2026-09-10' });
  });

  it('非法 JSON 返回空对象', () => {
    expect(parseExtras('not-json')).toEqual({});
  });
});

describe('LIST_EXTRA_FIELDS', () => {
  it('覆盖 8 个类型', () => {
    expect(Object.keys(LIST_EXTRA_FIELDS)).toHaveLength(8);
    expect(LIST_EXTRA_FIELDS.task).toContain('due_date');
    expect(LIST_EXTRA_FIELDS.decision).toContain('gate');
    expect(LIST_EXTRA_FIELDS.evidence).toContain('source_type');
  });
});
