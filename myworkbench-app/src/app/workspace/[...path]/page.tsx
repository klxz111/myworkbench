import { Suspense } from 'react';
import Link from 'next/link';
import { MarkdownEditor } from '../_components/MarkdownEditor';

interface WorkspaceFilePageProps {
  params: Promise<{ path: string[] }>;
}

export default async function WorkspaceFilePage({ params }: WorkspaceFilePageProps) {
  const { path: pathSegments } = await params;
  const filePath = pathSegments.join('/');

  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = `/workspace/${pathSegments.slice(0, index + 1).join('/')}`;
    return { label: segment, href, isLast: index === pathSegments.length - 1 };
  });

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/workspace" className="hover:text-gray-700 dark:hover:text-gray-300">工作台</Link>
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center gap-2">
            <span>/</span>
            {crumb.isLast ? (
              <span className="text-gray-900 dark:text-white font-medium">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-gray-700 dark:hover:text-gray-300">{crumb.label}</Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {filePath}
        </h1>
      </div>
      <Suspense fallback={<div className="text-gray-500">加载编辑器...</div>}>
        <MarkdownEditor filePath={filePath} />
      </Suspense>
    </div>
  );
}
