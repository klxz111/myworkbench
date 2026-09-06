import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { BeliefDetailClient } from './BeliefDetailClient';

export const dynamic = 'force-dynamic';

export default async function BeliefDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
            <PageHeader
        title="信念"
        description="信念详情"
        actions={<Link href="/belief" className="btn-secondary">← 返回</Link>}
      />
        <Suspense fallback={<div className="text-gray-500">加载信念中...</div>}>
        <BeliefDetailClient id={id} />
      </Suspense>
    </div>
  );
}
