'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { CAPITAL_DIMENSIONS } from '@/lib/fields';

interface EntityCount {
  type: string;
  label: string;
  href: string;
  count: number;
}

interface StatsData {
  entity_counts: EntityCount[];
  activity: { date: string; count: number }[];
  capital_trend: Record<string, string | number | null>[];
  decision_verdicts: { verdict: string; label: string; count: number }[];
  task_status: Record<string, number>;
}

const LINE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const VERDICT_COLORS: Record<string, string> = {
  成立: '#10b981',
  部分成立: '#f59e0b',
  被推翻: '#ef4444',
  待定: '#9ca3af',
};

function Heatmap({ activity }: { activity: { date: string; count: number }[] }) {
  // 按周分组（7 列一组从周一开始）
  const max = Math.max(1, ...activity.map((a) => a.count));
  const cells = activity.map((a) => {
    const level = a.count === 0 ? 0 : Math.min(4, Math.ceil((a.count / max) * 4));
    return { ...a, level };
  });
  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const levelClass = [
    'bg-gray-100 dark:bg-gray-700',
    'bg-blue-100 dark:bg-blue-900',
    'bg-blue-300 dark:bg-blue-700',
    'bg-blue-500 dark:bg-blue-500',
    'bg-blue-700 dark:bg-blue-300',
  ];

  return (
    <div className="flex gap-[3px] overflow-x-auto pb-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((cell) => (
            <div
              key={cell.date}
              title={`${cell.date}：${cell.count} 次更新`}
              className={`h-3 w-3 rounded-sm ${levelClass[cell.level]}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatsClient() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) setData(await res.json());
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="text-gray-500">加载统计中...</div>;
  if (!data) return <div className="text-red-500">加载失败</div>;

  const capitalHasData = data.capital_trend.some((p) =>
    CAPITAL_DIMENSIONS.some((d) => p[d.key] !== null && p[d.key] !== undefined)
  );

  return (
    <div className="space-y-6">
      {/* 实体构成 */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">实体构成</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.entity_counts}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {data.entity_counts.map((e) => (
            <Link key={e.type} href={e.href} className="text-blue-600 dark:text-blue-400 hover:underline">
              {e.label}（{e.count}）
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 资本趋势 */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">资本趋势</h2>
          {capitalHasData ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.capital_trend}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {CAPITAL_DIMENSIONS.map((dim, i) => (
                    <Line
                      key={dim.key}
                      type="monotone"
                      dataKey={dim.key}
                      name={dim.label}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]}
                      dot
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
              暂无资本条目数据。在资本页录入打分后可查看趋势。
            </p>
          )}
        </section>

        {/* 决策判定 */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">决策判定分布</h2>
          {data.decision_verdicts.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
              尚无已判定的决策。在决策详情页记录结果后可查看。
            </p>
          ) : (
            <div className="space-y-3">
              {data.decision_verdicts.map((v) => {
                const total = data.decision_verdicts.reduce((s, x) => s + x.count, 0);
                const pct = Math.round((v.count / total) * 100);
                return (
                  <div key={v.verdict}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{v.label}</span>
                      <span className="text-gray-400">{v.count} 个（{pct}%）</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: VERDICT_COLORS[v.label] || '#9ca3af' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-6 mb-2">任务状态</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            {(['todo', 'doing', 'done'] as const).map((s) => (
              <div key={s} className="rounded-lg bg-gray-50 dark:bg-gray-700 p-2">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{data.task_status[s] || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {s === 'todo' ? '待办' : s === 'doing' ? '进行中' : '已完成'}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 活动热力图 */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          近 12 周活动
        </h2>
        <Heatmap activity={data.activity} />
        <p className="mt-2 text-xs text-gray-400">按实体更新日期统计</p>
      </section>
    </div>
  );
}
