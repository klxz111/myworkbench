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
          throw new Error(`未找到${TYPE_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1)}`);
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

  const handleSave = (savedEntity: EntityFormData) => {
    setSaved(true);
    router.push(ENTITY_LIST_HREFS[type] || `/${type}s`);
  };

  if (loading) {
    return <div className="text-gray-500">加载编辑表单中...</div>;
  }

  if (error || !entity) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || `未找到${TYPE_LABELS[type] || type}`}</p>
        <Link href={ENTITY_LIST_HREFS[type] || `/${type}s`} className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← 返回{TYPE_LABELS[type] ? TYPE_LABELS[type] + '列表' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
        </Link>
      </div>
    );
  }

  // 完整透传 GET 返回的 frontmatter 展开字段（含知识树定位等新增字段），只做兜底默认值
  const initialData: EntityData = {
    ...entity,
    id: entity.id,
    title: entity.title,
    status: entity.status,
    tags: entity.tags,
    content: entity.content,
  };

  return (
    <div className="space-y-6">
      {saved && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-200">{TYPE_LABELS[type] || type}保存成功！正在跳转...</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <EntityForm
          type={type}
          initialData={initialData}
          onSuccess={handleSave}
          onCancel={() => window.history.back()}
        />
      </div>
    </div>
  );
}
