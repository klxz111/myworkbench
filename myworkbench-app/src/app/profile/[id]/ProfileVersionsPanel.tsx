'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const TYPE_PATHS: Record<string, string> = {
  research: '/research',
  project: '/projects',
  experiment: '/experiment',
  belief: '/belief',
  opportunity: '/opportunity',
  radar: '/radar',
  decision: '/decisions',
  person: '/people',
  capital: '/capital',
  evidence: '/evidence',
  event: '/events',
  organization: '/organizations',
  strategy: '/strategy',
};

interface Highlight {
  text: string;
  refs: { id: string; type: string; title: string }[];
}

interface CompiledVersion {
  key: string;
  label: string;
  title: string;
  description: string;
  target_audience: string;
  summary: string;
  highlights: Highlight[];
  stats: { label: string; value: number }[];
  compiled_from: string[];
  compiled_at: string;
}

const TAB_COLORS: Record<string, string> = {
  academic: 'bg-indigo-600 text-white',
  mlsys: 'bg-cyan-600 text-white',
  industry: 'bg-emerald-600 text-white',
  bold: 'bg-amber-600 text-white',
};

export function ProfileVersionsPanel({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('academic');
  const [compiled, setCompiled] = useState<Record<string, CompiledVersion> | null>(null);
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCompiledAt, setLastCompiledAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profile/compile');
      if (!res.ok) throw new Error('编译请求失败');
      const data = await res.json();
      setCompiled(data.compiled);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载编译结果失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCompile = async () => {
    setCompiling(true);
    setError(null);
    try {
      const res = await fetch('/api/profile/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '编译失败');
      setCompiled(data.compiled);
      setLastCompiledAt(data.last_compiled);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '编译失败');
    } finally {
      setCompiling(false);
    }
  };

  const current = compiled?.[activeTab];

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 pt-5 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            多版本投影（Profile Compiler）
          </h3>
          <button
            onClick={handleCompile}
            disabled={compiling || loading}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {compiling ? '编译中...' : '重新编译并写回档案'}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          四个受众投影由实体数据实时编译；写回后同步更新档案 frontmatter 的 versions 字段。
          {lastCompiledAt && <span> 最近写回：{lastCompiledAt}</span>}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['academic', 'mlsys', 'industry', 'bold'].map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === key
                  ? TAB_COLORS[key]
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {key === 'academic' ? 'Academic' : key === 'mlsys' ? 'MLSys' : key === 'industry' ? 'Industry' : 'BOLD'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {loading && <p className="text-sm text-gray-500">编译中...</p>}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}
        {!loading && current && (
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">{current.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{current.description}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                目标受众：{current.target_audience}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">{current.summary}</p>
            </div>

            {current.stats.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {current.stats.map((s) => (
                  <div
                    key={s.label}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-center min-w-[90px]"
                  >
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">亮点</h5>
              {current.highlights.length === 0 ? (
                <p className="text-sm text-gray-500">暂无可编译的亮点数据。</p>
              ) : (
                <ul className="space-y-2">
                  {current.highlights.map((h, i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      <span>
                        {h.text}
                        {h.refs && h.refs.length > 0 && (
                          <span className="ml-2 inline-flex flex-wrap gap-1">
                            {h.refs.map((r) => (
                              <a
                                key={r.id}
                                href={`${TYPE_PATHS[r.type] || '/entities'}/${r.id}`}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                [{r.title}]
                              </a>
                            ))}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
              编译来源：{current.compiled_from.length} 个实体 · 编译时间：{new Date(current.compiled_at).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
