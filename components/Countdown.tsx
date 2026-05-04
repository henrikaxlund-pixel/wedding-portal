'use client';

import { useEffect, useState } from 'react';

// Winter Solstice 2026 Helsinki — Dec 21 22:50 local (UTC+2) = 20:50 UTC
const TARGET = new Date('2026-12-21T20:50:00Z');

function getTimeLeft() {
  const diff = TARGET.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true };
  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, past: false };
}

interface Props {
  textColor?: string;
}

export default function Countdown({ textColor = '#f5f0e8' }: Props) {
  const [time, setTime] = useState(getTimeLeft());

  useEffect(() => {
    const t = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(t);
  }, []);

  if (time.past) return (
    <div className="text-center py-8" style={{ color: textColor }}>
      <p className="text-4xl font-bold">🌙 The solstice is here!</p>
    </div>
  );

  const units = [
    { label: 'Days',    value: time.days },
    { label: 'Hours',   value: time.hours },
    { label: 'Minutes', value: time.minutes },
    { label: 'Seconds', value: time.seconds },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
      {units.map(u => (
        <div key={u.label} className="flex flex-col items-center">
          <span
            className="text-3xl sm:text-4xl font-bold tabular-nums leading-none"
            style={{ color: textColor, fontFamily: 'var(--font-cinzel)' }}
          >
            {String(u.value).padStart(2, '0')}
          </span>
          <span
            className="text-xs uppercase tracking-widest mt-2 opacity-60"
            style={{ color: textColor, fontFamily: 'var(--font-cinzel)' }}
          >
            {u.label}
          </span>
        </div>
      ))}
    </div>
  );
}
