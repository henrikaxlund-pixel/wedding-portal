'use client';

import { useEffect, useState } from 'react';
import type { Guest } from './GuestList';

interface Submission {
  id: string;
  submitted_name: string;
  submitted_email: string | null;
  response: 'accepted' | 'declined';
  avec_name: string | null;
  message: string | null;
  submitted_at: string;
  matched_guest_id: string | null;
  match_type: 'auto' | 'manual' | null;
  guest_name: string | null;
}

export default function RsvpSubmissions({ guests }: { guests: Guest[] }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);
  const [matchSelections, setMatchSelections] = useState<Record<string, string>>({});
  const [matching, setMatching] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/rsvp')
      .then(r => r.json())
      .then(data => { setSubmissions(data); setLoading(false); });
  }, []);

  const unmatched = submissions.filter(s => !s.matched_guest_id);
  const matched   = submissions.filter(s =>  s.matched_guest_id);

  async function matchSubmission(submission: Submission) {
    const guestId = matchSelections[submission.id];
    if (!guestId) return;
    setMatching(submission.id);
    const res = await fetch(`/api/rsvp/${submission.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matched_guest_id: guestId }),
    });
    const updated = await res.json();
    setSubmissions(prev => prev.map(s => s.id === updated.id ? updated : s));
    setMatching(null);
  }

  async function deleteSubmission(id: string) {
    if (!confirm('Delete this submission?')) return;
    await fetch(`/api/rsvp/${id}`, { method: 'DELETE' });
    setSubmissions(prev => prev.filter(s => s.id !== id));
  }

  if (loading) return null;
  if (submissions.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Header bar */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-white border border-stone-200 rounded-2xl px-5 py-3.5 hover:bg-stone-50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-stone-800">RSVP Submissions</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-stone-100 text-stone-700">
            {submissions.length} total
          </span>
          {unmatched.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
              ⚠ {unmatched.length} need{unmatched.length === 1 ? 's' : ''} matching
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-stone-600 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 space-y-4">

          {/* Unmatched submissions */}
          {unmatched.length > 0 && (
            <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-amber-100 bg-amber-50">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">⚠ Needs matching</p>
              </div>
              <div className="divide-y divide-stone-100">
                {unmatched.map(s => (
                  <div key={s.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                    {/* Submission info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-stone-800">{s.submitted_name}</span>
                        <ResponseBadge response={s.response} />
                      </div>
                      {s.submitted_email && (
                        <p className="text-xs text-stone-600 mt-0.5">{s.submitted_email}</p>
                      )}
                      {s.avec_name && (
                        <p className="text-xs text-stone-500 mt-0.5">+ {s.avec_name}</p>
                      )}
                      {s.message && (
                        <p className="text-sm text-stone-700 mt-1 italic">"{s.message}"</p>
                      )}
                      <p className="text-xs text-stone-400 mt-1">{formatDate(s.submitted_at)}</p>
                    </div>

                    {/* Match controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={matchSelections[s.id] ?? ''}
                        onChange={e => setMatchSelections(prev => ({ ...prev, [s.id]: e.target.value }))}
                        className="border border-stone-300 rounded-xl px-3 py-1.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-300 max-w-[200px]"
                      >
                        <option value="">Match to guest…</option>
                        {guests.sort((a, b) => a.name.localeCompare(b.name)).map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => matchSubmission(s)}
                        disabled={!matchSelections[s.id] || matching === s.id}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-3 py-1.5 rounded-xl font-medium transition disabled:opacity-40"
                      >
                        {matching === s.id ? '…' : 'Match'}
                      </button>
                      <button
                        onClick={() => deleteSubmission(s.id)}
                        className="text-stone-300 hover:text-red-400 transition p-1"
                        title="Delete submission"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched submissions */}
          {matched.length > 0 && (
            <details className="group" open>
              <summary className="cursor-pointer text-xs text-stone-600 font-medium px-1 py-1 hover:text-stone-800 list-none flex items-center gap-1">
                <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {matched.length} matched submission{matched.length !== 1 ? 's' : ''}
              </summary>
              <div className="mt-2 bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100 overflow-hidden">
                {matched.map(s => (
                  <div key={s.id} className="px-5 py-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <ResponseBadge response={s.response} />
                      <span className="text-sm font-medium text-stone-800">{s.submitted_name}</span>
                      <span className="text-stone-300 text-xs">→</span>
                      <span className="text-sm text-stone-600">{s.guest_name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
                        {s.match_type}
                      </span>
                      <span className="text-xs text-stone-400 ml-auto">{formatDate(s.submitted_at)}</span>
                      <button
                        onClick={() => deleteSubmission(s.id)}
                        className="text-stone-300 hover:text-red-400 transition"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {s.avec_name && (
                      <p className="mt-1 text-xs text-stone-500 pl-1">+ {s.avec_name}</p>
                    )}
                    {s.message && (
                      <p className="mt-2 text-sm text-stone-600 italic border-l-2 border-stone-200 pl-3">"{s.message}"</p>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}

        </div>
      )}
    </div>
  );
}

function ResponseBadge({ response }: { response: 'accepted' | 'declined' }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      response === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'
    }`}>
      {response === 'accepted' ? '✓ Coming' : '✗ Not coming'}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}
