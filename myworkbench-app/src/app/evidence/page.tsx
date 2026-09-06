import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { NewPaperButton } from '@/components/NewPaperButton';
import { EvidenceClient } from './EvidenceClient';

export const dynamic = 'force-dynamic';

export default function EvidencePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="证据"
        description="原始观察、实验与外部信号"
        actions={
          <>
            <NewPaperButton />
            <Link href="/evidence/new" className="btn-primary">新建证据</Link>
          </>
        }
      />
        <Suspense fallback={<div className="text-gray-500">加载证据中...</div>}>
        <EvidenceClient />
      </Suspense>
    </div>
  );
}
