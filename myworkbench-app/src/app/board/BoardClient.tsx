'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { completeTaskPayload } from '@/lib/recurring';

interface BoardItem {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  due_date?: string;
  recurrence?: string;
  recurrence_until?: string;
}

interface BoardType {
  type: string;
  label: string;
  columns: { status: string; label: string }[];
}

const BOARD_TYPES: BoardType[] = [
  {
    type: 'task',
    label: '任务',
    columns: [
      { status: 'todo', label: '待办' },
      { status: 'doing', label: '进行中' },
      { status: 'done', label: '已完成' },
    ],
  },
  {
    type: 'project',
    label: '项目',
    columns: [
      { status: 'active', label: '进行中' },
      { status: 'draft', label: '规划中' },
      { status: 'archived', label: '已归档' },
    ],
  },
  {
    type: 'opportunity',
    label: '机会',
    columns: [
      { status: 'active', label: '跟进中' },
      { status: 'draft', label: '观察中' },
      { status: 'archived', label: '已关闭' },
    ],
  },
  {
    type: 'experiment',
    label: '实验',
    columns: [
      { status: 'active', label: '进行中' },
      { status: 'draft', label: '设计中' },
      { status: 'archived', label: '已完成' },
    ],
  },
];

const COLUMN_COLORS: Record<string, string> = {
  todo: 'border-t-gray-400',
  doing: 'border-t-accent-500',
  done: 'border-t-emerald-500',
  active: 'border-t-emerald-500',
  draft: 'border-t-amber-500',
  archived: 'border-t-gray-400',
};

function detailHref(type: string, id: string): string {
  const map: Record<string, string> = {
    task: '/entities/task',
    project: '/projects',
    opportunity: '/opportunity',
    experiment: '/experiment',
  };
  return `${map[type] || '/entities'}/${id}`;
}

function editHref(type: string, id: string): string {
  return `/entities/${type}/${id}/edit`;
}

export function BoardClient() {
  const [typeIndex, setTypeIndex] = useState(0);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<Record<string, string[]>>({});

  const board = BOARD_TYPES[typeIndex];

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [res, saved] = await Promise.all([
          fetch(`/api/entities/${board.type}`),
          typeof window !== 'undefined'
            ? Promise.resolve(localStorage.getItem(`mwbench_board_order_${board.type}`))
            : Promise.resolve(null),
        ]);
        if (res.ok) setItems(await res.json());
        else setItems([]);
        if (saved) {
          try {
            setColumnOrder(JSON.parse(saved));
          } catch {
            setColumnOrder({});
          }
        }
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [board.type]);

  const setStatus = async (item: BoardItem, status: string) => {
    if (item.status === status) return;
    const data =
      board.type === 'task' && status === 'done'
        ? completeTaskPayload(item).data
        : { status };
    try {
      const res = await fetch(`/api/entities/${board.type}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) throw new Error('更新失败');
      setItems((prev) => {
        const next = prev.map((it) => (it.id === item.id ? { ...it, ...data, updated_at: new Date().toISOString() } : it));
        const src = next.filter((it) => it.status === item.status && it.id !== item.id).map((it) => it.id);
        const dst = next.filter((it) => it.status === status).map((it) => it.id);
        const newOrder: Record<string, string[]> = {};
        if (src.length > 0 || dst.length > 0) {
          newOrder[item.status] = src;
          newOrder[status] = dst;
        }
        if (Object.keys(newOrder).length > 0) {
          setColumnOrder((prev) => {
            const merged = { ...prev, ...newOrder };
            if (typeof window !== 'undefined') {
              localStorage.setItem(`mwbench_board_order_${board.type}`, JSON.stringify(merged));
            }
            return merged;
          });
        }
        return next;
      });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('更新状态失败');
    }
  };

  if (loading) return <div className="text-gray-500">加载看板中...</div>;

  const visible = items.filter((it) => it.status !== 'archived' || board.columns.some((c) => c.status === 'archived'));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {BOARD_TYPES.map((t, i) => (
          <button
            key={t.type}
            onClick={() => setTypeIndex(i)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              typeIndex === i
                ? 'bg-accent-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-gray-400">
          拖动卡片到目标列，或用卡片上的按钮切换状态
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {board.columns.map((col) => {
          const colItems = visible
            .filter((it) => it.status === col.status)
            .sort((a, b) => {
              const order = columnOrder[col.status];
              if (!order) return 0;
              return order.indexOf(a.id) - order.indexOf(b.id);
            });
          return (
            <div
              key={col.status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(col.status);
              }}
              onDragLeave={() => setDragOver((prev) => (prev === col.status ? null : prev))}
              onDrop={() => {
                const item = items.find((it) => it.id === dragging);
                setDragging(null);
                setDragOver(null);
                if (item) setStatus(item, col.status);
              }}
              className={`bg-gray-50 dark:bg-gray-900/40 rounded-lg border border-gray-200 dark:border-gray-700 border-t-4 ${
                COLUMN_COLORS[col.status] || 'border-t-gray-400'
              } p-3 min-h-[200px] transition-colors ${
                dragOver === col.status ? 'ring-2 ring-accent-400 bg-accent-50/50 dark:bg-accent-900/20' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{col.label}</h3>
                <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
                  {colItems.length}
                </span>
              </div>

              <div className="space-y-2">
                {colItems.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6">拖动卡片到这里</p>
                )}
                {colItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDragging(item.id)}
                    onDragEnd={() => setDragging(null)}
                    className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm cursor-grab active:cursor-grabbing ${
                      dragging === item.id ? 'opacity-50' : ''
                    }`}
                  >
                    <Link
                      href={detailHref(board.type, item.id)}
                      className="text-sm font-medium text-gray-900 dark:text-white hover:text-accent-600 dark:hover:text-accent-400 line-clamp-2"
                    >
                      {item.title}
                    </Link>
                    {item.tags && item.tags.length > 0 && (
                      <p className="mt-1 text-[11px] text-gray-400">{item.tags.slice(0, 3).join(' / ')}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">
                        {new Date(item.updated_at).toLocaleDateString('zh-CN')}
                      </span>
                      <div className="flex gap-1">
                        {board.columns
                          .filter((c) => c.status !== item.status)
                          .slice(0, 2)
                          .map((c) => (
                            <button
                              key={c.status}
                              onClick={() => setStatus(item, c.status)}
                              title={`移到「${c.label}」`}
                              className="text-[10px] px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              →{c.label}
                            </button>
                          ))}
                        <Link
                          href={editHref(board.type, item.id)}
                          className="text-[10px] px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          编辑
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
