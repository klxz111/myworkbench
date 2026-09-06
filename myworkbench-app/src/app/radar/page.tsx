import { Suspense } from 'react';
import Link from 'next/link';
import { RadarClient } from './RadarClient';

export const dynamic = 'force-dynamic';

export default function RadarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            雷达
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            外部信号与战略环境变化
          </p>
        </div>
        <Link
          href="/radar/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          新建雷达条目
        </Link>
      </div>
        <Suspense fallback={<div className="text-gray-500">加载雷达中...</div>}>
        <RadarClient />
      </Suspense>
    </div>
  );
}
