import { Suspense } from 'react';
import { GenericCreateClient } from './GenericCreateClient';

export const dynamic = 'force-dynamic';

const TYPE_LABELS: Record<string, string> = {
  strategy: '策略',
  decision: '决策',
  research: '研究',
  evidence: '证据',
  project: '项目',
  experiment: '实验',
  belief: '信念',
  person: '人员',
  opportunity: '机会',
  radar: '雷达',
  capital: '资本',
  profile: '个人档案',
};

export default async function GenericCreatePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            新建{TYPE_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1)}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            创建一个新的{TYPE_LABELS[type] || type}
          </p>
        </div>
      </div>
        <Suspense fallback={<div className="text-gray-500">加载创建表单中...</div>}>
        <GenericCreateClient type={type} />
      </Suspense>
    </div>
  );
}
