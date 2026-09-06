import { IdeaDetailClient } from './IdeaDetailClient';

export const dynamic = 'force-dynamic';

export default async function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <IdeaDetailClient id={id} />;
}
