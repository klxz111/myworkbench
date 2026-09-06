'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EntityForm, EntityFormData } from '@/components/forms/EntityForm';
import { ENTITY_LIST_HREFS } from '@/lib/entity-paths';

interface EntityData {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  [key: string]: unknown;
}

interface GenericEditProps {
  type: string;
  id: string;
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
};

export function GenericEditClient({ type, id }: GenericEditProps) {
  const router = useRouter();
  const [entity, setEntity] = useState<EntityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchEntity() {
      try {
        const res = await fetch(`/api/entities/${type}/${id}`);
        if (!res.ok) {
          throw new Error(`未找到${TYPE_LABELS[type] || type}`);
        }
        const data = await res.json();
        setEntity(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : `加载${TYPE_LABELS[type] || type}失败`);
      } finally {
        setLoading(false);
      }
    }
    fetchEntity();
  }, [type, id]);

  // EntityForm 内部已完成 PUT 保存并返回保存后的实体，这里只做跳转，不能再重复提交
  const handleSave = (_savedEntity: EntityFormData) => {
    setError(null);
    setSaved(true);
    setTimeout(() => {
      router.push(ENTITY_LIST_HREFS[type] || `/${type}s`);
    }, 800);
  };

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  if (error || !entity) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到该条目'}</p>
        <Link
          href={ENTITY_LIST_HREFS[type] || `/${type}s`}
          className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← 返回{TYPE_LABELS[type] ? TYPE_LABELS[type] + '列表' : type + 's'}
        </Link>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <p className="text-green-800 dark:text-green-200">保存成功！正在跳转...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          编辑{TYPE_LABELS[type] || type}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          修改{TYPE_LABELS[type] || type}信息
        </p>
      </div>
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
      <EntityForm type={type} initialData={entity} onSuccess={handleSave} />
      <div className="mt-6">
        <Link
          href={ENTITY_LIST_HREFS[type] || `/${type}s`}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← 返回{TYPE_LABELS[type] ? TYPE_LABELS[type] + '列表' : type + 's'}
        </Link>
      </div>
    </div>
  );
}
