'use client';

import { useEffect, useState } from 'react';

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

const COMMON_FIELDS = [
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'archived', 'draft'] },
  { key: 'tags', label: 'Tags', type: 'tags' },
  { key: 'content', label: 'Content', type: 'textarea' },
];

const TYPE_SPECIFIC_FIELDS: Record<string, Array<{ key: string; label: string; type: string; options?: string[] }>> = {
  decision: [
    { key: 'context', label: 'Context', type: 'textarea' },
    { key: 'question', label: 'Question', type: 'text' },
    { key: 'current_belief', label: 'Current Belief', type: 'textarea' },
    { key: 'decision', label: 'Decision', type: 'textarea' },
    { key: 'expected_outcome', label: 'Expected Outcome', type: 'textarea' },
    { key: 'actual_result', label: 'Actual Result', type: 'textarea' },
    { key: 'belief_update', label: 'Belief Update', type: 'textarea' },
  ],
  evidence: [
    { key: 'source_type', label: 'Source Type', type: 'select', options: ['paper', 'news', 'policy', 'company', 'experiment', 'conversation', 'market', 'observation'] },
    { key: 'source_url', label: 'Source URL', type: 'text' },
    { key: 'date', label: 'Date', type: 'text' },
    { key: 'summary', label: 'Summary', type: 'textarea' },
    { key: 'strength', label: 'Strength', type: 'select', options: ['strong', 'moderate', 'weak'] },
  ],
  belief: [
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'confidence', label: 'Confidence', type: 'select', options: ['high', 'medium', 'low'] },
  ],
  strategy: [
    { key: 'horizon', label: 'Horizon', type: 'text' },
  ],
  project: [
    { key: 'hypothesis', label: 'Hypothesis', type: 'textarea' },
    { key: 'start_date', label: 'Start Date', type: 'text' },
    { key: 'end_date', label: 'End Date', type: 'text' },
  ],
  experiment: [
    { key: 'hypothesis', label: 'Hypothesis', type: 'textarea' },
    { key: 'setup', label: 'Setup', type: 'textarea' },
    { key: 'result', label: 'Result', type: 'textarea' },
    { key: 'failure_mode', label: 'Failure Mode', type: 'textarea' },
    { key: 'interpretation', label: 'Interpretation', type: 'textarea' },
  ],
  research: [
    { key: 'identity', label: 'Research Identity', type: 'textarea' },
    { key: 'core_questions', label: 'Core Questions', type: 'textarea' },
  ],
  person: [
    { key: 'organization', label: 'Organization', type: 'text' },
    { key: 'role', label: 'Role', type: 'text' },
    { key: 'relationship_strength', label: 'Relationship Strength', type: 'select', options: ['strong', 'medium', 'weak'] },
  ],
};

export function EntityForm({ type, initialData, onSuccess, onCancel }: EntityFormProps) {
  const [formData, setFormData] = useState<EntityFormData>(initialData || {
    title: '',
    status: 'active',
    tags: [],
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const fields = [...COMMON_FIELDS, ...(TYPE_SPECIFIC_FIELDS[type] || [])];

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
      const url = isEdit ? `/api/entities/${type}/${initialData.id}` : `/api/entities/${type}`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: formData.id || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          data: formData,
          content: formData.content,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save entity');
      }

      const saved = await res.json();
      onSuccess?.(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entity');
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

          {field.type === 'textarea' && (
            <textarea
              rows={4}
              value={formData[field.key] as string || ''}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          )}

          {field.type === 'select' && field.options && (
            <select
              value={formData[field.key] as string || ''}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select...</option>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
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
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : initialData?.id ? 'Update' : 'Create'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
