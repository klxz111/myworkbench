'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ENTITY_LABELS } from '@/lib/entity-paths';

interface ContentBacklink {
  from_id: string;
  from_type: string;
  from_title: string;
  context: string;
  href: string;
}

interface RelationBacklink {
  from_id: string;
  from_type: string;
  from_title: string;
  relation: string;
  href: string;
}

interface BacklinksSectionProps {
  entityType: string;
  entityId: string;
}

export function BacklinksSection({ entityType, entityId }: BacklinksSectionProps) {
  const [contentLinks, setContentLinks] = useState<ContentBacklink[]>([]);
  const [relationLinks, setRelationLinks] = useState<RelationBacklink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBacklinks() {
      try {
        const res = await fetch(`/api/entities/${entityType}/${entityId}/backlinks`);
        if (!res.ok) return;
        const data = await res.json();
        setContentLinks(data.content_backlinks || []);
        setRelationLinks(data.relation_backlinks || []);
      } catch {
        // 反链加载失败不影响主内容
      } finally {
        setLoading(false);
      }
    }
    fetchBacklinks();
  }, [entityType, entityId]);

  if (loading) return null;
  if (contentLinks.length === 0 && relationLinks.length === 0) return null;

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        反向链接
      </h3>

      {relationLinks.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">关系引用</p>
          <div className="flex flex-wrap gap-2">
            {relationLinks.map((r) => (
              <Link
                key={`${r.relation}-${r.from_id}`}
                href={r.href}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <span className="text-xs font-medium uppercase">{r.relation}</span>
                <span>{r.from_title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {contentLinks.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">正文中被提及</p>
          <ul className="space-y-2">
            {contentLinks.map((l) => (
              <li key={l.from_id}>
                <Link href={l.href} className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  {l.from_title}
                </Link>
                <span className="ml-2 text-[10px] text-gray-400 uppercase">
                  {ENTITY_LABELS[l.from_type] || l.from_type}
                </span>
                {l.context && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{l.context}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
