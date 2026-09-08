import { Suspense } from 'react';
import { PageHeader } from '@/components/ui';
import { GraphHub } from './GraphHub';

export default function GraphPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="图谱" description="证据链、知识树、人脉网络三合一可视化" />
      <Suspense fallback={<div className="text-gray-500">加载中...</div>}>
        <GraphHub />
      </Suspense>
    </div>
  );
}