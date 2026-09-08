import { redirect } from 'next/navigation';

export default function NetworkPage() {
  redirect('/graph?view=talent');
}