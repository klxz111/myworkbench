'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface CalendarItem {
  id: string;
  title: string;
  kind: string;
  kind_label?: string;
  date: string;
  day: number;
  diff_days: number;
  href: string;
  task_status?: string;
  notes?: string;
}

/** kind → 编辑路由前缀（与详情路由不同：person/opportunity/task 的编辑都在 /entities 下） */
const KIND_EDIT_PREFIX: Record<string, string> = {
  task: '/entities/task',
  gate: '/decisions',
  followup: '/entities/person',
  deadline: '/entities/opportunity',
  event: '/events',
};

function editHrefFor(item: CalendarItem): string {
  return `${KIND_EDIT_PREFIX[item.kind] || '/entities'}/${item.id}/edit`;
}

const KIND_DOT: Record<string, string> = {
  task: 'bg-blue-500',
  gate: 'bg-emerald-500',
  followup: 'bg-purple-500',
  deadline: 'bg-amber-500',
  event: 'bg-gray-400',
};

const KIND_BADGE: Record<string, string> = {
  task: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  gate: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  followup: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  deadline: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  event: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

function buildMonthGrid(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  // 周一为一周起点
  let lead = first.getDay() - 1;
  if (lead < 0) lead = 6;
  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export function CalendarClient() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [items, setItems] = useState<CalendarItem[] | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [quickTitle, setQuickTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  const load = useCallback(async (y: number, m: number) => {
    setItems(null);
    try {
      const res = await fetch(`/api/calendar?year=${y}&month=${m}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } catch (error) {
      console.error('Error fetching calendar:', error);
    }
  }, []);

  useEffect(() => {
    load(year, month);
  }, [load, year, month]);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  const move = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setYear(y);
    setMonth(m);
    setSelectedDay(null);
  };

  const itemsByDay = useMemo(() => {
    const map = new Map<number, CalendarItem[]>();
    for (const item of items || []) {
      const list = map.get(item.day) || [];
      list.push(item);
      map.set(item.day, list);
    }
    return map;
  }, [items]);

  const selectedItems = selectedDay ? itemsByDay.get(selectedDay) || [] : [];

  /** 就地完成任务（复用任务实体的 status 字段） */
  const completeTask = async (id: string) => {
    setCompleting(id);
    try {
      const res = await fetch(`/api/entities/task/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { status: 'done' } }),
      });
      if (!res.ok) throw new Error('更新失败');
      await load(year, month);
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setCompleting(null);
    }
  };

  /** 把任务安排到选中日期（复用 /today 快速添加的任务创建） */
  const addTaskToDay = async () => {
    const title = quickTitle.trim();
    if (!title || selectedDay === null) return;
    setAdding(true);
    setAddError(null);
    try {
      const slug = `task-${Date.now().toString(36)}`;
      const due = `${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      const res = await fetch('/api/entities/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          data: { id: slug, type: 'task', title, status: 'todo', due_date: due },
          content: '',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '创建失败');
      }
      setQuickTitle('');
      await load(year, month);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '添加失败');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 月历 */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => move(-1)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            ‹ 上月
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {year} 年 {month} 月
            </h2>
            {!isCurrentMonth && (
              <button
                onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1); }}
                className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                回到本月
              </button>
            )}
          </div>
          <button
            onClick={() => move(1)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            下月 ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-xs font-medium text-gray-400 py-1">{w}</div>
          ))}
        </div>

        <div className="space-y-1">
          {grid.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7 gap-1">
              {row.map((day, ci) => {
                if (day === null) return <div key={ci} className="min-h-[64px] rounded bg-gray-50/50 dark:bg-gray-900/30" />;
                const dayItems = itemsByDay.get(day) || [];
                const isToday = isCurrentMonth && day === today.getDate();
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={ci}
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-[64px] p-1 rounded border text-left transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        {day}
                      </span>
                      {isToday && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-0.5">
                      {dayItems.slice(0, 4).map((item) => (
                        <span key={`${item.kind}-${item.id}`} className={`h-1.5 w-1.5 rounded-full ${KIND_DOT[item.kind] || KIND_DOT.event}`} title={item.title} />
                      ))}
                      {dayItems.length > 4 && (
                        <span className="text-[9px] text-gray-400">+{dayItems.length - 4}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
          {Object.entries(KIND_DOT).map(([kind, dot]) => (
            <span key={kind} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${dot}`} />
              {{ task: '任务', gate: '门控审核', followup: '人脉跟进', deadline: '机会截止', event: '事件' }[kind]}
            </span>
          ))}
        </div>
      </div>

      {/* 选中日详情 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 self-start">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          {selectedDay ? `${month} 月 ${selectedDay} 日` : '选择一个日期'}
        </h3>
        {selectedItems.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">这一天没有安排。</p>
        ) : (
          <ul className="space-y-3">
            {selectedItems.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="p-2 rounded border border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between gap-2">
                  <Link href={item.href} className="flex-1 min-w-0">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${KIND_BADGE[item.kind] || KIND_BADGE.event}`}>
                      {item.kind_label || item.kind}
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">{item.title}</p>
                    {item.notes && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2" title="任务备注">
                        备注：{item.notes}
                      </p>
                    )}
                    {item.diff_days === 0 && <p className="text-xs text-blue-600 dark:text-blue-400">今天</p>}
                    {item.diff_days < 0 && <p className="text-xs text-red-600 dark:text-red-400">已过期</p>}
                  </Link>
                  <div className="flex shrink-0 flex-col gap-1">
                    {item.kind === 'task' && (
                      <button
                        onClick={() => completeTask(item.id)}
                        disabled={completing === item.id}
                        title="标记为完成"
                        className="px-2 py-1 rounded text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {completing === item.id ? '...' : '✓ 完成'}
                      </button>
                    )}
                    <Link
                      href={editHrefFor(item)}
                      title="打开编辑页"
                      className="px-2 py-1 rounded text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-center"
                    >
                      编辑
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* 把任务安排到选中日期（复用任务实体与 /today 的快速添加模式） */}
        {selectedDay !== null && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !adding && addTaskToDay()}
                placeholder={`添加任务到 ${month} 月 ${selectedDay} 日，回车确认...`}
                className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addTaskToDay}
                disabled={adding || !quickTitle.trim()}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm shrink-0"
              >
                {adding ? '添加中...' : '添加'}
              </button>
            </div>
            {addError && <p className="mt-1.5 text-xs text-red-600">{addError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
