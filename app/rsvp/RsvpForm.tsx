'use client';

import { useState } from 'react';

export default function RsvpForm({ textColor = '#f5f0e8' }: { textColor?: string }) {
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

  const inputCls = "w-full bg-white/10 border border-white/20 px-4 py-3 placeholder:opacity-30 focus:outline-none focus:border-white/50";

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="text-5xl">{response === 'accepted' ? '🥂' : '💌'}</div>
          <h1
            className="text-2xl tracking-widest uppercase"
            style={{ color: textColor, fontFamily: 'var(--font-cinzel)' }}
          >
            {response === 'accepted' ? 'See you there' : 'Until next time'}
          </h1>
          <p
            className="text-base italic leading-relaxed opacity-75"
            style={{ color: textColor, fontFamily: 'var(--font-baskerville)' }}
          >
            {response === 'accepted'
              ? `We're so happy you can join us, ${name.split(' ')[0]}. We'll be in touch with more details closer to the day.`
              : `Thank you for letting us know, ${name.split(' ')[0]}. You'll be missed.`}
          </p>
          <p
            className="text-sm pt-4 tracking-widest uppercase opacity-50"
            style={{ color: textColor, fontFamily: 'var(--font-cinzel)' }}
          >
            Riina & Henrik · 21 Dec 2026
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="text-2xl tracking-[0.3em] uppercase"
            style={{ color: textColor, fontFamily: 'var(--font-cinzel)' }}
          >
            Riina & Henrik
          </h1>
          <p
            className="text-sm mt-2 tracking-widest uppercase opacity-60"
            style={{ color: textColor, fontFamily: 'var(--font-cinzel)' }}
          >
            21 December 2026 · Helsinki
          </p>
          <div className="w-16 h-px mx-auto mt-5 mb-5 opacity-30" style={{ backgroundColor: textColor }} />
          <p
            className="text-base italic opacity-70"
            style={{ color: textColor, fontFamily: 'var(--font-baskerville)' }}
          >
            We'd love to know if you can join us.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Name */}
          <div>
            <label
              className="block text-xs tracking-widest uppercase mb-2 opacity-60"
              style={{ color: textColor, fontFamily: 'var(--font-cinzel)' }}
            >
              Your name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="First and last name"
              className={inputCls}
              style={{ color: textColor, fontFamily: 'var(--font-baskerville)' }}
            />
          </div>

          {/* Yes / No */}
          <div>
            <label
              className="block text-xs tracking-widest uppercase mb-2 opacity-60"
              style={{ color: textColor, fontFamily: 'var(--font-cinzel)' }}
            >
              Will you be joining us?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResponse('accepted')}
                className={`py-3 border-2 text-sm font-medium transition ${
                  response === 'accepted' ? 'bg-white/20 border-white/70' : 'bg-transparent border-white/20 hover:border-white/40'
                }`}
                style={{ color: textColor, fontFamily: 'var(--font-baskerville)' }}
              >
                🥂 Yes, I'll be there
              </button>
              <button
                type="button"
                onClick={() => setResponse('declined')}
                className={`py-3 border-2 text-sm font-medium transition ${
                  response === 'declined' ? 'bg-white/20 border-white/70' : 'bg-transparent border-white/20 hover:border-white/40'
                }`}
                style={{ color: textColor, fontFamily: 'var(--font-baskerville)' }}
              >
                💌 Sorry, I can't
              </button>
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              className="block text-xs tracking-widest uppercase mb-2 opacity-60"
              style={{ color: textColor, fontFamily: 'var(--font-cinzel)' }}
            >
              Email{' '}
              <span className="normal-case tracking-normal opacity-60" style={{ fontFamily: 'var(--font-baskerville)' }}>
                (optional)
              </span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
              style={{ color: textColor, fontFamily: 'var(--font-baskerville)' }}
            />
          </div>

          {/* Message */}
          <div>
            <label
              className="block text-xs tracking-widest uppercase mb-2 opacity-60"
              style={{ color: textColor, fontFamily: 'var(--font-cinzel)' }}
            >
              Message{' '}
              <span className="normal-case tracking-normal opacity-60" style={{ fontFamily: 'var(--font-baskerville)' }}>
                (optional)
              </span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Anything you'd like us to know…"
              rows={3}
              className={`${inputCls} resize-none`}
              style={{ color: textColor, fontFamily: 'var(--font-baskerville)' }}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm italic" style={{ fontFamily: 'var(--font-baskerville)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim() || !response}
            className="w-full border border-white/40 hover:bg-white/10 py-3 transition disabled:opacity-40 tracking-widest uppercase text-sm"
            style={{ color: textColor, fontFamily: 'var(--font-cinzel)' }}
          >
            {submitting ? 'Sending…' : 'Send RSVP'}
          </button>
        </form>
      </div>
    </main>
  );
}
