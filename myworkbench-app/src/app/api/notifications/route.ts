import { NextResponse } from 'next/server';
import { collectDatedItems, KIND_LABELS, diffDays } from '@/lib/due-items';

export const runtime = 'nodejs';

const NOTIFIABLE_KINDS = new Set(['task', 'gate', 'followup', 'deadline']);

export async function GET() {
  try {
    const items = collectDatedItems()
      .filter((item) => NOTIFIABLE_KINDS.has(item.kind))
      .map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        kind: item.kind as string,
        kind_label: KIND_LABELS[item.kind],
        due_date: item.date,
        diff_days: diffDays(item.date),
        href: item.href,
      }))
      // 机会截止的提醒窗口放宽到 14 天，其余 7 天
      .filter((item) => item.diff_days <= (item.kind === 'deadline' ? 14 : 7))
      .sort((a, b) => a.diff_days - b.diff_days);

    const overdue_count = items.filter((i) => i.diff_days < 0).length;
    const upcoming_count = items.length - overdue_count;

    return NextResponse.json({ overdue_count, upcoming_count, items });
  } catch (error) {
    console.error('Error building notifications:', error);
    return NextResponse.json({ error: 'Failed to build notifications' }, { status: 500 });
  }
}
