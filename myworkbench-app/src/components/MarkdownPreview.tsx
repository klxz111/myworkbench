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

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    async function render() {
      try {
        const result = await marked.parse(content || '');
        setHtml(typeof result === 'string' ? result : String(result));
      } catch {
        setHtml(content || '');
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