import GuestPageClient from '@/components/GuestPageClient';
import { auth } from '@/auth';
import { Cinzel, Libre_Baskerville } from 'next/font/google';
import sql from '@/lib/db';

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

  const DEFAULTS: Record<string, string> = {
    hero_title:       'Riina & Henrik',
    hero_subtitle:    'Winter Solstice · 21 December 2026 · Helsinki',
    hero_body:        'Join us as we celebrate the longest night of the year.',
    background_type:  'color',
    background_value: '#1a1a2e',
    text_color:       '#f5f0e8',
    modules:          '[]',
  };
  let content: Record<string, string> = { ...DEFAULTS };
  try {
    const rows = await sql`SELECT key, value FROM page_content`;
    for (const row of rows) content[row.key] = row.value;
  } catch {}

  return (
    <div className={`${cinzel.variable} ${baskerville.variable}`}>
      <GuestPageClient initialContent={content} isEditor={isEditor} />
    </div>
  );
}
