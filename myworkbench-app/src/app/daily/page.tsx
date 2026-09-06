import { DailyClient } from './DailyClient';
import { PageHeader } from '@/components/ui';

export default function DailyPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="每日笔记" description="每天一页：捕获想法、记录事件与决策" />
      <DailyClient />
    </div>
  );
}
