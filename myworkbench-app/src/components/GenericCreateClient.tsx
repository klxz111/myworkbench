'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EntityForm, EntityFormData } from '@/components/forms/EntityForm';

interface GenericCreateProps {
  type: string;
}

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
  event: '事件',
  organization: '组织',
  task: '任务',
};

const TYPE_LIST_PATHS: Record<string, string> = {
  strategy: '/strategy',
  decision: '/decisions',
  research: '/research',
  evidence: '/evidence',
  project: '/projects',
  experiment: '/experiment',
  belief: '/belief',
  person: '/people',
  opportunity: '/opportunity',
  radar: '/radar',
  capital: '/capital',
  profile: '/profile',
  event: '/events',
  organization: '/organizations',
  task: '/tasks',
};

export function GenericCreateClient({ type }: GenericCreateProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // EntityForm 内部已完成 POST 创建并返回保存后的实体，这里只做跳转，不能再重复提交
  const handleSave = (_savedEntity: EntityFormData) => {
    setError(null);
    setSaved(true);
    setTimeout(() => {
      router.push(TYPE_LIST_PATHS[type] || `/${type}s`);
    }, 800);
  };

  if (saved) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <p className="text-green-800 dark:text-green-200">
          {TYPE_LABELS[type] || type}创建成功！正在跳转...
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          新建{TYPE_LABELS[type] || type}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          填写以下信息创建新的{TYPE_LABELS[type] || type}条目
        </p>
      </div>
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
      <EntityForm type={type} onSuccess={handleSave} />
      <div className="mt-6">
        <Link
          href={TYPE_LIST_PATHS[type] || `/${type}s`}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← 返回{TYPE_LABELS[type] ? TYPE_LABELS[type] + '列表' : type + 's'}
        </Link>
      </div>
    </div>
  );
}
