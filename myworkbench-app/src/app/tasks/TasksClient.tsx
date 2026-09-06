'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useListControls, ListToolbar } from '@/components/ListControls';

interface Task {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  due_date?: string;
  priority?: string;
  notes?: string;
}

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const SECTION_META: { status: string; label: string; accent: string }[] = [
  { status: 'todo', label: '待办', accent: 'border-l-gray-400' },
  { status: 'doing', label: '进行中', accent: 'border-l-blue-500' },
  { status: 'done', label: '已完成', accent: 'border-l-emerald-500' },
];

function dueMeta(task: Task): { text: string; overdue: boolean } | null {
  if (!task.due_date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.due_date);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const dateStr = new Date(task.due_date).toLocaleDateString('zh-CN');
  if (diff < 0) return { text: `逾期 ${Math.abs(diff)} 天（${dateStr}）`, overdue: true };
  if (diff === 0) return { text: '今天到期', overdue: false };
  return { text: `${diff} 天后（${dateStr}）`, overdue: false };
}

export function TasksClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch('/api/entities/task');
        if (res.ok) setTasks(await res.json());
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  const controls = useListControls(tasks);

  const setStatus = async (task: Task, status: string) => {
    try {
      const res = await fetch(`/api/entities/task/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { status } }),
      });
      if (!res.ok) throw new Error('更新失败');
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status, updated_at: new Date().toISOString() } : t))
      );
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('更新任务状态失败');
    }
  };

  const cycle = (task: Task) => {
    const next = task.status === 'done' ? 'todo' : 'done';
    setStatus(task, next);
  };

  if (loading) {
    return <div className="text-gray-500">加载任务中...</div>;
  }

  const visible = controls.items.filter((t) => t.status !== 'archived');

  return (
    <div className="space-y-6">
      {tasks.length > 0 && (
        <ListToolbar {...controls.toolbar} placeholder="搜索任务标题 / 标签..." />
      )}

      {tasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500">
          暂无任务。在「今日」页或右上角快速添加一个任务开始。
        </div>
      ) : (
        SECTION_META.map((section) => {
          const items = visible.filter((t) => t.status === section.status);
          return (
            <section key={section.status} className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{section.label}</h2>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
                  {items.length}
                </span>
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 px-1">暂无{section.label}任务。</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((task) => {
                    const due = dueMeta(task);
                    return (
                      <li
                        key={task.id}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow border-l-4 ${section.accent}`}
                      >
                        <div className="flex items-center gap-3 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={task.status === 'done'}
                            onChange={() => cycle(task)}
                            title={task.status === 'done' ? '标记为待办' : '标记为完成'}
                            className="h-4 w-4 text-emerald-600 rounded"
                          />
                          <Link href={`/entities/task/${task.id}`} className="flex-1 min-w-0 group">
                            <span
                              className={`block truncate text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 ${
                                task.status === 'done'
                                  ? 'text-gray-400 dark:text-gray-500 line-through'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {task.title}
                            </span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              {task.priority && task.priority !== 'low' && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_BADGE[task.priority] || ''}`}>
                                  {task.priority === 'high' ? '高优先' : '中优先'}
                                </span>
                              )}
                              {due && (
                                <span className={due.overdue && task.status !== 'done' ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                                  {due.text}
                                </span>
                              )}
                              {task.tags && task.tags.length > 0 && (
                                <span>{task.tags.slice(0, 3).join(' / ')}</span>
                              )}
                            </span>
                          </Link>
                          {section.status !== 'doing' && task.status !== 'done' && (
                            <button
                              onClick={() => setStatus(task, 'doing')}
                              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              开始
                            </button>
                          )}
                          <Link
                            href={`/entities/task/${task.id}/edit`}
                            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            编辑
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
