'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { RelationsSection } from '@/components/RelationsSection';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { BacklinksSection } from '@/components/BacklinksSection';
import { EntityFieldsDisplay } from '@/components/EntityFieldsDisplay';
import { isStarred, toggleStar } from '@/lib/prefs';

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
      className="w-4 h-4"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
}

export interface DetailShellProps {
  entityType: string;
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  listPath: string;
  editHref: string;
  onDelete?: () => void;
  deleting?: boolean;
  frontmatter?: Record<string, unknown>;
  children?: ReactNode;
}

function statusBadgeClass(status: string): string {
  if (status === 'active' || status === 'done' || status === 'completed') {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  }
  if (status === 'draft' || status === 'pending' || status === 'scheduled') {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}

export function DetailShell({
  entityType,
  id,
  title,
  status,
  tags,
  created_at,
  updated_at,
  listPath,
  editHref,
  onDelete,
  deleting,
  frontmatter,
  children,
}: DetailShellProps) {
  const [starred, setStarred] = useState(() => isStarred(entityType, id));

  const handleToggleStar = () => {
    toggleStar(entityType, id);
    setStarred(!starred);
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white break-words">
              {title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass(status)}`}
              >
                {status}
              </span>
              {created_at && <span>创建：{new Date(created_at).toLocaleDateString()}</span>}
              {updated_at && <span>更新：{new Date(updated_at).toLocaleDateString()}</span>}
            </div>
            {tags && tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={handleToggleStar}
              className={`btn-ghost ${starred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
              title={starred ? '取消星标' : '星标置顶'}
            >
              <StarIcon filled={starred} />
            </button>
            {editHref && (
              <Link href={editHref} className="btn-primary">
                编辑
              </Link>
            )}
            {onDelete && (
              <button onClick={onDelete} disabled={deleting} className="btn-danger">
                {deleting ? '删除中...' : '删除'}
              </button>
            )}
            <Link href={listPath} className="btn-secondary">
              返回列表
            </Link>
          </div>
        </div>
      </div>

      {children}

      <EntityFieldsDisplay entityType={entityType} frontmatter={frontmatter || {}} />

      <RelationsSection entityId={id} entityType={entityType} />
      <BacklinksSection entityType={entityType} entityId={id} />
      <MarkdownViewer entityType={entityType} id={id} />
    </div>
  );
}