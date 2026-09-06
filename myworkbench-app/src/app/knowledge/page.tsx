import { KnowledgeClient } from './KnowledgeClient';

export default function KnowledgePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          KNOWLEDGE TREE
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          智源 AI 知识树——16 大领域、300+ 研究方向的热度版图，标注你的研究定位
        </p>
      </div>
      <KnowledgeClient />
    </div>
  );
}
