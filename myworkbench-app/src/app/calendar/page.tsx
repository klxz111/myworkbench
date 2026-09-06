import { PageHeader } from '@/components/ui';
import { CalendarClient } from './CalendarClient';

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="日历"
        description="任务截止、门控审核、人脉跟进、机会截止与事件的统一时间视图"
      />
      <CalendarClient />
    </div>
  );
}
