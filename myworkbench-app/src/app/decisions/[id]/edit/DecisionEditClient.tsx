'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EntityForm, EntityFormData } from '@/components/forms/EntityForm';

interface Decision {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  context?: string;
  question?: string;
  options?: Array<{ label: string; pros: string[]; cons: string[] }>;
  evidence?: string[];
  current_belief?: string;
  decision?: string;
  expected_outcome?: string;
  gate?: {
    invalidate_if?: string;
    review_date?: string;
    pivot_signals?: string[];
  };
  actual_result?: string;
  belief_update?: string;
}

interface DecisionEditProps {
  id: string;
}

export function DecisionEditClient({ id }: DecisionEditProps) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchDecision() {
      try {
        const res = await fetch(`/api/entities/decision/${id}`);
        if (!res.ok) {
          throw new Error('Decision not found');
        }
        const data = await res.json();
        setDecision(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load decision');
      } finally {
        setLoading(false);
      }
    }
    fetchDecision();
  }, [id]);

  const handleSave = (savedDecision: EntityFormData) => {
    setSaved(true);
    setTimeout(() => {
      window.location.href = `/decisions/${id}`;
    }, 1000);
  };

  if (loading) {
    return <div className="text-gray-500">Loading edit form...</div>;
  }

  if (error || !decision) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || 'Decision not found'}</p>
        <Link href="/decisions" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Decisions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {saved && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-200">Decision saved successfully! Redirecting...</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <EntityForm
          type="decision"
          initialData={{
            id: decision.id,
            title: decision.title,
            status: decision.status,
            tags: decision.tags,
            content: decision.content,
            context: decision.context,
            question: decision.question,
            current_belief: decision.current_belief,
            decision: decision.decision,
            expected_outcome: decision.expected_outcome,
            actual_result: decision.actual_result,
            belief_update: decision.belief_update,
          }}
          onSuccess={handleSave}
          onCancel={() => window.history.back()}
        />
      </div>
    </div>
  );
}
