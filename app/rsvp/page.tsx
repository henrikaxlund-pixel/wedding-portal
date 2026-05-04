import { Cinzel, Libre_Baskerville } from 'next/font/google';
import RsvpForm from './RsvpForm';

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
  let bgColor = '#1a1a2e';
  let bgImage: string | null = null;
  let textColor = '#f5f0e8';
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/page-content`, { cache: 'no-store' });
    const content = await res.json();
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
