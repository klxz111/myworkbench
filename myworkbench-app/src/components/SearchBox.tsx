'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface SearchResult {
  type: string;
  title: string;
  slug: string;
  snippet: string;
}

const RECENT_SEARCHES_KEY = 'myworkbench_recent_searches';
const MAX_RECENT_SEARCHES = 8;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  if (typeof window === 'undefined') return;
  const trimmed = query.trim();
  if (!trimmed) return;
  const current = getRecentSearches().filter((item) => item !== trimmed);
  const next = [trimmed, ...current].slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const shortcut = isMac ? event.metaKey : event.ctrlKey;
      if (shortcut && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === '/' && document.activeElement === document.body) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setOpen(true);
          addRecentSearch(trimmed);
          setRecentSearches(getRecentSearches());
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const getEntityUrl = (type: string, slug: string) => {
    return `/${type}/${slug}`;
  };

  const showRecent = !query.trim() && recentSearches.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0 || showRecent) setOpen(true);
        }}
        placeholder="搜索... (Ctrl+K)"
        className="w-48 sm:w-64 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {loading && (
          <div className="absolute right-3 top-2 text-gray-400">
            <span className="text-xs">加载中...</span>
          </div>
      )}
      {open && (results.length > 0 || showRecent) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-auto">
          {showRecent && (
            <>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                最近搜索
              </div>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setQuery(term);
                    setOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 text-sm text-gray-700 dark:text-gray-300"
                >
                  {term}
                </button>
              ))}
            </>
          )}
          {results.map((result, index) => (
            <Link
              key={`${result.type}-${result.slug}-${index}`}
              href={getEntityUrl(result.type, result.slug)}
              className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              onClick={() => {
                setOpen(false);
                setQuery('');
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded uppercase">
                  {result.type}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {result.title}
                </span>
              </div>
              {result.snippet && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {result.snippet}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
