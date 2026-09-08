'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RelationsSection } from '@/components/RelationsSection';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { EntityFieldsDisplay } from '@/components/EntityFieldsDisplay';
import { BacklinksSection } from '@/components/BacklinksSection';

interface EntityData {
  id: string;
  type: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  created_at: string;
  content: string;
  frontmatter?: Record<string, unknown>;
  [key: string]: unknown;
}

interface GenericDetailProps {
  entityType: string;
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

export function GenericDetailClient({ entityType, id }: GenericDetailProps) {
  const [entity, setEntity] = useState<EntityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEntity() {
      try {
        const res = await fetch(`/api/entities/${entityType}/${id}`);
        if (!res.ok) {
          throw new Error('未找到该条目');
        }
        const data = await res.json();
        setEntity(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    }
    fetchEntity();
  }, [entityType, id]);

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  if (error || !entity) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到该条目'}</p>
        <Link
          href={TYPE_LIST_PATHS[entityType] || `/${entityType}s`}
          className="mt-4 inline-block text-accent-600 dark:text-accent-400 hover:underline"
        >
          ← 返回列表
        </Link>
      </div>
    );
  }

  const label = TYPE_LABELS[entityType] || entityType;

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {entity.title}
            </h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  entity.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : entity.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {entity.status}
              </span>
              <span>更新：{new Date(entity.updated_at).toLocaleString()}</span>
              <span>创建：{new Date(entity.created_at).toLocaleString()}</span>
            </div>
            {entity.tags && entity.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {entity.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/entities/${entityType}/${id}/edit`}
              className="btn-primary"
            >
              编辑
            </Link>
            <Link
              href={TYPE_LIST_PATHS[entityType] || `/${entityType}s`}
              className="btn-secondary"
            >
              返回列表
            </Link>
          </div>
        </div>
      </div>

      <EntityFieldsDisplay
        entityType={entityType}
        frontmatter={entity.frontmatter || entity}
      />

      <RelationsSection entityId={id} entityType={entityType} />

      <BacklinksSection entityType={entityType} entityId={id} />

      <MarkdownViewer entityType={entityType} id={id} />
    </div>
  );
}
