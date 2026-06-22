import { Cinzel, Libre_Baskerville } from 'next/font/google';
import RsvpForm from './RsvpForm';
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

export default async function RsvpPage() {
  // Reuse the same background + text color as the guest page
  let bgColor = '#632025';
  let bgImage: string | null = null;
  let textColor = '#f5f0e8';
  try {
    const rows = await sql`SELECT key, value FROM page_content`;
    const content: Record<string, string> = {};
    for (const row of rows) content[row.key] = row.value;
    textColor = content.text_color ?? textColor;
    if (content.background_type === 'image' && content.background_value) {
      bgImage = content.background_value;
    } else if (content.background_value) {
      bgColor = content.background_value;
    }
  } catch {}

  const bgStyle = bgImage
    ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: bgColor };

  return (
    <div className={`${cinzel.variable} ${baskerville.variable}`} style={bgStyle}>
      <RsvpForm textColor={textColor} />
    </div>
  );
}
