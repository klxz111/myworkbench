import { NextRequest, NextResponse } from 'next/server';
import { collectDatedItems, diffDays, KIND_LABELS } from '@/lib/due-items';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const year = Number(request.nextUrl.searchParams.get('year')) || now.getFullYear();
    const month = Number(request.nextUrl.searchParams.get('month')) || now.getMonth() + 1;

    if (month < 1 || month > 12) {
      return NextResponse.json({ error: 'month must be 1-12' }, { status: 400 });
    }

    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const items = collectDatedItems()
      .filter((i) => i.date.startsWith(prefix))
      .map((i) => ({
        ...i,
        kind_label: KIND_LABELS[i.kind],
        diff_days: diffDays(i.date),
        day: Number(i.date.slice(8, 10)),
      }));

    return NextResponse.json({ year, month, items });
  } catch (error) {
    console.error('Error building calendar:', error);
    return NextResponse.json({ error: 'Failed to build calendar' }, { status: 500 });
  }
}
