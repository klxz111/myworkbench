import { NextResponse } from 'next/server';
import { getLauncher } from '@/lib/launcher';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const launcher = await getLauncher();
    return NextResponse.json(launcher);
  } catch (error) {
    console.error('Failed to load launcher config:', error);
    return NextResponse.json({ error: 'Failed to load launcher' }, { status: 500 });
  }
}
