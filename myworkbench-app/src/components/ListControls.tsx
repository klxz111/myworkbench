'use client';

import { useMemo, useState } from 'react';

export interface ListItem {
  id: string;
  title: string;
  status: string;
  tags?: string[];
  updated_at: string;
}

export type SortKey = 'updated_desc' | 'updated_asc' | 'title_asc' | 'title_desc';

interface ListControlsState {
  q: string;
  status: string;
  tag: string;
  sort: SortKey;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'updated_desc', label: '最近更新优先' },
  { value: 'updated_asc', label: '最早更新优先' },
  { value: 'title_asc', label: '标题 A→Z' },
  { value: 'title_desc', label: '标题 Z→A' },
];

export function useListControls<T extends ListItem>(items: T[]) {
  const [state, setState] = useState<ListControlsState>({ q: '', status: '', tag: '', sort: 'updated_desc' });

  const statuses = useMemo(
    () => Array.from(new Set(items.map((i) => i.status).filter(Boolean))).sort(),
    [items]
  );
  const tags = useMemo(
    () => Array.from(new Set(items.flatMap((i) => i.tags || []))).sort(),
    [items]
  );

  const filtered = useMemo(() => {
    const q = state.q.trim().toLowerCase();
    const result = items.filter((item) => {
      if (state.status && item.status !== state.status) return false;
      if (state.tag && !(item.tags || []).includes(state.tag)) return false;
      if (q) {
        const haystack = `${item.title} ${(item.tags || []).join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    const sorted = [...result];
    switch (state.sort) {
      case 'updated_asc':
        sorted.sort((a, b) => a.updated_at.localeCompare(b.updated_at));
        break;
      case 'title_asc':
        sorted.sort((a, b) => String(a.title).localeCompare(String(b.title)));
        break;
      case 'title_desc':
        sorted.sort((a, b) => String(b.title).localeCompare(String(a.title)));
        break;
      default:
        sorted.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
    }
    return sorted;
  }, [items, state]);

  const set = (patch: Partial<ListControlsState>) => setState((prev) => ({ ...prev, ...patch }));

  const hasActiveFilter = !!(state.q.trim() || state.status || state.tag);

  return {
    items: filtered,
    total: items.length,
    hasActiveFilter,
    toolbar: {
      state,
      set,
      statuses,
      tags,
      hasActiveFilter,
    },
  };
}

interface ListToolbarProps {
  state: ListControlsState;
  set: (patch: Partial<ListControlsState>) => void;
  statuses: string[];
  tags: string[];
  hasActiveFilter: boolean;
  placeholder?: string;
}

export function ListToolbar({ state, set, statuses, tags, hasActiveFilter, placeholder }: ListToolbarProps) {
  const selectClass =
    'px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <input
        type="search"
        value={state.q}
        onChange={(e) => set({ q: e.target.value })}
        placeholder={placeholder || '搜索标题 / 标签...'}
        className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {statuses.length > 0 && (
        <select
          value={state.status}
          onChange={(e) => set({ status: e.target.value })}
          className={selectClass}
          aria-label="按状态过滤"
        >
          <option value="">全部状态</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}
      {tags.length > 0 && (
        <select
          value={state.tag}
          onChange={(e) => set({ tag: e.target.value })}
          className={selectClass}
          aria-label="按标签过滤"
        >
          <option value="">全部标签</option>
          {tags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )}
      <select
        value={state.sort}
        onChange={(e) => set({ sort: e.target.value as SortKey })}
        className={selectClass}
        aria-label="排序"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hasActiveFilter && (
        <button
          onClick={() => set({ q: '', status: '', tag: '' })}
          className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          清除筛选
        </button>
      )}
    </div>
  );
}
