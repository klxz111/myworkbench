'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface ListItem {
  id: string;
  title: string;
  status: string;
  tags?: string[];
  updated_at: string;
}

export type SortKey = 'updated_desc' | 'updated_asc' | 'title_asc' | 'title_desc';

export interface ServerFacets {
  statuses: string[];
  tags: string[];
}

export const DEFAULT_PAGE_SIZE = 50;

/**
 * 分页拉取实体列表：?limit/offset 返回 { items, total, facets }。
 * loadMore 追加下一页；reset() 在外部数据变化（如删除、状态更新）后从头刷新。
 */
export function useEntityListPage<T extends ListItem>(type: string, pageSize: number = DEFAULT_PAGE_SIZE) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<ServerFacets>({ statuses: [], tags: [] });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);
  const totalRef = useRef(0);

  const fetchPage = useCallback(async (offset: number, append: boolean): Promise<boolean> => {
    try {
      const res = await fetch(`/api/entities/${type}?limit=${pageSize}&offset=${offset}`);
      if (!res.ok) return false;
      const data = await res.json();
      const page: T[] = data.items || [];
      setFacets({ statuses: data.facets?.statuses || [], tags: data.facets?.tags || [] });
      totalRef.current = data.total || 0;
      setTotal(data.total || 0);
      offsetRef.current = offset + page.length;
      setItems((prev) => (append ? [...prev, ...page] : page));
      return true;
    } catch (error) {
      console.error(`Error fetching ${type} list:`, error);
      return false;
    }
  }, [type, pageSize]);

  useEffect(() => {
    fetchPage(0, false).finally(() => setLoading(false));
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || offsetRef.current >= totalRef.current) return;
    setLoadingMore(true);
    try {
      await fetchPage(offsetRef.current, true);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, loadingMore]);

  const reset = useCallback(async () => {
    await fetchPage(0, false);
  }, [fetchPage]);

  return {
    items,
    total,
    facets,
    loading,
    loadingMore,
    hasMore: items.length < total,
    loadMore,
    reset,
  };
}

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

export function useListControls<T extends ListItem>(items: T[], serverFacets?: ServerFacets) {
  const [state, setState] = useState<ListControlsState>({ q: '', status: '', tag: '', sort: 'updated_desc' });

  // 优先用服务端 facets（覆盖全量条目，不随分页截断）；未提供时退回从已加载条目推导
  const statuses = useMemo(
    () => serverFacets?.statuses?.length
      ? serverFacets.statuses
      : Array.from(new Set(items.map((i) => i.status).filter(Boolean))).sort(),
    [serverFacets, items]
  );
  const tags = useMemo(
    () => serverFacets?.tags?.length
      ? serverFacets.tags
      : Array.from(new Set(items.flatMap((i) => i.tags || []))).sort(),
    [serverFacets, items]
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
  const selectClass = 'field';

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <input
        type="search"
        value={state.q}
        onChange={(e) => set({ q: e.target.value })}
        placeholder={placeholder || '搜索标题 / 标签...'}
        className="input flex-1 min-w-[180px]"
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
          className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          清除筛选
        </button>
      )}
    </div>
  );
}

/** 列表底部「加载更多」行；hidden 时渲染 null */
export function LoadMoreRow({
  hasMore,
  loading,
  loadedCount,
  total,
  onLoadMore,
}: {
  hasMore: boolean;
  loading: boolean;
  loadedCount: number;
  total: number;
  onLoadMore: () => void;
}) {
  if (!hasMore) {
    if (total > 0) {
      return <p className="py-3 text-center text-xs text-gray-400 dark:text-gray-500">已显示全部 {total} 条。</p>;
    }
    return null;
  }
  return (
    <div className="py-3 text-center">
      <button
        onClick={onLoadMore}
        disabled={loading}
        className="btn-ghost"
      >
        {loading ? '加载中...' : `加载更多（已显示 ${loadedCount} / ${total} 条）`}
      </button>
    </div>
  );
}
