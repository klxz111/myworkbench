import { Suspense } from 'react';
import { GenericCreateClient } from './GenericCreateClient';

export const dynamic = 'force-dynamic';

export default async function GenericCreatePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            New {type.charAt(0).toUpperCase() + type.slice(1)}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create a new {type}
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading create form...</div>}>
        <GenericCreateClient type={type} />
      </Suspense>
    </div>
  );
}
