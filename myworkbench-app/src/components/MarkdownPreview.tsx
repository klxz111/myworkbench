'use client';

import { useEffect, useState } from 'react';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import katex from 'katex';

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  })
);

/* ---------- 数学公式（$...$ 行内 / $$...$$ 块级），KaTeX 渲染 ---------- */

/** escapeHtml 先于 parse 执行，公式里的 <>& 会被转成实体；交给 KaTeX 前还原 */
function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function renderMath(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(decodeEntities(tex), { displayMode, throwOnError: false, output: 'html' });
  } catch {
    return `<code>${tex}</code>`;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const blockMath = {
  name: 'blockMath',
  level: 'block' as const,
  start(src: string) {
    return src.indexOf('$$');
  },
  tokenizer(src: string) {
    const match = /^\$\$([\s\S]+?)\$\$(?:\n+|$)/.exec(src);
    if (match) return { type: 'blockMath', raw: match[0], text: match[1].trim() } as any;
  },
  renderer(token: any) {
    return `<div class="katex-block my-4 overflow-x-auto">${renderMath(token.text, true)}</div>`;
  },
};

const inlineMath = {
  name: 'inlineMath',
  level: 'inline' as const,
  start(src: string) {
    return src.indexOf('$');
  },
  tokenizer(src: string) {
    // $ 后不能是空白/$，$ 结尾后不能紧跟数字（避免 "$5 and $10" 这类金额误伤）
    const match = /^\$(?![\s$])((?:\\.|[^\\\n$])+?)\$(?!\d)/.exec(src);
    if (match) return { type: 'inlineMath', raw: match[0], text: match[1] } as any;
  },
  renderer(token: any) {
    return renderMath(token.text, false);
  },
};
/* eslint-enable @typescript-eslint/no-explicit-any */

marked.use({ extensions: [blockMath, inlineMath] });

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
