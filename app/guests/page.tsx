import GuestPageClient from '@/components/GuestPageClient';
import { auth } from '@/auth';
import { Cinzel, Libre_Baskerville } from 'next/font/google';

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
});

const baskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-baskerville',
  display: 'swap',
});

export default async function GuestPage() {
  let isEditor = false;
  try {
    const session = await auth();
    isEditor = !!(session?.user);
  } catch {}

  let content: Record<string, string> = {};
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/page-content`, { cache: 'no-store' });
    content = await res.json();
  } catch {}

  return (
    <div className={`${cinzel.variable} ${baskerville.variable}`}>
      <GuestPageClient initialContent={content} isEditor={isEditor} />
    </div>
  );
}
