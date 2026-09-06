import { PersonDetailClient } from './PersonDetailClient';

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PersonDetailClient id={id} />;
}
