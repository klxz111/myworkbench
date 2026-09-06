import { EventEditClient } from './EventEditClient';

export default async function EventEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventEditClient id={id} />;
}
