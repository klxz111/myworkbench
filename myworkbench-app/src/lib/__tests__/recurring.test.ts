import { describe, it, expect } from 'vitest';
import { completeTaskPayload } from '../recurring';

describe('completeTaskPayload', () => {
  it('循环任务推进 due_date（status 保持）', () => {
    const p = completeTaskPayload({
      id: 't1',
      due_date: '2026-01-01',
      recurrence: 'weekly',
    });
    expect(p).toEqual({ data: { due_date: '2026-01-08' } });
  });
  it('普通任务（无 recurrence）→ done', () => {
    const p = completeTaskPayload({ id: 't1', due_date: '2026-01-01' });
    expect(p).toEqual({ data: { status: 'done' } });
  });
  it('推进后超过 recurrence_until → done', () => {
    const p = completeTaskPayload({
      id: 't1',
      due_date: '2026-01-08',
      recurrence: 'weekly',
      recurrence_until: '2026-01-10',
    });
    expect(p).toEqual({ data: { status: 'done' } });
  });
  it('from 参数作为推进锚点（循环展开条目传 occurrence）', () => {
    const p = completeTaskPayload(
      { id: 't1', due_date: '2026-01-01', recurrence: 'daily' },
      '2026-02-01'
    );
    expect(p).toEqual({ data: { due_date: '2026-02-02' } });
  });
  it('非法 recurrence → done', () => {
    const p = completeTaskPayload({
      id: 't1',
      due_date: '2026-01-01',
      recurrence: 'hourly',
    });
    expect(p).toEqual({ data: { status: 'done' } });
  });
});