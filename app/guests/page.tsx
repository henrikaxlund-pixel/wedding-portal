import GuestPageClient from '@/components/GuestPageClient';
import { auth } from '@/auth';

export default async function GuestPage() {
  const session = await auth();
  const isEditor = !!(session?.user);

  // Fetch initial content server-side
  const res = await fetch(`${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/page-content`, { cache: 'no-store' });
  const content = await res.json();

  return <GuestPageClient initialContent={content} isEditor={isEditor} />;
}
