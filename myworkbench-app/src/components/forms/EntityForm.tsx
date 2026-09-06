'use client';

import { useEffect, useState } from 'react';
import { COMMON_FIELDS, TYPE_SPECIFIC_FIELDS } from '@/lib/fields';
import { ContentEditor } from '@/components/forms/ContentEditor';

export interface EntityFormData {
  id?: string;
  title: string;
  status: string;
  tags: string[];
  content: string;
  [key: string]: unknown;
}

interface EntityFormProps {
  type: string;
  initialData?: EntityFormData;
  onSuccess?: (entity: EntityFormData) => void;
  onCancel?: () => void;
}

export function EntityForm({ type, initialData, onSuccess, onCancel }: EntityFormProps) {
  const [formData, setFormData] = useState<EntityFormData>(() => {
    if (initialData) return initialData;
    const specific = TYPE_SPECIFIC_FIELDS[type] || [];
    const statusField = (specific.length > 0 ? specific : COMMON_FIELDS).find((f) => f.key === 'status');
    return {
      title: '',
      status: statusField?.options?.[0] || 'active',
      tags: [],
      content: '',
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  // 类型专属字段可覆盖同名的通用字段（如 task 的 status）
  const fields = (() => {
    const specific = TYPE_SPECIFIC_FIELDS[type] || [];
    if (specific.length === 0) return COMMON_FIELDS;
    const overrideKeys = new Set(specific.map((f) => f.key));
    return [...COMMON_FIELDS.filter((f) => !overrideKeys.has(f.key)), ...specific];
  })();

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const isEdit = !!initialData?.id;
      let generatedSlug = formData.id || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      // 纯中文等标题无法生成 ASCII slug 时回退到时间戳 id，否则创建请求必然被拒
      if (!generatedSlug) {
        generatedSlug = `${type}-${Date.now().toString(36)}`;
      }
      const url = isEdit ? `/api/entities/${type}/${initialData.id}` : `/api/entities/${type}`;
      const method = isEdit ? 'PUT' : 'POST';

      const payload: Record<string, unknown> = {
        slug: generatedSlug,
        data: { ...formData, id: generatedSlug },
        content: formData.content,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '保存实体失败');
      }

      const saved = await res.json();
      onSuccess?.(saved);
    } catch (err) {
       setError(err instanceof Error ? err.message : '保存实体失败');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {field.label}
          </label>

          {field.type === 'text' && (
            <input
              type="text"
              value={formData[field.key] as string || ''}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          )}

          {field.type === 'date' && (
            <input
              type="date"
              value={formData[field.key] as string || ''}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          )}

          {field.type === 'number' && (
            <input
              type="number"
              step="any"
              value={(formData[field.key] as number | string | undefined) ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  [field.key]: e.target.value === '' ? '' : Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          )}

          {field.type === 'markdown' && (
            <ContentEditor
              value={(formData[field.key] as string) || ''}
              onChange={(v) => setFormData({ ...formData, [field.key]: v })}
              placeholder="支持 Markdown：# 标题、**粗体**、- 列表、![图片]..."
            />
          )}

          {field.type === 'textarea' && (
            <textarea
              rows={4}
              value={formData[field.key] as string || ''}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          )}

          {field.type === 'list' && (
            <input
              type="text"
              value={
                Array.isArray(formData[field.key])
                  ? (formData[field.key] as string[]).join(', ')
                  : (formData[field.key] as string) || ''
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  [field.key]: e.target.value
                    .split(/[,，]/)
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="逗号分隔，如：持续学习, AI 系统与硬件"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          )}

          {field.type === 'select' && field.options && (
            <select
              value={formData[field.key] as string || ''}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
               <option value="">请选择...</option>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>{field.option_labels?.[opt] || opt}</option>
              ))}
            </select>
          )}

          {field.type === 'tags' && (
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                   placeholder="添加标签..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={addTag}
                   className="btn-secondary"
                >
                  添加
                </button>
              </div>
            </div>
          )}

          {field.hint && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{field.hint}</p>
          )}
        </div>
      ))}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? '保存中...' : initialData?.id ? '更新' : '创建'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
          className="btn-secondary"
        >
          取消
        </button>
        )}
      </div>
    </form>
  );
}
