'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { TypeBadge } from '@/components/ui';
import { entityHref } from '@/lib/entity-paths';
import { getPins, setPins, PIN_LIMIT, PinnedItem } from '@/lib/prefs';

/**
 * 首页「置顶」widget 内容：常用实体一键置顶。
 * 置顶列表存 localStorage（mwbench_pinned）；搜索复用命令面板同款 /api/search。
 */
interface SearchResult {
  type: string;
  title: string;
  slug: string;
  snippet: string;
}

export function PinnedContent() {
  const [pins, setPinsState] = useState<PinnedItem[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setPinsState(getPins());
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults((data.results || []).slice(0, 6));
        }
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const persist = useCallback((next: PinnedItem[]) => {
    setPinsState(next);
    setPins(next);
  }, []);

  const addPin = (item: SearchResult) => {
    if (pins.some((p) => p.type === item.type && p.id === item.slug)) return;
    persist([...pins, { type: item.type, id: item.slug, title: item.title }].slice(0, PIN_LIMIT));
    setQuery('');
    setResults([]);
  };

  const removePin = (item: PinnedItem) => {
    persist(pins.filter((p) => !(p.type === item.type && p.id === item.id)));
  };

  const pinnedKeys = new Set(pins.map((p) => `${p.type}-${p.id}`));
  const candidates = results.filter((r) => !pinnedKeys.has(`${r.type}-${r.slug}`));

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`搜索实体并置顶（最多 ${PIN_LIMIT} 个）...`}
        className="input text-sm"
      />
      {query.trim() && (
        <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
          {searching && candidates.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">搜索中...</p>
          ) : candidates.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">没有匹配的实体（或已在置顶中）。</p>
          ) : (
            candidates.map((r) => (
              <button
                key={`${r.type}-${r.slug}`}
                onClick={() => addPin(r)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <TypeBadge type={r.type} />
                <span className="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-gray-200">{r.title}</span>
                <span className="shrink-0 text-xs text-blue-600 dark:text-blue-400">置顶 +</span>
              </button>
            ))
          )}
        </div>
      )}

      {pins.length === 0 && !query.trim() ? (
        <p className="mt-3 text-sm text-gray-400 dark:text-gray-500 py-1">
          还没有置顶。在上方搜索策略 / 人脉 / 决策等常用实体，点一下就能钉在这里。
        </p>
      ) : (
        pins.length > 0 && (
          <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-700">
            {pins.map((pin) => (
              <li key={`${pin.type}-${pin.id}`} className="flex items-center gap-2 px-1 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <TypeBadge type={pin.type} />
                <Link
                  href={entityHref(pin.type, pin.id)}
                  className="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {pin.title}
                </Link>
                <button
                  onClick={() => removePin(pin)}
                  title="取消置顶"
                  aria-label={`取消置顶 ${pin.title}`}
                  className="shrink-0 w-6 h-6 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 text-sm leading-none"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
