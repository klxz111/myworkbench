import { StatsClient } from './StatsClient';
import { PageHeader } from '@/components/ui';

export default function StatsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="统计分析" description="实体构成、资本趋势、决策判定与活动热力" />
      <StatsClient />
    </div>
  );
}
