'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Entity {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

interface ProfileVersion {
  title: string;
  summary: string;
  highlights: string[];
  target_audience: string;
}

interface ProfileDetail {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  versions?: Record<string, ProfileVersion>;
  compiled_from?: string[];
  last_compiled?: string;
}

export function ProfileDetailClient({ id }: { id: string }) {
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/entities/profile/${id}`);
        if (!res.ok) {
          throw new Error('Profile not found');
        }
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [id]);

  if (loading) {
    return <div className="text-gray-500">Loading profile...</div>;
  }

  if (error || !profile) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || 'Profile not found'}</p>
        <Link href="/profile" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Profiles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.title}
            </h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                profile.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {profile.status}
              </span>
              <span>Created: {new Date(profile.created_at).toLocaleDateString()}</span>
              <span>Updated: {new Date(profile.updated_at).toLocaleDateString()}</span>
            </div>
            {profile.tags && profile.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.tags.map((tag) => (
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
          <div className="flex gap-3">
            <Link
              href={`/entities/profile/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit
            </Link>
            <Link
              href="/profile"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>

      {profile.versions && Object.keys(profile.versions).length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Profile Versions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(profile.versions).map(([key, version]) => (
              <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white capitalize">{key}</h4>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{version.summary}</p>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Target: {version.target_audience}
                </div>
                {version.highlights && version.highlights.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                    {version.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {profile.compiled_from && profile.compiled_from.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Compiled From
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.compiled_from.map((source) => (
              <span
                key={source}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
              >
                {source}
              </span>
            ))}
          </div>
        </section>
      )}

      {profile.last_compiled && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Last Compiled
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{new Date(profile.last_compiled).toLocaleString()}</p>
        </section>
      )}

      {profile.content && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Notes
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.content}</p>
        </section>
      )}
    </div>
  );
}
