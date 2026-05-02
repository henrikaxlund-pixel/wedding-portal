'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function GuestCountBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/guests/count')
      .then(r => r.json())
      .then(d => setCount(d.count));
  }, []);

  if (count === null) return null;

  return (
    <Link
      href="/planning/guests"
      className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-emerald-100 transition"
    >
      🥳 {count} confirmed
    </Link>
  );
}
