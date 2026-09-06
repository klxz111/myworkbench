'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { parseDateOnly } from '@/lib/date-utils';
import { SectionCard, DatedItemList, completeDatedTask, DatedEntry } from '@/components/ui';

interface TodayData {
  date: string;
  overdue: DatedEntry[];
  today: DatedEntry[];
  upcoming: DatedEntry[];
  events_today: DatedEntry[];
  events_this_week: DatedEntry[];
  doing: { id: string; title: string; href: string }[];
  todo_count: number;
  recent: { id: string; type: string; title: string; status: string; updated_at: string; href: string }[];
}

export function TodayClient() {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickTitle, setQuickTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/today');
      if (res.ok) setData(await res.json());
    } catch (error) {
      console.error('Error fetching today:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleComplete = async (item: DatedEntry) => {
    await completeDatedTask(item);
    load();
  };

  const quickAdd = async () => {
    const title = quickTitle.trim();
    if (!title || !data) return;
    setAdding(true);
    setAddError(null);
    try {
      const slug = `task-${Date.now().toString(36)}`;
      const res = await fetch('/api/entities/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          data: {
            id: slug,
            type: 'task',
            title,
            status: 'todo',
            tags: ['quick-capture'],
            due_date: data.date,
          },
          content: '',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '创建失败');
      }
      setQuickTitle('');
      load();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '快速添加失败');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="text-gray-500">加载今日视图中...</div>;
  if (!data) return <div className="text-red-500">加载失败</div>;

  const overdueCount = data.overdue.length;
  const dateLabel = parseDateOnly(data.date)?.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }) ?? data.date;

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-400 dark:text-gray-500">{dateLabel}</p>

      {/* 快速捕获 */}
      <div className="card p-5">
        <div className="flex gap-2">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !adding && quickAdd()}
            placeholder="快速添加今日任务，回车确认..."
            className="input flex-1"
          />
          <button
            onClick={quickAdd}
            disabled={adding || !quickTitle.trim()}
            className="btn-primary shrink-0"
          >
            {adding ? '添加中...' : '添加'}
          </button>
        </div>
        {addError && <p className="mt-2 text-xs text-red-600">{addError}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <SectionCard title="已逾期" count={overdueCount}>
            <DatedItemList items={data.overdue} emptyText="没有逾期事项，保持得很好。" onComplete={handleComplete} />
          </SectionCard>

          <SectionCard title="今日到期" count={data.today.length}>
            <DatedItemList items={data.today} emptyText="今天没有到期事项。" onComplete={handleComplete} />
          </SectionCard>

          <SectionCard title="未来 7 天" count={data.upcoming.length}>
            <DatedItemList items={data.upcoming} emptyText="未来一周暂无安排。" onComplete={handleComplete} />
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard title="进行中的任务">
            {data.doing.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-1">
                没有进行中的任务{data.todo_count > 0 ? `（待办 ${data.todo_count} 个）` : ''}。
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.doing.map((t) => (
                  <li key={t.id}>
                    <Link href={t.href} className="flex items-center gap-2 px-1 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span className="flex-1 truncate text-sm text-gray-900 dark:text-gray-200">{t.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/tasks" className="inline-block mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
              查看全部任务 →
            </Link>
          </SectionCard>

          <SectionCard title="今天的事件" count={data.events_today.length}>
            <DatedItemList items={data.events_today} showDue={false} emptyText="今天没有事件记录。" />
            {data.events_this_week.length > 0 && (
              <Link href="/calendar" className="inline-block mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                本周还有 {data.events_this_week.length} 个事件，查看日历 →
              </Link>
            )}
          </SectionCard>

          <SectionCard title="最近一周变更">
            {data.recent.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-1">最近一周没有实体更新。</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.recent.map((r) => (
                  <li key={`${r.type}-${r.id}`}>
                    <Link href={r.href} className="flex items-center gap-2 px-1 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <span className="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-gray-200">{r.title}</span>
                      <span className="shrink-0 text-xs text-gray-400">
                        {new Date(r.updated_at).toLocaleDateString('zh-CN')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
