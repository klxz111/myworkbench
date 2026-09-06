import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { ExperimentsClient } from './ExperimentsClient';

export const dynamic = 'force-dynamic';

export default function ExperimentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="实验"
        description="研究实验及其结果"
        actions={<Link href="/entities/experiment/new" className="btn-primary">新建实验</Link>}
      />
        <Suspense fallback={<div className="text-gray-500">加载实验中...</div>}>
        <ExperimentsClient />
      </Suspense>
    </div>
  );
}
