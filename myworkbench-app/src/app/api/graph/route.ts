import { NextResponse } from 'next/server';
import { getEvidenceChain } from '@/lib/db';
import { syncMarkdownToSqlite } from '@/lib/sync';

export const runtime = 'nodejs';

export async function GET() {
  // 编辑实体不会全量重建关系表，读取前先同步一次保证图数据新鲜
  syncMarkdownToSqlite();
  const data = getEvidenceChain();
  return NextResponse.json(data);
}
