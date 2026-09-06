import { Suspense } from 'react';
import { HomeClient } from './HomeClient';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          我在哪里
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          战略概览、最近变更与快速操作
        </p>
      </div>
      <Suspense fallback={          <div className="text-gray-500">加载中...</div>}>
        <HomeClient />
      </Suspense>
    </div>
  );
}
