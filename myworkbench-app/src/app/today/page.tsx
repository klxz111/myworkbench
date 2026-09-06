import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { TodayClient } from './TodayClient';

export default function TodayPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="今日"
        description="逾期、今日到期、未来安排与进行中的任务——每天从这里开始"
        actions={
          <Link href="/calendar" className="btn-ghost">
            日历视图
          </Link>
        }
      />
      <TodayClient />
    </div>
  );
}
