import { GenericDetailClient } from '@/components/GenericDetailClient';

export default async function EntityDetailPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  return <GenericDetailClient entityType={type} id={id} />;
}
