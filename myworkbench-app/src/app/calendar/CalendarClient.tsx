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
          <ul className="space-y-2">
            {selectedItems.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <Link
                  href={item.href}
                  className="block p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${KIND_BADGE[item.kind] || KIND_BADGE.event}`}>
                    {item.kind_label || item.kind}
                  </span>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">{item.title}</p>
                  {item.diff_days === 0 && <p className="text-xs text-blue-600 dark:text-blue-400">今天</p>}
                  {item.diff_days < 0 && <p className="text-xs text-red-600 dark:text-red-400">已过期</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
