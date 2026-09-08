'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  event_date?: string;
  recurrence?: string;
  recurrence_until?: string;
  location?: string;
  event_type?: string;
  linked_strategies?: string[];
  linked_decisions?: string[];
}

interface EventEditProps {
  id: string;
}

export function EventEditClient({ id }: EventEditProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    status: 'active',
    tags: '',
    content: '',
    event_date: '',
    recurrence: '',
    recurrence_until: '',
    location: '',
    event_type: '',
    linked_strategies: '',
    linked_decisions: '',
  });

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/entities/event/${id}`);
        if (!res.ok) throw new Error('Event not found');
        const data: Event = await res.json();
        setForm({
          title: data.title || '',
          status: data.status || 'active',
          tags: (data.tags || []).join(', '),
          content: data.content || '',
          event_date: data.event_date || '',
          recurrence: data.recurrence || '',
          recurrence_until: data.recurrence_until || '',
          location: data.location || '',
          event_type: data.event_type || '',
          linked_strategies: (data.linked_strategies || []).join(', '),
          linked_decisions: (data.linked_decisions || []).join(', '),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载事件失败');
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        title: form.title,
        status: form.status,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        content: form.content,
        event_date: form.event_date || undefined,
        recurrence: form.recurrence || undefined,
        recurrence_until: form.recurrence_until || undefined,
        location: form.location || undefined,
        event_type: form.event_type || undefined,
        linked_strategies: form.linked_strategies.split(',').map((t) => t.trim()).filter(Boolean),
        linked_decisions: form.linked_decisions.split(',').map((t) => t.trim()).filter(Boolean),
      };

      const res = await fetch(`/api/entities/event/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // content 必须放在顶层：PUT 的 body.content 才会生效，否则描述编辑被静默丢弃
        body: JSON.stringify({ data, content: form.content }),
      });

      if (!res.ok) throw new Error('保存失败');
      router.push(`/events/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存事件失败');
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载事件中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">编辑事件</h1>
        <Link
          href={`/events/${id}`}
          className="btn-secondary"
        >
          取消
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">状态</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="active">活跃</option>
            <option value="draft">草稿</option>
            <option value="archived">已归档</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标签（逗号分隔）</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">事件日期</label>
          <input
            type="date"
            value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">重复</label>
          <select
            value={form.recurrence}
            onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">不重复</option>
            <option value="daily">每天</option>
            <option value="weekly">每周</option>
            <option value="biweekly">每两周</option>
            <option value="monthly">每月</option>
            <option value="yearly">每年</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">设置后日历会展开显示未来的发生日</p>
        </div>

        {form.recurrence && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">重复截止（可选）</label>
            <input
              type="date"
              value={form.recurrence_until}
              onChange={(e) => setForm({ ...form, recurrence_until: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">地点</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">事件类型</label>
          <input
            type="text"
            value={form.event_type}
            onChange={(e) => setForm({ ...form, event_type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">关联策略（逗号分隔 ID）</label>
          <input
            type="text"
            value={form.linked_strategies}
            onChange={(e) => setForm({ ...form, linked_strategies: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">关联决策（逗号分隔 ID）</label>
          <input
            type="text"
            value={form.linked_decisions}
            onChange={(e) => setForm({ ...form, linked_decisions: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          <Link
            href={`/events/${id}`}
            className="btn-secondary"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
