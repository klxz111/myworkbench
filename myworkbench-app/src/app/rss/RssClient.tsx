'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, EmptyState } from '@/components/ui';

/**
 * RSS 订阅：左列订阅源（未读徽章/错误标记/删除），右列条目（未读点/外链/摘要/存为证据）。
 * 数据存 SQLite（rss_feeds/rss_entries，服务端抓取）；打开页面时后台惰性刷新超过 TTL 的源。
 * 「存为证据」直接复用 POST /api/entities/evidence（source_type=news、source_url=原文链接）。
 */

interface Feed {
  id: number;
  title: string;
  url: string;
  site_url: string | null;
  description: string | null;
  category: string;
  last_fetched_at: string | null;
  last_error: string | null;
  unread: number;
}

interface Entry {
  id: number;
  feed_id: number;
  title: string;
  link: string | null;
  author: string | null;
  published_at: string | null;
  summary: string | null;
  read: number;
  feed_title: string;
}

const CATEGORIES = [
  { key: 'ai', label: 'AI' },
  { key: 'quant', label: '金融量化' },
  { key: 'invest', label: '投资' },
];

function categoryLabel(category: string): string {
  return CATEGORIES.find((c) => c.key === category)?.label || '未分类';
}

/** 分类徽章循环切换顺序：ai → quant → invest → 未分类 → ai */
function nextCategory(category: string): string {
  const keys = [...CATEGORIES.map((c) => c.key), ''];
  return keys[(keys.indexOf(category) + 1) % keys.length];
}

const PAGE_SIZE = 50;

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays <= 0 && now.getDate() === d.getDate()) return '今天';
  if (diffDays === 1) return '昨天';
  return d.toLocaleDateString('zh-CN');
}

export function RssClient() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedFeed, setSelectedFeed] = useState<number | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [catFilter, setCatFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadFeeds = useCallback(async () => {
    try {
      const res = await fetch('/api/rss/feeds');
      if (res.ok) {
        const data = await res.json();
        setFeeds(data.feeds || []);
        return (data.stale_feed_ids || []) as number[];
      }
    } catch {
      /* 忽略，保留上次数据 */
    }
    return [];
  }, []);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (selectedFeed !== null) params.set('feedId', String(selectedFeed));
      if (selectedFeed === null && catFilter) params.set('category', catFilter);
      if (unreadOnly) params.set('unread', '1');
      const res = await fetch(`/api/rss/entries?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.items || []);
        setTotal(data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedFeed, unreadOnly, catFilter]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // 首次加载：拉源列表；有超过 TTL 的源则后台刷新再回填
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const staleIds = await loadFeeds();
      if (cancelled || staleIds.length === 0) return;
      try {
        await fetch('/api/rss/refresh', { method: 'POST' });
      } catch {
        return;
      }
      if (!cancelled) {
        await loadFeeds();
        await loadEntries();
      }
    })();
    return () => {
      cancelled = true;
    };
    // 仅首挂载执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flash = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2500);
  };

  const handleAdd = async () => {
    const url = newUrl.trim();
    if (!url) return;
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch('/api/rss/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, category: newCategory }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '添加失败');
      }
      setNewUrl('');
      setNewCategory('');
      setAddFormOpen(false);
      await loadFeeds();
      await loadEntries();
      flash('订阅添加成功 ✓');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '添加失败');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (feed: Feed) => {
    if (!window.confirm(`取消订阅「${feed.title}」？其全部条目将一并删除。`)) return;
    try {
      await fetch(`/api/rss/feeds/${feed.id}`, { method: 'DELETE' });
      if (selectedFeed === feed.id) setSelectedFeed(null);
      await loadFeeds();
      await loadEntries();
    } catch {
      alert('删除订阅失败');
    }
  };

  const cycleCategory = async (feed: Feed) => {
    const next = nextCategory(feed.category);
    // 乐观更新，失败回滚
    const prev = feed.category;
    setFeeds((fs) => fs.map((f) => (f.id === feed.id ? { ...f, category: next } : f)));
    try {
      const res = await fetch(`/api/rss/feeds/${feed.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setFeeds((fs) => fs.map((f) => (f.id === feed.id ? { ...f, category: prev } : f)));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/rss/refresh', { method: 'POST' });
      await loadFeeds();
      await loadEntries();
      flash('刷新完成 ✓');
    } finally {
      setRefreshing(false);
    }
  };

  const applyRead = (entryId: number, read: boolean) => {
    setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, read: read ? 1 : 0 } : e)));
    setFeeds((prev) =>
      prev.map((f) => {
        const entry = entries.find((e) => e.id === entryId);
        if (!entry || f.id !== entry.feed_id) return f;
        const delta = read === (entry.read === 1) ? 0 : read ? -1 : 1;
        return { ...f, unread: Math.max(0, f.unread + delta) };
      })
    );
  };

  const toggleRead = async (entry: Entry) => {
    const next = !(entry.read === 1);
    applyRead(entry.id, next);
    try {
      await fetch(`/api/rss/entries/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: next }),
      });
    } catch {
      applyRead(entry.id, !next);
    }
  };

  const saveAsEvidence = async (entry: Entry) => {
    setSavingId(entry.id);
    try {
      const slug = `evidence-${Date.now().toString(36)}`;
      const res = await fetch('/api/entities/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          data: {
            id: slug,
            type: 'evidence',
            title: entry.title,
            status: 'active',
            tags: ['rss'],
            source_type: 'news',
            source_url: entry.link || '',
            date: entry.published_at ? entry.published_at.slice(0, 10) : '',
            summary: entry.summary || '',
          },
          content: '',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '保存失败');
      }
      if (!(entry.read === 1)) {
        applyRead(entry.id, true);
        try {
          await fetch(`/api/rss/entries/${entry.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read: true }),
          });
        } catch {
          /* 已读失败不阻塞 */
        }
      }
      flash('已存为证据（标签 rss）✓');
    } catch (err) {
      alert(err instanceof Error ? err.message : '存为证据失败');
    } finally {
      setSavingId(null);
    }
  };

  const totalUnread = feeds.reduce((sum, f) => sum + f.unread, 0);
  const selectedFeedTitle = selectedFeed !== null ? feeds.find((f) => f.id === selectedFeed)?.title : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="RSS 订阅"
        description="信号源聚合在这里；值得留证的条目一键存入证据链"
        actions={
          <>
            <button onClick={handleRefresh} disabled={refreshing} className="btn-secondary">
              {refreshing ? '刷新中...' : '立即刷新'}
            </button>
            <button onClick={() => setAddFormOpen(!addFormOpen)} className="btn-primary">
              添加订阅
            </button>
          </>
        }
      />

      {toast && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {toast}
        </div>
      )}

      {addFormOpen && (
        <div className="card p-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !adding && handleAdd()}
              placeholder="粘贴 RSS / Atom 地址，例如 http://rss.arxiv.org/rss/cs.LG"
              className="input flex-1 min-w-[220px]"
            />
            <select className="field w-auto" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
              <option value="">未分类</option>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <button onClick={handleAdd} disabled={adding || !newUrl.trim()} className="btn-primary shrink-0">
              {adding ? '抓取中...' : '订阅'}
            </button>
          </div>
          {addError && <p className="text-xs text-red-600">{addError}</p>}
          <p className="text-xs text-gray-400 dark:text-gray-500">
            添加时会立即抓取一次校验；内容抓取在服务端进行，本机需能访问该地址。
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左列：订阅源 */}
        <div className="lg:col-span-1 space-y-6">
          <section className="card p-5">
            <h2 className="section-title mb-3">订阅源</h2>
            {feeds.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-1">
                还没有订阅。点右上角「添加订阅」粘贴 RSS 地址。
              </p>
            ) : (
              <div className="space-y-4">
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                  <li>
                    <button
                      onClick={() => setSelectedFeed(null)}
                      className={`w-full flex items-center gap-2 px-1 py-2 rounded text-sm text-left transition-colors ${
                        selectedFeed === null
                          ? 'text-blue-700 dark:text-blue-300 font-medium'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <span className="flex-1">全部</span>
                      {totalUnread > 0 && (
                        <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          {totalUnread}
                        </span>
                      )}
                    </button>
                  </li>
                </ul>
                {[...CATEGORIES.map((c) => ({ key: c.key as string, label: c.label })), { key: '', label: '未分类' }].map(
                  (group) => {
                    const groupFeeds = feeds.filter((f) => (f.category || '') === group.key);
                    if (groupFeeds.length === 0) return null;
                    return (
                      <div key={group.key || 'none'}>
                        <p className="px-1 mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          {group.label}
                        </p>
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                          {groupFeeds.map((feed) => (
                            <li key={feed.id} className="flex items-center gap-1">
                              <button
                                onClick={() => setSelectedFeed(feed.id)}
                                className={`flex-1 min-w-0 flex items-center gap-2 px-1 py-2 rounded text-sm text-left transition-colors ${
                                  selectedFeed === feed.id
                                    ? 'text-blue-700 dark:text-blue-300 font-medium'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                                title={feed.last_error ? `上次抓取出错：${feed.last_error}` : feed.url}
                              >
                                <span className="flex-1 min-w-0 truncate">{feed.title}</span>
                                {feed.last_error && (
                                  <span
                                    className="shrink-0 h-1.5 w-1.5 rounded-full bg-red-500"
                                    title={`抓取出错：${feed.last_error}`}
                                  />
                                )}
                                {feed.unread > 0 && (
                                  <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                    {feed.unread}
                                  </span>
                                )}
                              </button>
                              <button
                                onClick={() => cycleCategory(feed)}
                                title="点击切换分类"
                                className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/40 dark:hover:text-blue-300"
                              >
                                {categoryLabel(feed.category)}
                              </button>
                              <button
                                onClick={() => handleDelete(feed)}
                                title="取消订阅"
                                aria-label={`取消订阅 ${feed.title}`}
                                className="shrink-0 w-6 h-6 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 text-sm leading-none"
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </div>

        {/* 右列：条目列表 */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 card p-1">
              {[
                { key: false, label: '全部' },
                { key: true, label: '未读' },
              ].map((opt) => (
                <button
                  key={String(opt.key)}
                  onClick={() => setUnreadOnly(opt.key)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    unreadOnly === opt.key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {selectedFeed === null && (
              <div className="flex items-center gap-2 card p-1">
                {[{ key: '', label: '全部分类' }, ...CATEGORIES].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setCatFilter(opt.key)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      catFilter === opt.key
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {selectedFeedTitle ? `${selectedFeedTitle} · ` : ''}
              {loading ? '加载中...' : `${total} 条${unreadOnly ? '未读' : ''}`}
            </span>
          </div>

          <div className="card">
            {feeds.length === 0 ? (
              <EmptyState text="还没有订阅源。添加一个 RSS 地址开始使用。">
                <p className="mt-1 text-xs text-gray-400">
                  例如：arXiv 分类源 <code>http://rss.arxiv.org/rss/cs.LG</code>
                </p>
              </EmptyState>
            ) : loading ? (
              <p className="p-6 text-sm text-gray-400">加载条目中...</p>
            ) : entries.length === 0 ? (
              <EmptyState
                text={
                  unreadOnly
                    ? '没有未读条目，追上了。'
                    : selectedFeed !== null
                    ? '该源暂无条目，点「立即刷新」试试。'
                    : '暂无条目，点「立即刷新」试试。'
                }
              />
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {entries.map((entry) => {
                  const isRead = entry.read === 1;
                  return (
                    <li key={entry.id} className={`p-4 transition-colors ${isRead ? 'opacity-60' : ''}`}>
                      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                        {!isRead && <span className="mt-2 shrink-0 h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />}
                        <div className="min-w-[200px] flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-400 dark:text-gray-500">
                            <span className="max-w-full truncate">{entry.feed_title}</span>
                            {entry.published_at && <span>· {formatDate(entry.published_at)}</span>}
                            {entry.author && <span className="max-w-full truncate">· {entry.author}</span>}
                          </div>
                          {entry.link ? (
                            <a
                              href={entry.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`mt-0.5 block text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 ${
                                isRead ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {entry.title}
                            </a>
                          ) : (
                            <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">{entry.title}</p>
                          )}
                          {entry.summary && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{entry.summary}</p>
                          )}
                        </div>
                        <div className="ml-auto flex items-center gap-1">
                          <button
                            onClick={() => toggleRead(entry)}
                            className="px-2 py-1 rounded text-xs btn-ghost whitespace-nowrap"
                          >
                            {isRead ? '标为未读' : '标为已读'}
                          </button>
                          <button
                            onClick={() => saveAsEvidence(entry)}
                            disabled={savingId === entry.id}
                            title="把这条存进证据链（evidence，标签 rss）"
                            className="px-2 py-1 rounded text-xs btn-ghost whitespace-nowrap disabled:opacity-50"
                          >
                            {savingId === entry.id ? '保存中...' : '存为证据'}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {total > entries.length && entries.length > 0 && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              只显示最新 {entries.length} 条（共 {total} 条）。
            </p>
          )}

          <p className="px-1 text-xs text-gray-400 dark:text-gray-500">
            订阅数据是网络缓存：存在本地数据库，不进入 Markdown 库与导出包；打开本页会自动刷新超过 30 分钟没更新的源。已存为证据的条目可在{' '}
            <Link href="/evidence" className="text-blue-600 dark:text-blue-400 hover:underline">
              证据
            </Link>{' '}
            页找到（标签 rss）。
          </p>
        </div>
      </div>
    </div>
  );
}
