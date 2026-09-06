'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { BacklinksSection } from '@/components/BacklinksSection';
import { ProfileVersionsPanel } from './ProfileVersionsPanel';

interface Profile {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  content: string;
}

interface ProfileDetailProps {
  id: string;
}

export function ProfileDetailClient({ id }: ProfileDetailProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/entities/profile/${id}`);
        if (!res.ok) throw new Error('Profile not found');
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载个人档案失败');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('确定要删除此个人档案吗？')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/entities/profile/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      window.location.href = '/profile';
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除个人档案失败');
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-gray-500">加载个人档案中...</div>;
  if (error || !profile) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到个人档案'}</p>
        <Link href="/profile" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← 返回个人档案列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.title}</h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                profile.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {profile.status}
              </span>
              <span>更新：{new Date(profile.updated_at).toLocaleDateString()}</span>
            </div>
            {profile.tags && profile.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link href={`/entities/profile/${id}/edit`} className="btn-primary">
              编辑
            </Link>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50">
              {deleting ? '删除中...' : '删除'}
            </button>
          </div>
        </div>
      </div>

      <ProfileVersionsPanel profileId={id} />

      <MarkdownViewer entityType="profile" id={id} />
      <BacklinksSection entityType="profile" entityId={id} />

      <div className="flex gap-4">
        <Link href="/profile" className="btn-secondary">
          ← 返回个人档案列表
        </Link>
      </div>
    </div>
  );
}
