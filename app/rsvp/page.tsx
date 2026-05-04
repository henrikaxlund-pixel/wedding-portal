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

export default function RsvpPage() {
  return (
    <div className={`${cinzel.variable} ${baskerville.variable}`}>
      <RsvpForm />
    </div>
  );
}
