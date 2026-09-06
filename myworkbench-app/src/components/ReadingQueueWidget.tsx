'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * 待读文献队列（首页 widget）：evidence + source_type=paper + tags=paper + status=draft。
 * RSS「文献」/文献笔记产生待读；读完点「已读」→ status=active 归档进证据链。
 */

interface PaperItem {
  id: string;
  title: string;
  source_url?: string;
  date?: string;
}

export function ReadingQueueWidget() {
  const [items, setItems] = useState<PaperItem[] | null>(null);
  const [marking, setMarking] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/entities/evidence?tag=paper&status=draft&limit=20');
      if (res.ok) {
        const data = await res.json();
        setItems((data.items || []) as PaperItem[]);
      }
    } catch {
      /* 保留上次数据 */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (item: PaperItem) => {
    setMarking(item.id);
    try {
      const res = await fetch(`/api/entities/evidence/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { status: 'active' } }),
      });
      if (res.ok) {
        setItems((prev) => (prev ? prev.filter((i) => i.id !== item.id) : prev));
      }
    } finally {
      setMarking(null);
    }
  };

  return (
    <div>
      {items === null ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-1">加载中...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-1">
          队列为空。在 <Link href="/rss" className="text-blue-600 dark:text-blue-400 hover:underline">RSS 订阅</Link> 里点「文献」把想读的论文加进来。
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 py-2">
              <Link
                href={`/evidence/${item.id}`}
                className="flex-1 min-w-0 text-sm text-gray-900 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 truncate"
                title={item.title}
              >
                {item.title}
              </Link>
              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="打开原文"
                  className="shrink-0 px-1.5 py-1 rounded text-xs btn-ghost"
                >
                  原文↗
                </a>
              )}
              <button
                onClick={() => markRead(item)}
                disabled={marking === item.id}
                title="读完归档（status → active，进入证据链）"
                className="shrink-0 px-2 py-1 rounded text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {marking === item.id ? '...' : '已读'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
