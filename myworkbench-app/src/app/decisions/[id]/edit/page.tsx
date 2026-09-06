import { Suspense } from 'react';
import { DecisionEditClient } from './DecisionEditClient';

export const dynamic = 'force-dynamic';

export default async function DecisionEditPage({
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
            编辑决策
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            更新决策详情
          </p>
        </div>
      </div>
        <Suspense fallback={<div className="text-gray-500">加载编辑表单中...</div>}>
        <DecisionEditClient id={id} />
      </Suspense>
    </div>
  );
}
