'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EntityForm, EntityFormData } from '@/components/forms/EntityForm';

interface GenericCreateProps {
  type: string;
}

export function GenericCreateClient({ type }: GenericCreateProps) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (savedEntity: EntityFormData) => {
    setSaved(true);
    setTimeout(() => {
      window.location.href = `/${type}s`;
    }, 1000);
  };

  if (saved) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <p className="text-green-800 dark:text-green-200">{type} created successfully! Redirecting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <Link href={`/${type}s`} className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to {type.charAt(0).toUpperCase() + type.slice(1)}s
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <EntityForm
        type={type}
        onSuccess={handleSave}
        onCancel={() => window.history.back()}
      />
    </div>
  );
}
