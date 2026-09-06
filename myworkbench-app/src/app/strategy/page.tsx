import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { StrategyClient } from './StrategyClient';

export const dynamic = 'force-dynamic';

export default function StrategyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="策略"
        description="长期方向、时间线与战略约束"
        actions={<Link href="/strategy/new" className="btn-primary">新建策略</Link>}
      />
        <Suspense fallback={<div className="text-gray-500">加载策略中...</div>}>
        <StrategyClient />
      </Suspense>
    </div>
  );
}
