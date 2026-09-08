import { NextRequest, NextResponse } from 'next/server';
import { fetch as undiciFetch } from 'undici';

export const runtime = 'nodejs';

const RSS_DISCOVERY_SELECTORS = [
  /<link[^>]+type=["']application\/rss\+xml["'][^>]*>/i,
  /<link[^>]+type=["']application\/atom\+xml["'][^>]*>/i,
  /<link[^>]+type=["']application\/json["'][^>]*>/i,
  /<a[^>]+href=["']([^"']*rss[^"']*)["'][^>]*>/i,
  /<a[^>]+href=["']([^"']*feed[^"']*)["'][^>]*>/i,
  /<a[^>]+href=["']([^"']*atom[^"']*)["'][^>]*>/i,
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: '请提供有效的 http(s) 地址' }, { status: 400 });
    }

    const proxy =
      process.env.MYWORKBENCH_RSS_PROXY ||
      process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy ||
      process.env.ALL_PROXY ||
      '';

    const dispatcher = proxy ? new (await import('undici')).ProxyAgent(proxy) : undefined;

    const res = await undiciFetch(url, {
      dispatcher,
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'myworkbench-rss/1.0 (+local personal workbench)' },
      redirect: 'follow',
    });

    if (!res.ok) {
      return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 400 });
    }

    const html = await res.text();
    const feeds: { url: string; type: string; title: string }[] = [];
    const seen = new Set<string>();

    for (const selector of RSS_DISCOVERY_SELECTORS) {
      let match: RegExpExecArray | null;
      while ((match = selector.exec(html)) !== null) {
        let href = '';
        if (match[0].includes('href=')) {
          href = match[0].match(/href=["']([^"']+)["']/i)?.[1] || '';
        }
        
        if (href && !seen.has(href)) {
          seen.add(href);
          const type = match[0].match(/type=["']([^"']+)["']/i)?.[1] || 'unknown';
          const title = match[0].match(/title=["']([^"']+)["']/i)?.[1] || href;
          
          if (/xml|rss|atom|feed/i.test(type + href + title)) {
            feeds.push({ url: resolveUrl(url, href), type, title });
          }
        }
      }
    }

    return NextResponse.json({ feeds });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `发现失败：${message.slice(0, 200)}` }, { status: 500 });
  }
}

function resolveUrl(base: string, href: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}
