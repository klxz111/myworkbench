'use client';

import { useEffect, useState } from 'react';
import { MarkdownPreview } from '@/components/MarkdownPreview';

interface MarkdownViewerProps {
  entityType: string;
  id: string;
}

export function MarkdownViewer({ entityType, id }: MarkdownViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMarkdown() {
      try {
        const res = await fetch(`/api/entities/${entityType}/${id}/markdown`);
        if (!res.ok) {
          throw new Error('无法加载 Markdown 文件');
        }
        const data = await res.json();
        setContent(data.markdown || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    }
    fetchMarkdown();
  }, [entityType, id]);

  if (loading) {
    return <div className="text-gray-500">加载 Markdown 中...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        内容
      </h3>
      <MarkdownPreview content={content || ''} />
    </div>
  );
}