import { GenericEditClient } from '@/components/GenericEditClient';

export default async function EditOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GenericEditClient type="organization" id={id} />;
}
