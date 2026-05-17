'use client';

import { useEffect, useState } from 'react';

interface Recipient {
  name: string;
  email: string;
}

export default function EmailComposer() {
  const [open, setOpen] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number; errors: string[] } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/email').then(r => r.json()).then(setRecipients);
  }, []);

  async function send() {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    setError('');
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setResult(data);
      setSubject('');
      setBody('');
    } catch {
      setError('Something went wrong.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-white border border-stone-200 rounded-2xl px-5 py-3.5 hover:bg-stone-50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-stone-800">Email guests</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-stone-100 text-stone-700">
            {recipients.length} confirmed with email
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-stone-600 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 bg-white border border-stone-200 rounded-2xl p-5 space-y-4">

          {/* Recipient list */}
          <details className="group">
            <summary className="cursor-pointer text-xs text-stone-500 hover:text-stone-800 list-none flex items-center gap-1">
              <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Show recipients
            </summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {recipients.map(r => (
                <span key={r.email} className="text-xs bg-stone-100 text-stone-700 px-2 py-1 rounded-lg">
                  {r.name}
                </span>
              ))}
            </div>
          </details>

          {/* Subject */}
          <div>
            <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Wedding details — 21 Dec 2026"
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-1">Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={8}
              placeholder="Dear guests,&#10;&#10;..."
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-y"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {result && (
            <p className="text-emerald-700 text-sm font-medium">
              Sent to {result.sent} of {result.total} guests.
              {result.errors.length > 0 && (
                <span className="text-amber-600 ml-2">{result.errors.length} failed.</span>
              )}
            </p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-400">Sends from henrik.axlund@gmail.com</p>
            <button
              onClick={send}
              disabled={sending || !subject.trim() || !body.trim() || recipients.length === 0}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-5 py-2 rounded-xl font-medium transition disabled:opacity-40"
            >
              {sending ? 'Sending…' : `Send to ${recipients.length} guests`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
