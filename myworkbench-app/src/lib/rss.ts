import Parser from 'rss-parser';
import { fetch as undiciFetch, ProxyAgent } from 'undici';
import { initDb } from './db';

/**
 * RSS 订阅的核心逻辑：抓取、解析、入库。
 * 源与条目存 SQLite（独立于 Markdown 实体的源数据缓存）；
 * 抓取在服务端进行（绕 CORS）；摘要统一存纯文本，前端不渲染原始 HTML。
 *
 * 出网代理：按 MYWORKBENCH_RSS_PROXY → HTTPS_PROXY → HTTP_PROXY → ALL_PROXY 取值，
 * 走 undici ProxyAgent（见 .env.local）；未配置则直连。
 */

const parser = new Parser();

const FEED_FETCH_TIMEOUT_MS = 15000;

let cachedProxyAgent: { key: string; agent: ProxyAgent } | null = null;

function proxyDispatcher(): ProxyAgent | undefined {
  const proxy =
    process.env.MYWORKBENCH_RSS_PROXY ||
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.ALL_PROXY ||
    '';
  if (!proxy) return undefined;
  if (!cachedProxyAgent || cachedProxyAgent.key !== proxy) {
    cachedProxyAgent = { key: proxy, agent: new ProxyAgent(proxy) };
  }
  return cachedProxyAgent.agent;
}

/** 拉取 feed 原始 XML（代理感知 + 超时），交给 rss-parser 解析 */
async function fetchXml(url: string): Promise<string> {
  const res = await undiciFetch(url, {
    dispatcher: proxyDispatcher(),
    signal: AbortSignal.timeout(FEED_FETCH_TIMEOUT_MS),
    headers: { 'User-Agent': 'myworkbench-rss/1.0 (+local personal workbench)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** 每个源最多保留的条目数（超出删最旧） */
export const ENTRY_KEEP_LIMIT = 300;
/** 惰性刷新 TTL（分钟）：超过该时长未抓取的源由前端触发 refresh */
export const STALE_TTL_MINUTES = 30;

/** 订阅源分类（AI / 金融量化 / 投资；空串=未分类） */
export const RSS_CATEGORIES = [
  { key: 'ai', label: 'AI' },
  { key: 'quant', label: '金融量化' },
  { key: 'invest', label: '投资' },
] as const;

export type RssCategoryKey = (typeof RSS_CATEGORIES)[number]['key'];

export function isValidCategory(category: string): boolean {
  return category === '' || RSS_CATEGORIES.some((c) => c.key === category);
}

export function categoryLabel(category: string): string {
  return RSS_CATEGORIES.find((c) => c.key === category)?.label || '未分类';
}

export interface FeedRow {
  id: number;
  title: string;
  url: string;
  site_url: string | null;
  description: string | null;
  category: string;
  created_at: string;
  last_fetched_at: string | null;
  last_error: string | null;
  unread?: number;
}

export interface FetchResult {
  id: number;
  ok: boolean;
  added: number;
  error?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

export function isValidFeedUrl(url: string): boolean {
  return /^https?:\/\/.+/i.test(url);
}

/** 全部订阅源（含各自未读数） */
export function listFeeds(): FeedRow[] {
  const db = initDb();
  return db
    .prepare(
      `SELECT f.*, (SELECT COUNT(*) FROM rss_entries e WHERE e.feed_id = f.id AND e.read = 0) AS unread
       FROM rss_feeds f ORDER BY f.created_at ASC, f.id ASC`
    )
    .all() as FeedRow[];
}

/** 超过 TTL 未抓取的源（前端据此触发后台刷新） */
export function getStaleFeedIds(): number[] {
  const db = initDb();
  const rows = db
    .prepare(
      `SELECT id FROM rss_feeds
       WHERE last_fetched_at IS NULL OR last_fetched_at < datetime('now', ?)`
    )
    .all(`-${STALE_TTL_MINUTES} minutes`) as { id: number }[];
  return rows.map((r) => r.id);
}

/**
 * 抓取单个源并入库（UPSERT 保留已读状态），返回新增条数。
 * 失败时把错误写进 last_error（last_fetched_at 同样更新，避免每次列表加载都重试死源）。
 */
export async function fetchFeed(feed: { id: number; url: string; title: string }): Promise<FetchResult> {
  const db = initDb();
  try {
    const parsed = await parser.parseString(await fetchXml(feed.url));
    const title = parsed.title?.trim() || feed.title;
    const siteUrl = typeof parsed.link === 'string' ? parsed.link : null;
    const description = parsed.description ? stripHtml(parsed.description) : null;

    const upsert = db.prepare(
      `INSERT INTO rss_entries (feed_id, guid, title, link, author, published_at, summary)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(feed_id, guid) DO UPDATE SET
         title = excluded.title,
         link = excluded.link,
         author = excluded.author,
         published_at = excluded.published_at,
         summary = excluded.summary,
         fetched_at = datetime('now')`
    );
    const trim = db.prepare(
      `DELETE FROM rss_entries WHERE feed_id = ? AND id NOT IN (
         SELECT id FROM rss_entries WHERE feed_id = ?
         ORDER BY COALESCE(published_at, fetched_at) DESC LIMIT ?)`
    );
    const touch = db.prepare(
      `UPDATE rss_feeds SET title = ?, site_url = ?, description = ?, last_fetched_at = datetime('now'), last_error = NULL WHERE id = ?`
    );
    const countBefore = db.prepare('SELECT COUNT(*) AS c FROM rss_entries WHERE feed_id = ?').get(feed.id) as { c: number };

    let added = 0;
    const run = db.transaction(() => {
      for (const item of parsed.items || []) {
        const guid = item.guid || item.link || `${item.title || ''}|${item.isoDate || item.pubDate || ''}`;
        if (!guid || !item.title) continue;
        upsert.run(
          feed.id,
          guid,
          item.title.trim(),
          item.link || null,
          (item as { creator?: string }).creator || null,
          item.isoDate || item.pubDate || null,
          item.contentSnippet ? stripHtml(item.contentSnippet) : null
        );
      }
      trim.run(feed.id, feed.id, ENTRY_KEEP_LIMIT);
      touch.run(title, siteUrl, description, feed.id);
    });
    run();

    const countAfter = db.prepare('SELECT COUNT(*) AS c FROM rss_entries WHERE feed_id = ?').get(feed.id) as { c: number };
    added = Math.max(0, countAfter.c - countBefore.c);
    return { id: feed.id, ok: true, added };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    db.prepare(`UPDATE rss_feeds SET last_fetched_at = datetime('now'), last_error = ? WHERE id = ?`).run(
      message.slice(0, 300),
      feed.id
    );
    return { id: feed.id, ok: false, added: 0, error: message.slice(0, 200) };
  }
}

/** 添加订阅：先首抓校验，成功才入库（失败返回错误，不留半截记录） */
export async function addFeed(
  rawUrl: string,
  category = ''
): Promise<{ ok: true; feed: FeedRow } | { ok: false; error: string }> {
  const url = rawUrl.trim();
  if (!isValidFeedUrl(url)) return { ok: false, error: '请填写 http(s):// 开头的 RSS/Atom 地址' };
  if (!isValidCategory(category)) return { ok: false, error: '无效的分类' };

  const db = initDb();
  const existing = db.prepare('SELECT id FROM rss_feeds WHERE url = ?').get(url);
  if (existing) return { ok: false, error: '该订阅源已存在' };

  try {
    const parsed = await parser.parseString(await fetchXml(url));
    if (!parsed.title && (!parsed.items || parsed.items.length === 0)) {
      return { ok: false, error: '该地址不是有效的 RSS/Atom 源（没有解析到条目）' };
    }
    const info = db
      .prepare(
        `INSERT INTO rss_feeds (title, url, site_url, description, category, last_fetched_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`
      )
      .run(
        parsed.title?.trim() || url,
        url,
        typeof parsed.link === 'string' ? parsed.link : null,
        parsed.description ? stripHtml(parsed.description) : null,
        category
      );
    const feedId = Number(info.lastInsertRowid);

    const upsert = db.prepare(
      `INSERT OR IGNORE INTO rss_entries (feed_id, guid, title, link, author, published_at, summary)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const insertAll = db.transaction(() => {
      for (const item of parsed.items || []) {
        const guid = item.guid || item.link || `${item.title || ''}|${item.isoDate || item.pubDate || ''}`;
        if (!guid || !item.title) continue;
        upsert.run(
          feedId,
          guid,
          item.title.trim(),
          item.link || null,
          (item as { creator?: string }).creator || null,
          item.isoDate || item.pubDate || null,
          item.contentSnippet ? stripHtml(item.contentSnippet) : null
        );
      }
      db.prepare(`DELETE FROM rss_entries WHERE feed_id = ? AND id NOT IN (
         SELECT id FROM rss_entries WHERE feed_id = ?
         ORDER BY COALESCE(published_at, fetched_at) DESC LIMIT ?)`).run(feedId, feedId, ENTRY_KEEP_LIMIT);
    });
    insertAll();

    const feed = db.prepare('SELECT * FROM rss_feeds WHERE id = ?').get(feedId) as FeedRow;
    return { ok: true, feed };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `抓取失败：${message.slice(0, 200)}` };
  }
}

/** 删除订阅（外键 CASCADE 连带删条目；显式再删一次兜底 pragma 差异） */
export function removeFeed(id: number): void {
  const db = initDb();
  const del = db.transaction(() => {
    db.prepare('DELETE FROM rss_entries WHERE feed_id = ?').run(id);
    db.prepare('DELETE FROM rss_feeds WHERE id = ?').run(id);
  });
  del();
}

/** 修改订阅分类（源与条目均不变） */
export function setFeedCategory(id: number, category: string): boolean {
  if (!isValidCategory(category)) return false;
  const db = initDb();
  const info = db.prepare(`UPDATE rss_feeds SET category = ? WHERE id = ?`).run(category, id);
  return info.changes > 0;
}

/** 逐个刷新给定源（串行，避免并发抓取打满带宽） */
export async function refreshFeeds(feedIds?: number[]): Promise<FetchResult[]> {
  const db = initDb();
  const feeds = (
    feedIds && feedIds.length > 0
      ? db.prepare(`SELECT id, url, title FROM rss_feeds WHERE id IN (${feedIds.map(() => '?').join(',')})`).all(...feedIds)
      : db.prepare('SELECT id, url, title FROM rss_feeds').all()
  ) as { id: number; url: string; title: string }[];

  const results: FetchResult[] = [];
  for (const feed of feeds) {
    results.push(await fetchFeed(feed));
  }
  return results;
}
