import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { StrategyDetailClient } from './StrategyDetailClient';

export const dynamic = 'force-dynamic';

export default async function StrategyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
            <PageHeader
        title="策略"
        description="策略详情"
        actions={<Link href="/strategy" className="btn-secondary">← 返回</Link>}
      />
        <Suspense fallback={<div className="text-gray-500">加载策略中...</div>}>
        <StrategyDetailClient id={id} />
      </Suspense>
    </div>
  );
}
