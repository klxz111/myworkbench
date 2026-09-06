import { ReviewClient } from './ReviewClient';
import { PageHeader } from '@/components/ui';

export default function ReviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="每周回顾" description="本周发生了什么、哪些判断被验证、下周需要关注什么" />
      <ReviewClient />
    </div>
  );
}
