'use client';

import { useRef, useState } from 'react';
import { EditorView } from '@codemirror/view';

interface MarkdownToolbarProps {
  view: EditorView | null;
}

export function MarkdownToolbar({ view }: MarkdownToolbarProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const insert = (before: string, after: string = '', placeholder: string = '') => {
    if (!view) return;
    const { state } = view;
    const { from, to } = state.selection.main;
    const selected = state.sliceDoc(from, to);
    const replacement = selected ? `${before}${selected}${after}` : `${before}${placeholder}${after}`;
    view.dispatch({
      changes: { from, to, insert: replacement },
      selection: { anchor: from + before.length, head: from + before.length + (selected ? selected.length : placeholder.length) },
    });
    view.focus();
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '上传失败');
      }
      const data = await res.json();
      insert(`![${file.name.replace(/\.[^.]+$/, '')}](/api/asset?path=${encodeURIComponent(data.path)})`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => insert('**', '**', '粗体文本')}
        className="px-2 py-1 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        title="粗体"
      >
        B
      </button>
      <button
        onClick={() => insert('*', '*', '斜体文本')}
        className="px-2 py-1 text-sm italic text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        title="斜体"
      >
        I
      </button>
      <button
        onClick={() => insert('# ', '', '标题')}
        className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        title="标题"
      >
        H
      </button>
      <button
        onClick={() => insert('- ', '', '列表项')}
        className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        title="列表"
      >
        •
      </button>
      <button
        onClick={() => insert('> ', '', '引用文本')}
        className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        title="引用"
      >
        "
      </button>
      <button
        onClick={() => insert('```\n', '\n```', '代码')}
        className="px-2 py-1 text-sm font-mono text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        title="代码块"
      >
        {'</>'}
      </button>
      <button
        onClick={() => insert('[', '](url)', '链接文本')}
        className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        title="链接"
      >
        🔗
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
        title={uploading ? '上传中...' : '插入图片（png/jpg/gif/webp，≤10MB）'}
      >
        {uploading ? '⏳' : '🖼'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadImage(f);
        }}
      />
    </div>
  );
}
