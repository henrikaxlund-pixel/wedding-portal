'use client';

import { useState } from 'react';

export default function RsvpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [response, setResponse] = useState<'accepted' | 'declined' | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!response) { setError('Please select yes or no.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email || null, response, message: message || null }),
      });
      if (!res.ok) throw new Error('Something went wrong.');
      setDone(true);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="text-5xl">{response === 'accepted' ? '🥂' : '💌'}</div>
          <h1 className="text-2xl font-semibold text-stone-800">
            {response === 'accepted' ? 'See you there!' : 'Thanks for letting us know'}
          </h1>
          <p className="text-stone-600 text-sm">
            {response === 'accepted'
              ? `We're so happy you can join us, ${name.split(' ')[0]}! We'll be in touch with more details closer to the day.`
              : `Thank you for letting us know, ${name.split(' ')[0]}. You'll be missed!`}
          </p>
          <p className="text-stone-400 text-xs pt-4">Riina & Henrik · 21 December 2026 · Helsinki</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">💍</div>
          <h1 className="text-2xl font-semibold text-stone-800">Riina & Henrik</h1>
          <p className="text-stone-600 text-sm mt-1">21 December 2026 · Helsinki</p>
          <p className="text-stone-700 mt-4 text-base">We'd love to know if you can join us.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-2xl shadow-sm p-8 space-y-6">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Your name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="First and last name"
              className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          {/* Yes / No */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Will you be joining us?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResponse('accepted')}
                className={`py-3 rounded-xl border-2 text-sm font-semibold transition ${
                  response === 'accepted'
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-white border-stone-200 text-stone-700 hover:border-emerald-300'
                }`}
              >
                🥂 Yes, I'll be there!
              </button>
              <button
                type="button"
                onClick={() => setResponse('declined')}
                className={`py-3 rounded-xl border-2 text-sm font-semibold transition ${
                  response === 'declined'
                    ? 'bg-stone-700 border-stone-700 text-white'
                    : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'
                }`}
              >
                💌 Sorry, I can't
              </button>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Email <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Message <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Anything you'd like us to know…"
              rows={3}
              className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !name.trim() || !response}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3 font-semibold transition disabled:opacity-40"
          >
            {submitting ? 'Sending…' : 'Send RSVP'}
          </button>
        </form>
      </div>
    </main>
  );
}
