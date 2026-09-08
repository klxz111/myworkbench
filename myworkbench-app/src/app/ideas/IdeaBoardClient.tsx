'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, StatusBadge } from '@/components/ui';

/**
 * 想法看板：研究想法的生命周期（想法 → 调研中 → 验证中 → 已立项 / 已搁置）。
 * idea 是注册实体（entities/ideas/*.md）；卡片 ◀▶ 在相邻状态间移动（PUT status）。
 */

interface IdeaItem {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  hypothesis?: string;
  novelty?: string;
  feasibility?: string;
  next_step?: string;
}

const COLUMNS: { key: string; label: string; hint: string }[] = [
  { key: 'idea', label: '想法', hint: '一句话假设' },
  { key: 'exploring', label: '调研中', hint: '查文献、评估可行性' },
  { key: 'validating', label: '验证中', hint: '跑最小实验' },
  { key: 'adopted', label: '已立项', hint: '转入研究/实验推进' },
  { key: 'shelved', label: '已搁置', hint: '记录原因，留档' },
];

const LEVEL_CLS: Record<string, string> = {
  high: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const LEVEL_LABEL: Record<string, string> = { high: '高', medium: '中', low: '低' };

export function IdeaBoardClient() {
  const [items, setItems] = useState<IdeaItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/entities/idea?limit=200');
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      setItems((data.items || []) as IdeaItem[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="text-gray-500">加载想法中...</div>;

  const move = async (item: IdeaItem, dir: -1 | 1) => {
    const idx = COLUMNS.findIndex((c) => c.key === item.status);
    const target = COLUMNS[idx + dir];
    if (!target) return;
    setMoving(item.id);
    const prevStatus = item.status;
    setItems((prev) => (prev ? prev.map((i) => (i.id === item.id ? { ...i, status: target.key } : i)) : prev));
    try {
      const res = await fetch(`/api/entities/idea/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { status: target.key } }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setItems((prev) => (prev ? prev.map((i) => (i.id === item.id ? { ...i, status: prevStatus } : i)) : prev));
      alert('状态更新失败');
    } finally {
      setMoving(null);
    }
  };

  const colIdxOf = (status: string) => COLUMNS.findIndex((c) => c.key === status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="想法看板"
        description="研究想法的生命周期：一句话假设起步，验证通过就立项"
        actions={
          <Link href="/entities/idea/new" className="btn-primary">
            新建想法
          </Link>
        }
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {COLUMNS.map((col) => {
          const ideas = (items || []).filter((i) => (i.status || 'idea') === col.key);
          return (
            <div key={col.key} className="card p-4 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{col.label}</h2>
                <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">{ideas.length}</span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">{col.hint}</p>
              <div className="space-y-2 min-h-[80px]">
                {ideas.length === 0 ? (
                  <p className="text-xs text-gray-300 dark:text-gray-600 py-2">—</p>
                ) : (
                  ideas.map((idea) => {
                    const idx = colIdxOf(idea.status || 'idea');
                    return (
                      <div key={idea.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:border-accent-300 dark:hover:border-accent-700 transition-colors">
                        <Link href={`/ideas/${idea.id}`} className="block text-sm font-medium text-gray-900 dark:text-white hover:text-accent-600 dark:hover:text-accent-400">
                          {idea.title}
                        </Link>
                        {idea.next_step && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">下一步：{idea.next_step}</p>
                        )}
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          <StatusBadge status={idea.status || 'idea'} />
                          {idea.novelty && (
                            <span className={`badge text-[10px] ${LEVEL_CLS[idea.novelty] || LEVEL_CLS.low}`}>新颖 {LEVEL_LABEL[idea.novelty] || idea.novelty}</span>
                          )}
                          {idea.feasibility && (
                            <span className={`badge text-[10px] ${LEVEL_CLS[idea.feasibility] || LEVEL_CLS.low}`}>可行 {LEVEL_LABEL[idea.feasibility] || idea.feasibility}</span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-1">
                          <button
                            onClick={() => move(idea, -1)}
                            disabled={idx <= 0 || moving === idea.id}
                            title="退回上一阶段"
                            className="px-1.5 py-0.5 rounded text-[10px] btn-ghost disabled:opacity-30"
                          >
                            ◀
                          </button>
                          <button
                            onClick={() => move(idea, 1)}
                            disabled={idx >= COLUMNS.length - 1 || moving === idea.id}
                            title="推进到下一阶段"
                            className="px-1.5 py-0.5 rounded text-[10px] btn-ghost disabled:opacity-30"
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {items && items.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          还没有想法。点「新建想法」从一句话假设开始；验证产出的实验和证据可以回链到想法。
        </p>
      )}
    </div>
  );
}
