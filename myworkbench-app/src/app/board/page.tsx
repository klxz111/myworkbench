import { BoardClient } from './BoardClient';
import { PageHeader } from '@/components/ui';

export default function BoardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="看板" description="任务、项目、机会与实验的状态视图" />
      <BoardClient />
    </div>
  );
}
