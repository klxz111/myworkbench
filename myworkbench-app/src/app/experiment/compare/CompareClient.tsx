'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageHeader, StatusBadge } from '@/components/ui';

/**
 * 实验并排对比：/experiment 列表勾选 2-4 个后进入。
 * 行 = 对比维度（假设/配置/指标/结果/解读…），列 = 实验；逐列拉取详情接口。
 */

interface ExperimentDetail {
  id: string;
  title: string;
  status: string;
  tags: string[];
  content?: string;
  hypothesis?: string;
  config?: string;
  metrics?: string;
  setup?: string;
  result?: string;
  failure_mode?: string;
  interpretation?: string;
  follow_up?: string;
  artifacts?: string;
  updated_at?: string;
}

const ROWS: { key: keyof ExperimentDetail; label: string }[] = [
  { key: 'hypothesis', label: '假设' },
  { key: 'config', label: '配置摘要' },
  { key: 'metrics', label: '指标结果' },
  { key: 'setup', label: '设置' },
  { key: 'result', label: '结果' },
  { key: 'interpretation', label: '解读' },
  { key: 'failure_mode', label: '失败模式' },
  { key: 'follow_up', label: '后续跟进' },
  { key: 'artifacts', label: '产物链接' },
];

function Cell({ value }: { value: string | undefined }) {
  if (!value || !value.trim()) {
    return <span className="text-gray-300 dark:text-gray-600">—</span>;
  }
  return <p className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-200">{value}</p>;
}

export function CompareClient() {
  const searchParams = useSearchParams();
  const ids = (searchParams.get('ids') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const [experiments, setExperiments] = useState<ExperimentDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const details = await Promise.all(
          ids.map(async (id) => {
            try {
              const res = await fetch(`/api/entities/experiment/${encodeURIComponent(id)}`);
              return res.ok ? ((await res.json()) as ExperimentDetail) : null;
            } catch {
              return null;
            }
          })
        );
        if (!cancelled) setExperiments(details.filter((d): d is ExperimentDetail => d !== null));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ids.join(',')]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="实验对比"
        description={experiments.length > 0 ? `${experiments.length} 个实验并排比较` : '从实验列表勾选 2-4 个进入对比'}
        actions={
          <Link href="/experiment" className="btn-secondary">
            返回实验列表
          </Link>
        }
      />

      {loading ? (
        <p className="text-gray-500">加载实验详情中...</p>
      ) : experiments.length < 2 ? (
        <div className="card p-6 text-center text-gray-500">
          可对比的实验不足 2 个（可能已被删除）。回实验列表重新勾选。
        </div>
      ) : (
        <div className="card overflow-x-auto scroll-thin">
          <table className="w-full border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="sticky left-0 bg-white dark:bg-gray-800 text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 w-28">
                  维度
                </th>
                {experiments.map((exp) => (
                  <th key={exp.id} className="text-left px-4 py-3 align-top min-w-[220px]">
                    <Link
                      href={`/experiment/${exp.id}`}
                      className="text-sm font-semibold text-gray-900 dark:text-white hover:text-accent-600 dark:hover:text-accent-400"
                    >
                      {exp.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={exp.status} />
                      {exp.updated_at && (
                        <span className="text-[10px] text-gray-400">
                          {new Date(exp.updated_at).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, rowIndex) => (
                <tr key={row.key} className={rowIndex % 2 === 1 ? 'bg-gray-50/60 dark:bg-gray-900/40' : ''}>
                  <td className="sticky left-0 bg-inherit px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 align-top border-t border-gray-100 dark:border-gray-800">
                    {row.label}
                  </td>
                  {experiments.map((exp) => (
                    <td key={exp.id} className="px-4 py-3 align-top border-t border-gray-100 dark:border-gray-800">
                      <Cell value={exp[row.key] as string | undefined} />
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="sticky left-0 px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 align-top border-t border-gray-100 dark:border-gray-800">
                  标签
                </td>
                {experiments.map((exp) => (
                  <td key={exp.id} className="px-4 py-3 align-top border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-wrap gap-1.5">
                      {(exp.tags || []).map((tag) => (
                        <span key={tag} className="badge bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
