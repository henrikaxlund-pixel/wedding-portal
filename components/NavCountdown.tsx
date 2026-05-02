'use client';

import { useEffect, useState } from 'react';

// Winter Solstice 2026 Helsinki — Dec 21 22:50 local (UTC+2) = 20:50 UTC
const TARGET = new Date('2026-12-21T20:50:00Z');

function getDaysLeft() {
  const diff = TARGET.getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function NavCountdown() {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    setDays(getDaysLeft());
    const t = setInterval(() => setDays(getDaysLeft()), 60000);
    return () => clearInterval(t);
  }, []);

  if (days === null) return null;

  return (
    <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200 text-stone-600 text-xs font-semibold px-2.5 py-1 rounded-full" title="Days until Winter Solstice 2026">
      🌙 {days}d
    </div>
  );
}
