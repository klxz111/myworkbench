'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { entityHref, ENTITY_LABELS } from '@/lib/entity-paths';

interface Relation {
  to_id: string;
  relation: string;
  title: string;
  type: string;
  slug: string;
}

interface IncomingRelation {
  from_id: string;
  relation: string;
  title: string;
  type: string;
}

interface RelationsSectionProps {
  entityId: string;
  entityType?: string;
}

const RELATION_TYPES = [
  { value: 'supports', label: 'supports' },
  { value: 'contradicts', label: 'contradicts' },
  { value: 'derives_from', label: 'derives_from' },
  { value: 'depends_on', label: 'depends_on' },
  { value: 'related_to', label: 'related_to' },
  { value: 'member_of', label: 'member_of' },
  { value: 'works_at', label: 'works_at' },
];

export function RelationsSection({ entityId, entityType }: RelationsSectionProps) {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [incoming, setIncoming] = useState<IncomingRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRelation, setSelectedRelation] = useState<string>('related_to');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function fetchRelations() {
      try {
        const [outRes, inRes] = await Promise.all([
          fetch(`/api/relations?from=${encodeURIComponent(entityId)}`),
          fetch(`/api/relations?to=${encodeURIComponent(entityId)}`),
        ]);
        if (!outRes.ok) {
          throw new Error('加载关系失败');
        }
        const outData = await outRes.json();
        setRelations(outData.relations || []);
        if (inRes.ok) {
          const inData = await inRes.json();
          setIncoming(
            (inData.relations || []).filter(
              (r: { from_id: string }) => r.from_id !== entityId
            )
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载关系失败');
      } finally {
        setLoading(false);
      }
    }
    fetchRelations();
  }, [entityId]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Error searching entities:', error);
    }
  };

  const handleAddRelation = async () => {
    if (!selectedEntity) return;
    setAdding(true);
    try {
      const res = await fetch('/api/relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_id: entityId,
          to_id: selectedEntity.id || selectedEntity.slug,
          relation: selectedRelation,
        }),
      });
      if (!res.ok) throw new Error('添加关系失败');
      setRelations((prev) => [
        ...prev,
        {
          to_id: selectedEntity.id || selectedEntity.slug,
          relation: selectedRelation,
          title: selectedEntity.title,
          type: selectedEntity.type,
          slug: selectedEntity.slug || selectedEntity.id,
        },
      ]);
      setShowAddDialog(false);
      setSelectedEntity(null);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加关系失败');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteRelation = async (toId: string, relation: string) => {
    if (!confirm('确定删除此关系吗？')) return;
    try {
      const res = await fetch(`/api/relations?from=${entityId}&to=${toId}&relation=${relation}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('删除关系失败');
      setRelations((prev) => prev.filter((r) => !(r.to_id === toId && r.relation === relation)));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除关系失败');
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载关系中...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (relations.length === 0 && !showAddDialog) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            关联实体
          </h3>
          <button
            onClick={() => setShowAddDialog(true)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + 添加关系
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">暂无关联实体。</p>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          关联实体
        </h3>
        <button
          onClick={() => setShowAddDialog(true)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + 添加关系
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {relations.map((rel) => {
          const href = entityHref(rel.type, rel.to_id);
          return (
            <div
              key={`${rel.to_id}-${rel.relation}`}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Link href={href} className="flex items-center gap-1">
                <span className="text-xs text-blue-500 dark:text-blue-400 font-medium uppercase">
                  {rel.relation}
                </span>
                <span>{rel.title}</span>
              </Link>
              <button
                onClick={() => handleDeleteRelation(rel.to_id, rel.relation)}
                className="ml-1 text-blue-400 hover:text-red-600 dark:hover:text-red-400"
                title="删除关系"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {incoming.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            被指向（入边）
          </p>
          <div className="flex flex-wrap gap-2">
            {incoming.map((rel) => (
              <Link
                key={`${rel.from_id}-${rel.relation}`}
                href={entityHref(rel.type, rel.from_id)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 rounded-full text-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase">
                  ← {rel.relation}
                </span>
                <span>{rel.title}</span>
                <span className="text-[10px] text-gray-400">
                  {ENTITY_LABELS[rel.type] || rel.type}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">添加关系</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  搜索实体
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="搜索实体..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg max-h-48 overflow-auto">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.slug}-${result.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedEntity(result);
                          setSearchQuery(result.title);
                          setSearchResults([]);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${selectedEntity?.slug === result.slug && selectedEntity?.type === result.type ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{result.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{result.type}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  关系类型
                </label>
                <select
                  value={selectedRelation}
                  onChange={(e) => setSelectedRelation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {RELATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowAddDialog(false);
                    setSelectedEntity(null);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
                <button
                  onClick={handleAddRelation}
                  disabled={adding || !selectedEntity}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {adding ? '添加中...' : '添加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
