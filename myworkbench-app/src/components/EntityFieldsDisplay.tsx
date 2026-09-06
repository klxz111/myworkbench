'use client';

import { TYPE_SPECIFIC_FIELDS, FieldDef } from '@/lib/fields';

interface EntityFieldsDisplayProps {
  entityType: string;
  frontmatter: Record<string, unknown>;
}

function formatValue(value: unknown, type?: FieldDef['type']): string {
  if (value === undefined || value === null || value === '') return '';
  if (type === 'date' && (typeof value === 'string' || typeof value === 'number')) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('zh-CN');
  }
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function EntityFieldsDisplay({ entityType, frontmatter }: EntityFieldsDisplayProps) {
  const fields: FieldDef[] = TYPE_SPECIFIC_FIELDS[entityType] || [];
  if (fields.length === 0) return null;

  const visible = fields.filter((f) => {
    const value = frontmatter[f.key];
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });

  if (visible.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <h3 className="px-6 pt-5 pb-3 text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
        详细信息
      </h3>
      <dl className="divide-y divide-gray-100 dark:divide-gray-700">
        {visible.map((field) => (
          <div
            key={field.key}
            className="px-6 py-3 grid grid-cols-[160px_1fr] gap-4 items-start"
          >
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {field.label}
            </dt>
            <dd className="text-sm text-gray-900 dark:text-gray-200 whitespace-pre-wrap break-words">
              {formatValue(frontmatter[field.key], field.type)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}