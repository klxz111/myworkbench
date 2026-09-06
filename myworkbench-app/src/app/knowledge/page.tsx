import { PageHeader } from '@/components/ui';
import { KnowledgeClient } from './KnowledgeClient';

export default function KnowledgePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="知识树" description="智源 AI 知识树——16 大领域、300+ 研究方向的热度版图，标注你的研究定位" />
      <KnowledgeClient />
    </div>
  );
}
