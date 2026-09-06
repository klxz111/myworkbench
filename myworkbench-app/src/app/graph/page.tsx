import { Suspense } from 'react';
import { PageHeader } from '@/components/ui';
import { GraphClient } from './GraphClient';

export const dynamic = 'force-dynamic';

export default function GraphPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="证据链" description="可视化证据、信念、决策与项目之间的连接" />
      <Suspense fallback={<div className="text-gray-500">Loading graph...</div>}>
        <GraphClient />
      </Suspense>
    </div>
  );
}
