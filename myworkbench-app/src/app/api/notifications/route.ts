import { NextResponse } from 'next/server';
import { collectDatedItems, KIND_LABELS, diffDays } from '@/lib/due-items';
import { sendPushNotification } from '@/lib/push';
import { initDb } from '@/lib/db';

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
      .filter((item) => item.diff_days <= (item.kind === 'deadline' ? 14 : 7))
      .sort((a, b) => a.diff_days - b.diff_days);

    const overdue_count = items.filter((i) => i.diff_days < 0).length;
    const upcoming_count = items.length - overdue_count;

    if (items.length > 0) {
      const db = initDb();
      const subscriptions = db.prepare('SELECT * FROM push_subscriptions').all() as {
        endpoint: string;
        p256dh: string | null;
        auth: string | null;
      }[];
      for (const sub of subscriptions) {
        const payload = {
          title: `myworkbench：${overdue_count > 0 ? '逾期提醒' : '即将到期'}`,
          body: items[0].title,
          data: { href: items[0].href },
        };
        try {
          await sendPushNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh || '',
                auth: sub.auth || '',
              },
            },
            payload
          );
        } catch {
          // 推送失败不影响 API 返回
        }
      }
    }

    return NextResponse.json({ overdue_count, upcoming_count, items });
  } catch (error) {
    console.error('Error building notifications:', error);
    return NextResponse.json({ error: 'Failed to build notifications' }, { status: 500 });
  }
}
