import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { TasksClient } from './TasksClient';

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="任务"
        description="追踪下一步行动：待办、进行中与已完成"
        actions={
          <Link href="/entities/task/new" className="btn-primary">
            新建任务
          </Link>
        }
      />
      <TasksClient />
    </div>
  );
}
