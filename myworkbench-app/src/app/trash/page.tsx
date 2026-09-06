import { PageHeader } from '@/components/ui';
import { DataManagement } from '@/components/DataManagement';
import { TrashClient } from './TrashClient';

export default function TrashPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="回收站"
        description="已删除的实体保留在 entities/.trash/ 中，可恢复或彻底删除"
      />
      <TrashClient />
      <DataManagement />
    </div>
  );
}
