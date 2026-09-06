import { PageHeader } from '@/components/ui';
import { NetworkClient } from './NetworkClient';

export default function NetworkPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="人脉网络" description="人员、组织与关系网络——申请硕博的版图视图" />
      <NetworkClient />
    </div>
  );
}
