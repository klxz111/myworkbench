import { OrganizationDetailClient } from './OrganizationDetailClient';

export default async function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrganizationDetailClient id={id} />;
}
