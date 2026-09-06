import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { RadarClient } from './RadarClient';

export const dynamic = 'force-dynamic';

export default function RadarPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="雷达"
        description="外部信号与战略环境变化"
        actions={<Link href="/entities/radar/new" className="btn-primary">新建雷达条目</Link>}
      />
        <Suspense fallback={<div className="text-gray-500">加载雷达中...</div>}>
        <RadarClient />
      </Suspense>
    </div>
  );
}
