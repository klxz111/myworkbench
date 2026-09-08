'use client';

import { useRef, useState } from 'react';
import { MarkdownPreview } from '@/components/MarkdownPreview';

type EditorMode = 'edit' | 'split' | 'preview';

const MODE_STORAGE_KEY = 'mwbench_content_editor_mode';

const MODE_TABS: { mode: EditorMode; label: string; title: string }[] = [
  { mode: 'edit', label: '编辑', title: '仅显示编辑区' },
  { mode: 'split', label: '分屏', title: '左侧编辑，右侧实时预览' },
  { mode: 'preview', label: '预览', title: '仅显示渲染结果' },
];

interface ContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Markdown 内容编辑器：编辑 / 分屏 / 预览三态 + 插入工具条 + 图片上传。
 * 渲染复用 MarkdownPreview（escapeHtml 防注入），图片走 /api/upload + /api/asset。
 */
export function ContentEditor({ value, onChange, placeholder }: ContentEditorProps) {
  const [mode, setMode] = useState<EditorMode>(() => {
    if (typeof window === 'undefined') return 'split';
    const saved = window.localStorage.getItem(MODE_STORAGE_KEY);
    return saved === 'edit' || saved === 'split' || saved === 'preview' ? saved : 'split';
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const switchMode = (m: EditorMode) => {
    setMode(m);
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, m);
    } catch {
      /* 隐私模式等存储不可用时忽略 */
    }
  };

  /** 在光标处插入/包裹文本（selectionStart/End 拼接，插入后恢复选区） */
  const insert = (before: string, after = '', placeholderText = '') => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    const selected = value.slice(start, end);
    const replacement = selected ? `${before}${selected}${after}` : `${before}${placeholderText}${after}`;
    const next = value.slice(0, start) + replacement + value.slice(end);
    onChange(next);
    // 等 React 提交新 value 后再恢复焦点与选区
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      const caret = start + before.length + (selected ? selected.length : placeholderText.length);
      ta.setSelectionRange(caret, caret);
    });
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '上传失败');
      }
      const data = await res.json();
      const alt = file.name.replace(/\.[^.]+$/, '');
      insert(`![${alt}](/api/asset?path=${encodeURIComponent(data.path)})`, '', '');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const TOOL_BUTTON =
    'px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50';

  const showEditor = mode !== 'preview';
  const showPreview = mode !== 'edit';

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-900 p-0.5">
          {MODE_TABS.map((t) => (
            <button
              key={t.mode}
              type="button"
              onClick={() => switchMode(t.mode)}
              title={t.title}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                mode === t.mode
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => insert('**', '**', '粗体文本')} className={`${TOOL_BUTTON} font-bold`} title="粗体">
            B
          </button>
          <button type="button" onClick={() => insert('*', '*', '斜体文本')} className={`${TOOL_BUTTON} italic`} title="斜体">
            I
          </button>
          <button type="button" onClick={() => insert('## ', '', '标题')} className={TOOL_BUTTON} title="标题">
            H
          </button>
          <button type="button" onClick={() => insert('- ', '', '列表项')} className={TOOL_BUTTON} title="列表">
            •
          </button>
          <button type="button" onClick={() => insert('> ', '', '引用文本')} className={TOOL_BUTTON} title="引用">
            &quot;
          </button>
          <button type="button" onClick={() => insert('```\n', '\n```', '代码')} className={`${TOOL_BUTTON} font-mono`} title="代码块">
            {'</>'}
          </button>
          <button type="button" onClick={() => insert('[', '](url)', '链接文本')} className={TOOL_BUTTON} title="链接">
            🔗
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={TOOL_BUTTON}
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
      </div>

      {uploadError && <p className="mb-1 text-xs text-red-600 dark:text-red-400">{uploadError}</p>}

      <div className={`grid gap-3 ${mode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {showEditor && (
          <textarea
            ref={textareaRef}
            rows={12}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-500 dark:bg-gray-800 dark:text-white font-mono text-sm"
          />
        )}
        {showPreview && (
          <div className={`rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-auto bg-gray-50/50 dark:bg-gray-900/40 ${
            mode === 'split' ? 'max-h-[420px]' : 'min-h-[120px]'
          }`}>
            {value.trim() ? (
              <MarkdownPreview content={value} resolveWikiLinks />
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">暂无内容，左侧输入的 Markdown 会在这里实时渲染。</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
