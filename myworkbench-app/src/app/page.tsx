import { Suspense } from 'react';
import { HomeClient } from './HomeClient';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="text-gray-500">加载中...</div>}>
        <HomeClient />
      </Suspense>
    </div>
  );
}
