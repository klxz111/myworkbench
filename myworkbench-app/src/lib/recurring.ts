import { isRecurrenceFreq, nextOccurrence } from './date-utils';

export interface RecurringTaskInfo {
  id: string;
  due_date?: string;
  recurrence?: string;
  recurrence_until?: string;
}

export interface CompletePayload {
  data: { status?: string; due_date?: string };
}

/**
 * 完成一个任务条目应使用的 PUT payload：
 * - 循环任务 → due_date 推进到下一发生日（status 保持不变，列表里仍是当前待办）
 * - 普通任务 / 已到 recurrence_until → status 置为 done
 * from 传条目的发生日（循环展开条目传 occurrence），不传用任务当前 due_date。
 */
export function completeTaskPayload(task: RecurringTaskInfo, from?: string): CompletePayload {
  const anchor = from || task.due_date;
  if (task.recurrence && isRecurrenceFreq(task.recurrence) && anchor) {
    const next = nextOccurrence(anchor, task.recurrence);
    if (next) {
      if (task.recurrence_until && next > task.recurrence_until) {
        return { data: { status: 'done' } };
      }
      return { data: { due_date: next } };
    }
  }
  return { data: { status: 'done' } };
}
