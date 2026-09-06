import { ResearchDetailClient } from './ResearchDetailClient';

export default async function ResearchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResearchDetailClient id={id} />;
}
