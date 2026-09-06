import { Suspense } from 'react';
import Link from 'next/link';
import { DecisionDetailClient } from './DecisionDetailClient';

export const dynamic = 'force-dynamic';

export default async function DecisionDetailPage({
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
            决策
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            决策详情及证据与信念追踪
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/decisions"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            ← 返回
          </Link>
        </div>
      </div>
        <Suspense fallback={<div className="text-gray-500">加载决策中...</div>}>
        <DecisionDetailClient id={id} />
      </Suspense>
    </div>
  );
}
