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
  const isDark = useIsDarkTheme();

  const title = (frontmatter.title as string) || filePath.replace(/\.md$/, '');
  const tagsInput = Array.isArray(frontmatter.tags) ? (frontmatter.tags as unknown as string[]).join(', ') : (frontmatter.tags as string) || '';
  const status = (frontmatter.status as string) || 'active';

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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            导出 MD
          </a>
          <a
            href={`/api/workspace/export?path=${encodeURIComponent(filePath)}&format=html`}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            导出 HTML
          </a>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-340px)]">
          <div className="overflow-hidden">
            <div ref={editorRef} className="h-full" />
          </div>
          <div className="p-6 overflow-auto border-l border-gray-200 dark:border-gray-700">
            <MarkdownPreview content={body} />
          </div>
        </div>
      </div>
    </div>
  );
}
