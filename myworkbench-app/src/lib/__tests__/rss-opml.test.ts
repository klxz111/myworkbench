import { describe, it, expect } from 'vitest';
import { exportOpml, importOpml } from '../rss';
import { initDb, getDb } from '../db';

describe('rss opml', () => {
  it('exportOpml 产出合法 XML 且含已存在的 feed', () => {
    const db = initDb();
    db.prepare(`INSERT INTO rss_feeds (title, url, site_url, description, category, last_fetched_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`).run(
      'Test Feed',
      'https://example.com/feed.xml',
      'https://example.com',
      'desc',
      'ai'
    );

    const xml = exportOpml();
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('<opml version="2.0">');
    expect(xml).toContain('Test Feed');
    expect(xml).toContain('https://example.com/feed.xml');
    expect(xml).toContain('AI');
  });

  it('importOpml 能解析并入库，且跳过重复', () => {
    const db = getDb();
    db.prepare('DELETE FROM rss_feeds').run();

    const sample = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline text="AI" title="AI">
      <outline text="Feed A" title="Feed A" type="rss" xmlUrl="https://a.com/feed.xml" />
      <outline text="Feed B" title="Feed B" type="rss" xmlUrl="https://b.com/feed.xml" />
    </outline>
  </body>
</opml>`;

    const result = importOpml(sample);
    expect(result.added).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(0);

    const feeds = db.prepare('SELECT url FROM rss_feeds').all() as { url: string }[];
    expect(feeds.map((f) => f.url).sort()).toEqual(['https://a.com/feed.xml', 'https://b.com/feed.xml']);

    const result2 = importOpml(sample);
    expect(result2.added).toBe(0);
    expect(result2.skipped).toBe(2);
  });

  it('importOpml 处理空内容与非法 URL', () => {
    const db = getDb();
    db.prepare('DELETE FROM rss_feeds').run();

    const result = importOpml('not xml');
    expect(result.added).toBe(0);
    expect(result.errors).toHaveLength(0);

    const result2 = importOpml('<opml><body><outline xmlUrl="ftp://bad" /></body></opml>');
    expect(result2.added).toBe(0);
  });
});
