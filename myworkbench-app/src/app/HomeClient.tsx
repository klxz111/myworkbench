'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { DataManagement } from '@/components/DataManagement';
import { SectionCard, DatedItemList, completeDatedTask, DatedEntry, StatusBadge } from '@/components/ui';
import { entityHref } from '@/lib/entity-paths';

/**
 * 今日工作台（首页）：打开就知道现在该做什么。
 * 左列 = 已逾期 / 今日到期 / 待审核门控（可就地完成）；
 * 右列 = 快速捕获 / 最近变更 / 策略一行。
 * 长尾概览（资本/事件/项目/档案等）不再铺在首页，收进底部「更多概览」入口。
 */

interface DashboardItem {
  id: string;
  type: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

interface DashboardResponse {
  recent_changes: DashboardItem[];
  pending_reviews: Array<DashboardItem & { gate_status: string; review_date?: string }>;
  overdue_count: number;
  upcoming_count: number;
}

interface TodayResponse {
  date: string;
  overdue: DatedEntry[];
  today: DatedEntry[];
  upcoming: DatedEntry[];
}

function GateReviewList({ items }: { items: DashboardResponse['pending_reviews'] }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500 py-1">没有待审核的门控。</p>;
  }
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
      {items.map((item) => {
        const overdue = item.gate_status === 'overdue';
        const upcoming = item.gate_status === 'upcoming';
        return (
          <li key={item.id}>
            <Link href={`/decisions/${item.id}`} className="flex items-center gap-3 px-1 py-2.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                overdue
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  : upcoming
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
              }`}>
                门控审核
              </span>
              <span className="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-gray-200">{item.title}</span>
              <span className={`shrink-0 text-xs ${
                overdue ? 'text-red-600 dark:text-red-400 font-medium' : upcoming ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'
              }`}>
                {item.review_date ? new Date(item.review_date).toLocaleDateString('zh-CN') : '未设置'}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function HomeClient() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickTitle, setQuickTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [todayRes, dashboardRes] = await Promise.all([
        fetch('/api/today').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/dashboard').then((r) => (r.ok ? r.json() : null)),
      ]);
      setToday(todayRes);
      setDashboard(dashboardRes);
    } catch (error) {
      console.error('Error loading workbench:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleComplete = async (item: DatedEntry) => {
    setCompleting(item.id);
    if (await completeDatedTask(item)) {
      await load();
    }
    setCompleting(null);
  };

  const quickAdd = async () => {
    const title = quickTitle.trim();
    if (!title || !today) return;
    setAdding(true);
    setAddError(null);
    try {
      const slug = `task-${Date.now().toString(36)}`;
      const res = await fetch('/api/entities/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          data: { id: slug, type: 'task', title, status: 'todo', tags: ['quick-capture'], due_date: today.date },
          content: '',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '创建失败');
      }
      setQuickTitle('');
      await load();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '快速添加失败');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载工作台中...</div>;
  }

  const overdue = today?.overdue || [];
  const dueToday = today?.today || [];
  const pendingReviews = dashboard?.pending_reviews || [];
  const strategies = (dashboard?.recent_changes || []).filter((item) => item.type === 'strategy').slice(0, 3);
  const recentChanges = (dashboard?.recent_changes || []).slice(0, 8);
  const overdueCount = dashboard?.overdue_count || 0;
  const upcomingCount = dashboard?.upcoming_count || 0;

  return (
    <div className="space-y-6">
      {/* 逾期 / 临期提醒横幅 */}
      {overdueCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-5 py-3.5 flex items-center gap-4">
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-red-600 text-white text-xs font-bold">
            {overdueCount}
          </span>
          <span className="flex-1 text-sm text-red-800 dark:text-red-200">
            {overdueCount} 项事项已逾期，需要关注
          </span>
          <Link href="/today" className="text-sm font-medium text-red-700 dark:text-red-300 hover:underline whitespace-nowrap">
            去处理 →
          </Link>
        </div>
      )}
      {overdueCount === 0 && upcomingCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-5 py-3.5 flex items-center gap-4">
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-amber-500 text-white text-xs font-bold">
            {upcomingCount}
          </span>
          <span className="flex-1 text-sm text-amber-800 dark:text-amber-200">
            {upcomingCount} 项事项将在 7 天内到期
          </span>
          <Link href="/today" className="text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline whitespace-nowrap">
            查看 →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 左列：现在该做的事 */}
        <div className="lg:col-span-3 space-y-6">
          <SectionCard title="已逾期" count={overdue.length}>
            <DatedItemList items={overdue} emptyText="没有逾期事项，保持得很好。" onComplete={handleComplete} />
          </SectionCard>

          <SectionCard title="今日到期" count={dueToday.length}>
            <DatedItemList items={dueToday} emptyText="今天没有到期事项。" onComplete={handleComplete} />
          </SectionCard>

          <SectionCard
            title="待审核门控"
            count={pendingReviews.length}
            actions={
              <Link href="/decisions" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                全部决策 →
              </Link>
            }
          >
            <GateReviewList items={pendingReviews} />
          </SectionCard>
        </div>

        {/* 右列：捕获 / 变更 / 策略 */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="快速捕获">
            <div className="flex gap-2">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !adding && quickAdd()}
                placeholder="记一件事，回车确认..."
                className="input flex-1 min-w-0"
              />
              <button onClick={quickAdd} disabled={adding || !quickTitle.trim()} className="btn-primary shrink-0">
                {adding ? '添加中...' : '添加'}
              </button>
            </div>
            {addError && <p className="mt-2 text-xs text-red-600">{addError}</p>}
          </SectionCard>

          <SectionCard
            title="最近变更"
            actions={
              <Link href="/stats" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                统计 →
              </Link>
            }
          >
            {recentChanges.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-1">暂无最近活动。</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentChanges.map((item) => (
                  <li key={`${item.type}-${item.id}`}>
                    <Link href={entityHref(item.type, item.id)} className="flex items-center gap-2 px-1 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <span className="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-gray-200">{item.title}</span>
                      <span className="shrink-0 text-xs text-gray-400">{new Date(item.updated_at).toLocaleDateString('zh-CN')}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="策略"
            actions={
              <Link href="/strategy" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                管理 →
              </Link>
            }
          >
            {strategies.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-1">
                暂无策略。<Link href="/entities/strategy/new" className="text-blue-600 dark:text-blue-400 hover:underline">创建第一个 →</Link>
              </p>
            ) : (
              <ul className="space-y-2">
                {strategies.map((strategy) => (
                  <li key={strategy.id}>
                    <Link href={`/strategy/${strategy.id}`} className="flex items-center justify-between gap-2 px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                      <span className="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-white">{strategy.title}</span>
                      <StatusBadge status={strategy.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <details className="card p-5">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-300 select-none">
              数据管理（导出 / 导入）
            </summary>
            <div className="mt-3">
              <DataManagement />
            </div>
          </details>
        </div>
      </div>

      {/* 长尾概览入口：数据在各自专属页可见，不再铺满首页 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-sm text-gray-500 dark:text-gray-400">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">更多概览</span>
        <Link href="/opportunity" className="hover:text-blue-600 dark:hover:text-blue-400">机会</Link>
        <Link href="/people" className="hover:text-blue-600 dark:hover:text-blue-400">人脉跟进</Link>
        <Link href="/capital" className="hover:text-blue-600 dark:hover:text-blue-400">资本</Link>
        <Link href="/events" className="hover:text-blue-600 dark:hover:text-blue-400">事件</Link>
        <Link href="/research" className="hover:text-blue-600 dark:hover:text-blue-400">研究</Link>
        <Link href="/projects" className="hover:text-blue-600 dark:hover:text-blue-400">项目</Link>
      </div>
    </div>
  );
}
