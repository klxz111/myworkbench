import { Suspense } from 'react';
import Link from 'next/link';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            策略
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            策略详情
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/strategy"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            ← 返回
          </Link>
        </div>
      </div>
        <Suspense fallback={<div className="text-gray-500">加载策略中...</div>}>
        <StrategyDetailClient id={id} />
      </Suspense>
    </div>
  );
}
