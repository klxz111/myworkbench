'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';

/**
 * 首页「我的投入」widget 内容（全宽）：活跃热力图 + 任务完成率 + 资产构成。
 * 数据来自已有 /api/stats（自带 60s 缓存），仅在该 widget 未被隐藏时才挂载/拉取。
 */
interface StatsResponse {
  entity_counts: { type: string; label: string; href: string; count: number }[];
  activity: { date: string; count: number }[];
  task_status: Record<string, number>;
}

export function InsightsContent() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/stats')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('stats unavailable'))))
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return <p className="text-sm text-gray-400 dark:text-gray-500 py-1">统计数据暂时不可用。</p>;
  }
  if (!stats) {
    return <p className="text-sm text-gray-400 dark:text-gray-500 py-1">加载统计数据中...</p>;
  }

  const { activity, task_status, entity_counts } = stats;
  const todo = task_status.todo || 0;
  const doing = task_status.doing || 0;
  const done = task_status.done || 0;
  const activeTotal = todo + doing + done;
  const rate = activeTotal > 0 ? Math.round((done / activeTotal) * 100) : 0;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="min-w-0">
        <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">近 12 周活跃</p>
        <div className="overflow-x-auto scroll-thin pb-1">
          <ActivityHeatmap activity={activity} weeks={12} />
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">任务完成率</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white leading-none">{rate}%</p>
        <div className="mt-2.5 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rate}%` }} />
        </div>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          待办 {todo} · 进行中 {doing} · 已完成 {done}
        </p>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">资产构成</p>
        <div className="flex flex-wrap gap-1.5">
          {entity_counts.slice(0, 6).map((c) => (
            <Link
              key={c.type}
              href={c.href}
              className="badge bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-accent-50 hover:text-accent-700 dark:hover:bg-accent-900/40 dark:hover:text-accent-300"
            >
              {c.label} {c.count}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
