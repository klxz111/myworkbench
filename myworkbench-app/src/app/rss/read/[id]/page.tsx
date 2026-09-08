import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { buildPaperNote } from '@/lib/paper-note';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  // 标题会在客户端加载后更新
  return {
    title: 'RSS 阅读',
  };
}

export default async function RssReadPage({ params }: PageProps) {
  const { id } = await params;
  const entryId = Number(id);

  if (!Number.isInteger(entryId) || entryId <= 0) {
    notFound();
  }

  let entry: {
    id: number;
    feed_id: number;
    guid: string;
    title: string;
    link: string | null;
    author: string | null;
    published_at: string | null;
    summary: string | null;
    content: string | null;
    read: number;
    feed_title: string;
  } | null = null;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://127.0.0.1:3000';
    const res = await fetch(`${baseUrl}/api/rss/entries/${entryId}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      entry = data.entry;
    }
  } catch {
    // 忽略，页面会显示加载失败
  }

  if (!entry) {
    notFound();
  }

  const markdownContent = entry.content || entry.summary || '';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title={entry.title}
        description={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            <span>{entry.feed_title}</span>
            {entry.author && <span>· {entry.author}</span>}
            {entry.published_at && <span>· {entry.published_at.slice(0, 10)}</span>}
            {entry.link && (
              <a
                href={entry.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-600 dark:text-accent-400 hover:underline"
              >
                原文链接 →
              </a>
            )}
          </div>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/rss" className="btn-secondary">
              ← 返回
            </Link>
            {entry.link && (
              <a href={entry.link} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                打开原文
              </a>
            )}
          </div>
        }
      />

      <article className="prose dark:prose-invert max-w-none">
        {markdownContent ? (
          <div dangerouslySetInnerHTML={{ __html: markdownContent }} />
        ) : (
          <p className="text-gray-400">该条目暂无正文内容。</p>
        )}
      </article>
    </div>
  );
}
