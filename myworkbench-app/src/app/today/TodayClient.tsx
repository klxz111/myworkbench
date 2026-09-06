'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { parseDateOnly } from '@/lib/date-utils';

interface DatedItem {
  id: string;
  type: string;
  title: string;
  kind: string;
  kind_label?: string;
  date: string;
  diff_days?: number;
  href: string;
}

interface TodayData {
  date: string;
  overdue: DatedItem[];
  today: DatedItem[];
  upcoming: DatedItem[];
  events_today: DatedItem[];
  events_this_week: DatedItem[];
  doing: { id: string; title: string; href: string }[];
  todo_count: number;
  recent: { id: string; type: string; title: string; status: string; updated_at: string; href: string }[];
}

const KIND_COLORS: Record<string, string> = {
  task: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  gate: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  followup: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  deadline: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  event: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

function ItemRow({ item, showDue = true }: { item: DatedItem; showDue?: boolean }) {
  return (
    <li>
      <Link
        href={item.href}
        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded"
      >
        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${KIND_COLORS[item.kind] || KIND_COLORS.event}`}>
          {item.kind_label || item.kind}
        </span>
        <span className="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-gray-200">
          {item.title}
        </span>
        {showDue && item.diff_days !== undefined && (
          <span className={`shrink-0 text-xs ${item.diff_days < 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-400'}`}>
            {item.diff_days < 0 ? `逾期 ${Math.abs(item.diff_days)} 天` : item.diff_days === 0 ? '今天' : `${item.diff_days} 天后`}
          </span>
        )}
      </Link>
    </li>
  );
}

function Section({
  title,
  count,
  tone,
  children,
}: {
  title: string;
  count?: number;
  tone: 'red' | 'blue' | 'gray' | 'purple';
  children: React.ReactNode;
}) {
  const toneClass =
    tone === 'red'
      ? 'border-l-red-500'
      : tone === 'blue'
      ? 'border-l-blue-500'
      : tone === 'purple'
      ? 'border-l-purple-500'
      : 'border-l-gray-300 dark:border-l-gray-600';
  return (
    <section className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-l-4 ${toneClass} p-5`}>
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
        {title}
        {count !== undefined && count > 0 && (
          <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
            {count}
          </span>
        )}
      </h2>
      {children}
    </section>
  );
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
      {/* 快速捕获 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !adding && quickAdd()}
            placeholder="快速添加今日任务，回车确认..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={quickAdd}
            disabled={adding || !quickTitle.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {adding ? '添加中...' : '添加'}
          </button>
        </div>
        {addError && <p className="mt-2 text-xs text-red-600">{addError}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <Section title="已逾期" count={overdueCount} tone="red">
            {overdueCount === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-1">没有逾期事项，保持得很好。</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.overdue.map((item) => (
                  <ItemRow key={`${item.kind}-${item.id}`} item={item} />
                ))}
              </ul>
            )}
          </Section>

          <Section title="今日到期" count={data.today.length} tone="blue">
            {data.today.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-1">今天没有到期事项。</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.today.map((item) => (
                  <ItemRow key={`${item.kind}-${item.id}`} item={item} />
                ))}
              </ul>
            )}
          </Section>

          <Section title="未来 7 天" count={data.upcoming.length} tone="gray">
            {data.upcoming.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-1">未来一周暂无安排。</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.upcoming.map((item) => (
                  <ItemRow key={`${item.kind}-${item.id}`} item={item} />
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="进行中的任务" tone="purple">
            {data.doing.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-1">
                没有进行中的任务{data.todo_count > 0 ? `（待办 ${data.todo_count} 个）` : ''}。
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.doing.map((t) => (
                  <li key={t.id}>
                    <Link href={t.href} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span className="flex-1 truncate text-sm text-gray-900 dark:text-gray-200">{t.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/tasks" className="inline-block mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
              查看全部任务 →
            </Link>
          </Section>

          <Section title="今天的事件" count={data.events_today.length} tone="gray">
            {data.events_today.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-1">今天没有事件记录。</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.events_today.map((item) => (
                  <ItemRow key={item.id} item={item} showDue={false} />
                ))}
              </ul>
            )}
            {data.events_this_week.length > 0 && (
              <Link href="/calendar" className="inline-block mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                本周还有 {data.events_this_week.length} 个事件，查看日历 →
              </Link>
            )}
          </Section>

          <Section title="最近一周变更" tone="gray">
            {data.recent.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-1">最近一周没有实体更新。</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.recent.map((r) => (
                  <li key={`${r.type}-${r.id}`}>
                    <Link href={r.href} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded">
                      <span className="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-gray-200">{r.title}</span>
                      <span className="shrink-0 text-xs text-gray-400">
                        {new Date(r.updated_at).toLocaleDateString('zh-CN')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
