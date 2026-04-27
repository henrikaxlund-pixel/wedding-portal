'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  created_at: string;
}

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'helper' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(u => { setUsers(u); setLoading(false); });
  }, []);

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Failed to create user');
    } else {
      const user = await res.json();
      setUsers(prev => [...prev, user]);
      setForm({ name: '', email: '', password: '', role: 'helper' });
      setShowForm(false);
    }
    setSubmitting(false);
  }

  async function removeUser(id: string, email: string) {
    if (!confirm(`Remove ${email}?`)) return;
    await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  if (loading) return <div className="text-stone-400">Loading…</div>;

  return (
    <div className="space-y-4">
      {/* User list */}
      <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
        {users.length === 0 && (
          <p className="text-stone-400 text-sm px-5 py-4">No users yet.</p>
        )}
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-3 px-5 py-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
              {u.image
                ? <img src={u.image} className="w-full h-full object-cover" alt="" />
                : (u.name?.[0] ?? u.email[0]).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">{u.name ?? '—'}</p>
              <p className="text-xs text-stone-400 truncate">{u.email}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-rose-100 text-rose-600' : 'bg-stone-100 text-stone-500'}`}>
              {u.role}
            </span>
            <button
              onClick={() => removeUser(u.id, u.email)}
              className="text-stone-300 hover:text-red-400 transition ml-2"
              title="Remove user"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add user form */}
      {showForm ? (
        <form onSubmit={addUser} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <h3 className="font-medium text-stone-800">Add a helper</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Role</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="helper">Helper</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Email *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="helper@example.com"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Password (leave blank if they use Google)</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-rose-500 hover:bg-rose-600 text-white text-sm px-4 py-2 rounded-xl font-medium transition disabled:opacity-50"
            >
              {submitting ? 'Adding…' : 'Add user'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm px-4 py-2 rounded-xl text-stone-500 hover:bg-stone-100 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm text-rose-500 hover:text-rose-600 font-medium transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add helper
        </button>
      )}
    </div>
  );
}
