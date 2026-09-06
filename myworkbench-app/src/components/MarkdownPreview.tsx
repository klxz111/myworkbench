'use client';

import { useEffect, useState } from 'react';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  })
);

interface MarkdownPreviewProps {
  content: string;
}

/** marked v4+ 不再消毒 HTML：先转义原生 HTML 标签，实体/笔记中的 <script>、<img onerror> 才不会注入 DOM */
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    async function render() {
      try {
        const result = await marked.parse(escapeHtml(content || ''));
        setHtml(typeof result === 'string' ? result : String(result));
      } catch {
        setHtml(escapeHtml(content || ''));
      }
    }
    render();
  }, [content]);

  return (
    <div
      className="prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}