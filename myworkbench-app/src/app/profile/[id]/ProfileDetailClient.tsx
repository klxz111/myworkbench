'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DetailShell } from '@/components/DetailShell';
import { ProfileVersionsPanel } from './ProfileVersionsPanel';

interface Profile {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  created_at: string;
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
        <Link href="/profile" className="mt-4 inline-block text-accent-600 dark:text-accent-400 hover:underline">
          ← 返回个人档案列表
        </Link>
      </div>
    );
  }

  return (
    <DetailShell entityType="profile" id={id} title={profile.title} status={profile.status}
      tags={profile.tags || []} created_at={profile.created_at || ''} updated_at={profile.updated_at}
      listPath="/profile" editHref={`/entities/profile/${id}/edit`} onDelete={handleDelete} deleting={deleting}
      frontmatter={profile as unknown as Record<string, unknown>}>
      <ProfileVersionsPanel profileId={id} />
    </DetailShell>
  );
}
