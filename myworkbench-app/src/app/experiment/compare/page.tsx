import { Suspense } from 'react';
import { CompareClient } from './CompareClient';

export const dynamic = 'force-dynamic';

export default function ExperimentComparePage() {
  return (
    <Suspense fallback={<div className="text-gray-500">加载对比中...</div>}>
      <CompareClient />
    </Suspense>
  );
}
