'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { bracketMatching } from '@codemirror/language';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { MarkdownToolbar } from './MarkdownToolbar';
import { useIsDarkTheme } from '@/lib/theme';
import { countWords } from '@/lib/wordcount';

interface MarkdownEditorProps {
  filePath: string;
}

export function MarkdownEditor({ filePath }: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [body, setBody] = useState('');
  const [frontmatter, setFrontmatter] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const [frontmatterOpen, setFrontmatterOpen] = useState(true);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const isDark = useIsDarkTheme();

  const title = (frontmatter.title as string) || filePath.replace(/\.md$/, '');
  const tagsInput = Array.isArray(frontmatter.tags) ? (frontmatter.tags as unknown as string[]).join(', ') : (frontmatter.tags as string) || '';
  const status = (frontmatter.status as string) || 'active';
  const { words, chars } = countWords(body);
  const headings = body
    .split('\n')
    .map((line, i) => ({ line: line.trim(), i }))
    .filter(({ line }) => /^#{1,4}\s+\S/.test(line))
    .map(({ line }) => ({ level: (line.match(/^#+/) || ['#'])[0].length, text: line.replace(/^#+\s+/, '') }));

  const scrollToHeading = (index: number) => {
    const nodes = previewRef.current?.querySelectorAll('h1, h2, h3, h4');
    nodes?.[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /** 粘贴图片：上传到 /api/upload 后在光标处插入资产链接（非图片粘贴不拦截） */
  const handleImagePaste = (event: ClipboardEvent, view: EditorView): boolean => {
    const images = Array.from(event.clipboardData?.files || []).filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return false;
    event.preventDefault();
    (async () => {
      setUploadingImages((n) => n + 1);
      try {
        for (const file of images) {
          try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || '上传失败');
            }
            const data = (await res.json()) as { path: string };
            const alt = file.name.replace(/\.[^.]+$/, '') || 'image';
            const text = `![${alt}](/api/asset?path=${encodeURIComponent(data.path)})`;
            const sel = view.state.selection.main;
            view.dispatch({
              changes: { from: sel.from, to: sel.to, insert: text },
              selection: { anchor: sel.from + text.length },
            });
          } catch (err) {
            alert(err instanceof Error ? err.message : '图片上传失败');
          }
        }
      } finally {
        setUploadingImages((n) => Math.max(0, n - 1));
      }
    })();
    return true;
  };

  useEffect(() => {
    async function fetchFile() {
      try {
        const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(filePath)}`);
        if (!res.ok) throw new Error('Failed to load file');
        const data = await res.json();
        // body 为空字符串时不能回退到整份原文（含 frontmatter），否则自动保存会把 frontmatter 烤进正文
        setBody(data.body ?? '');
        setFrontmatter(data.frontmatter || {});
        setHasChanges(false);
        setLastSaved(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    }
    fetchFile();
  }, [filePath]);

  useEffect(() => {
    if (!editorRef.current || loading) return;

    const state = EditorState.create({
      doc: body,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLineGutter(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        keymap.of([
          ...closeBracketsKeymap,
          ...completionKeymap,
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        ...(isDark ? [oneDark] : []),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setBody(update.state.doc.toString());
            setHasChanges(true);
          }
        }),
        EditorView.domEventHandlers({
          paste: handleImagePaste,
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    setEditorView(view);

    return () => {
      view.destroy();
      setEditorView(null);
    };
    // isDark 变化时重建编辑器以切换 CodeMirror 主题（文档内容来自 React state，不会丢失）
  }, [loading, isDark]);

  useEffect(() => {
    if (!hasChanges) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 3000);
    return () => clearTimeout(timer);
  }, [hasChanges, body]);

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(filePath)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: body, frontmatter }),
      });
      if (!res.ok) throw new Error('保存失败');
      setHasChanges(false);
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`确定删除 ${filePath} 吗？`)) return;
    try {
      const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('删除失败');
      window.location.href = '/workspace';
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFrontmatter((prev) => ({ ...prev, title: e.target.value }));
    setHasChanges(true);
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
    setFrontmatter((prev) => ({ ...prev, tags }));
    setHasChanges(true);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFrontmatter((prev) => ({ ...prev, status: e.target.value }));
    setHasChanges(true);
  };

  if (loading) {
    return <div className="text-gray-500">加载文件中...</div>;
  }

  if (error && !body) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">{filePath}</span>
          {hasChanges && <span className="text-sm text-yellow-600">● 未保存</span>}
          {lastSaved && <span className="text-xs text-gray-400">已保存 {lastSaved}</span>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="btn-primary"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            删除
          </button>
          <a
            href={`/api/workspace/export?path=${encodeURIComponent(filePath)}&format=md`}
            className="btn-secondary"
          >
            导出 MD
          </a>
          <a
            href={`/api/workspace/export?path=${encodeURIComponent(filePath)}&format=html`}
            className="btn-secondary"
          >
            导出 HTML
          </a>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setFrontmatterOpen(!frontmatterOpen)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <span>{frontmatterOpen ? '▼' : '▶'}</span>
            Frontmatter
          </button>
        </div>

        {frontmatterOpen && (
          <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">title</label>
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">tags</label>
              <input
                type="text"
                value={tagsInput}
                onChange={handleTagsChange}
                placeholder="逗号分隔"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">status</label>
              <select
                value={status}
                onChange={handleStatusChange}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="archived">archived</option>
              </select>
            </div>
          </div>
        )}

        <MarkdownToolbar view={editorView} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:h-[calc(100vh-280px)]">
          <div className="overflow-hidden lg:h-full">
            <div ref={editorRef} className="h-full" />
          </div>
          <div ref={previewRef} className="overflow-auto border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 lg:h-full">
            {headings.length > 0 && (
              <div className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-2">
                <button
                  onClick={() => setOutlineOpen(!outlineOpen)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <span>{outlineOpen ? '▼' : '▶'}</span>
                  文档大纲（{headings.length}）
                </button>
                {outlineOpen && (
                  <ul className="mt-1.5 space-y-0.5 max-h-32 overflow-y-auto scroll-thin">
                    {headings.map((h, i) => (
                      <li key={i}>
                        <button
                          onClick={() => scrollToHeading(i)}
                          className={`block w-full text-left text-xs text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 truncate rounded px-1 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700/60`}
                          style={{ paddingLeft: `${(h.level - 1) * 12 + 4}px` }}
                          title={h.text}
                        >
                          {h.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="p-6">
              <MarkdownPreview content={body} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-gray-200 dark:border-gray-700 text-[11px] text-gray-400 dark:text-gray-500">
          <span>
            {uploadingImages > 0 ? (
              <span className="text-blue-600 dark:text-blue-400">图片上传中...</span>
            ) : (
              <>约 {words.toLocaleString()} 字 · {chars.toLocaleString()} 字符</>
            )}
          </span>
          <span>{hasChanges ? '● 未保存（3 秒后自动保存）' : lastSaved ? `已保存 ${lastSaved}` : '无改动'}</span>
        </div>
      </div>
    </div>
  );
}
