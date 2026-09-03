import { NextResponse } from 'next/server';
import { getEvidenceChain } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const data = getEvidenceChain();
  return NextResponse.json(data);
}
