'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import GuestCountBadge from './GuestCountBadge';
import NavCountdown from './NavCountdown';

interface NavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-stone-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="text-lg font-semibold text-stone-800">💍 R & H</span>
        <div className="flex gap-4 text-sm">
          <Link href="/planning" className="text-stone-700 hover:text-emerald-500 font-medium transition">
            Planning
          </Link>
          <Link href="/planning/guests" className="text-stone-700 hover:text-emerald-500 font-medium transition">
            Guests
          </Link>
          <Link href="/planning/program" className="text-stone-700 hover:text-emerald-500 font-medium transition">
            Program
          </Link>
          <Link href="/guests" className="text-stone-400 hover:text-emerald-500 transition">
            Guest Page
          </Link>
          {(user as any)?.role === 'admin' && (
            <Link href="/admin/users" className="text-stone-400 hover:text-emerald-500 transition">
              Users
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NavCountdown />
        <GuestCountBadge />
        <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 text-sm text-stone-700 hover:text-stone-900 transition"
        >
          {user?.image ? (
            <img src={user.image} className="w-7 h-7 rounded-full" alt="" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
              {user?.name?.[0] ?? user?.email?.[0] ?? '?'}
            </div>
          )}
          <span className="hidden sm:block">{user?.name ?? user?.email}</span>
          <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-stone-200 rounded-xl shadow-md z-50 py-1">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition"
            >
              Sign out
            </button>
          </div>
        )}
        </div>
      </div>
    </nav>
  );
}
