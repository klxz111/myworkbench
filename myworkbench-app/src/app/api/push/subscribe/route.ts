import { NextRequest, NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/push';
import { initDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ publicKey: getVapidPublicKey() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subscription = body.subscription as { endpoint: string; keys: { p256dh: string; auth: string } };
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: '缺少订阅信息' }, { status: 400 });
    }
    const db = initDb();
    db.prepare(
      `INSERT OR REPLACE INTO push_subscriptions (endpoint, p256dh, auth, user_agent, created_at, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      subscription.endpoint,
      subscription.keys?.p256dh || null,
      subscription.keys?.auth || null,
      request.headers.get('user-agent') || null
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('订阅推送失败:', error);
    return NextResponse.json({ error: '订阅失败' }, { status: 500 });
  }
}
