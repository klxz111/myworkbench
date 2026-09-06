import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { DecisionDetailClient } from './DecisionDetailClient';

export const dynamic = 'force-dynamic';

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
            <PageHeader
        title="决策"
        description="决策详情及证据与信念追踪"
        actions={<Link href="/decisions" className="btn-secondary">← 返回</Link>}
      />
        <Suspense fallback={<div className="text-gray-500">加载决策中...</div>}>
        <DecisionDetailClient id={id} />
      </Suspense>
    </div>
  );
}
