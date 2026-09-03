'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EntityForm, EntityFormData } from '@/components/forms/EntityForm';

interface EntityData {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  [key: string]: unknown;
}

interface GenericEditProps {
  type: string;
  id: string;
}

export function GenericEditClient({ type, id }: GenericEditProps) {
  const [entity, setEntity] = useState<EntityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchEntity() {
      try {
        const res = await fetch(`/api/entities/${type}/${id}`);
        if (!res.ok) {
          throw new Error(`${type.charAt(0).toUpperCase() + type.slice(1)} not found`);
        }
        const data = await res.json();
        setEntity(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to load ${type}`);
      } finally {
        setLoading(false);
      }
    }
    fetchEntity();
  }, [type, id]);

  const handleSave = (savedEntity: EntityFormData) => {
    setSaved(true);
    setTimeout(() => {
      window.location.href = `/${type}s`;
    }, 1000);
  };

  if (loading) {
    return <div className="text-gray-500">Loading edit form...</div>;
  }

  if (error || !entity) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || `${type} not found`}</p>
        <Link href={`/${type}s`} className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to {type.charAt(0).toUpperCase() + type.slice(1)}s
        </Link>
      </div>
    );
  }

  const initialData: EntityData = {
    id: entity.id,
    title: entity.title,
    status: entity.status,
    tags: entity.tags,
    content: entity.content,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
  };

  return (
    <div className="space-y-6">
      {saved && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-200">{type} saved successfully! Redirecting...</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <EntityForm
          type={type}
          initialData={initialData}
          onSuccess={handleSave}
          onCancel={() => window.history.back()}
        />
      </div>
    </div>
  );
}
