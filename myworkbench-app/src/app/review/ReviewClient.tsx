'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ENTITY_LABELS, entityHref } from '@/lib/entity-paths';

interface TypeGroup {
  type: string;
  count: number;
  items: { id: string; title: string }[];
}

interface DueSoonItem {
  id: string;
  type: string;
  title: string;
  kind: string;
  kind_label?: string;
  date: string;
  diff_days: number;
  href: string;
}

interface ReviewData {
  week_start: string;
  created: TypeGroup[];
  updated: TypeGroup[];
  tasks_done: number;
  beliefs_updated: number;
  decisions_judged: { id: string; title: string; verdict_label: string }[];
  capital_added: { id: string; title: string }[];
  due_soon: DueSoonItem[];
}

const VERDICT_BADGE: Record<string, string> = {
  成立: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  部分成立: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  被推翻: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  待定: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

function GroupList({ groups }: { groups: TypeGroup[] }) {
  if (groups.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500 py-1">本周没有。</p>;
  }
  return (
    <ul className="space-y-2">
      {groups.map((g) => (
        <li key={g.type}>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {ENTITY_LABELS[g.type] || g.type} · {g.count}
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {g.items.map((item) => (
              <Link
                key={item.id}
                href={entityHref(g.type, item.id)}
                className="px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ReviewClient() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/review');
        if (res.ok) setData(await res.json());
      } catch (error) {
        console.error('Error fetching review:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="text-gray-500">生成周回顾中...</div>;
  if (!data) return <div className="text-red-500">加载失败</div>;

  const stats = [
    { label: '本周新建', value: data.created.reduce((s, g) => s + g.count, 0) },
    { label: '本周更新', value: data.updated.reduce((s, g) => s + g.count, 0) },
    { label: '完成任务', value: data.tasks_done },
    { label: '信念更新', value: data.beliefs_updated },
    { label: '已判定决策', value: data.decisions_judged.length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">本周新建</h2>
          <GroupList groups={data.created} />
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">本周更新</h2>
          <GroupList groups={data.updated} />
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">本周判定结果</h2>
          {data.decisions_judged.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-1">本周没有记录决策结果。</p>
          ) : (
            <ul className="space-y-2">
              {data.decisions_judged.map((d) => (
                <li key={d.id} className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${VERDICT_BADGE[d.verdict_label] || VERDICT_BADGE['待定']}`}>
                    {d.verdict_label}
                  </span>
                  <Link href={`/decisions/${d.id}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    {d.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">未来 7 天需要关注</h2>
          {data.due_soon.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-1">未来一周没有到期事项。</p>
          ) : (
            <ul className="space-y-2">
              {data.due_soon.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Link href={item.href} className="flex items-center gap-2 text-sm">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {item.kind_label}
                    </span>
                    <span className="flex-1 truncate text-gray-900 dark:text-gray-200">{item.title}</span>
                    <span className={item.diff_days < 0 ? 'text-xs text-red-600 dark:text-red-400' : 'text-xs text-gray-400'}>
                      {item.diff_days < 0 ? `逾期 ${Math.abs(item.diff_days)} 天` : item.diff_days === 0 ? '今天' : `${item.diff_days} 天后`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
