import { Suspense } from 'react';
import { GenericEditClient } from './GenericEditClient';

export const dynamic = 'force-dynamic';

export default async function GenericEditPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit {type.charAt(0).toUpperCase() + type.slice(1)}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Update {type} details
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading edit form...</div>}>
        <GenericEditClient type={type} id={id} />
      </Suspense>
    </div>
  );
}
