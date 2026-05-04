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
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'dearest' | 'admin'>('dearest');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError('');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: name || null, role }),
    });
    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? 'Failed to add user');
    } else {
      const user = await res.json();
      setUsers(prev => [...prev, user]);
      setEmail('');
      setName('');
      setRole('dearest');
    }
    setAdding(false);
  }

  async function removeUser(id: string) {
    if (!confirm('Remove this user? They will no longer be able to sign in.')) return;
    await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  return (
    <div className="space-y-6">

      {/* Add user form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="font-semibold text-stone-800 mb-4">Add person</h2>
        <form onSubmit={addUser} className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 min-w-40 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name (optional)"
              className="flex-1 min-w-40 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <select
              value={role}
              onChange={e => setRole(e.target.value as any)}
              className="border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <option value="dearest">Dearest</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={adding}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-xl font-medium transition disabled:opacity-50 shrink-0"
            >
              {adding ? 'Addingâ€¦' : 'Add'}
            </button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <p className="text-xs text-stone-600">
            They can sign in with Google once added. Status shows "Signed in" after their first login.
          </p>
        </form>
      </div>

      {/* User list */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-100 bg-stone-50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-stone-700 uppercase tracking-wide">Person</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-stone-700 uppercase tracking-wide">Role</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-stone-700 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-stone-50 transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {u.image
                      ? <img src={u.image} className="w-8 h-8 rounded-full object-cover" alt="" />
                      : (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                          {(u.name ?? u.email)[0].toUpperCase()}
                        </div>
                      )
                    }
                    <div>
                      <div className="font-medium text-stone-800">
                        {u.name ?? <span className="text-stone-600 italic">No name yet</span>}
                      </div>
                      <div className="text-stone-600 text-xs">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-700'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    u.image ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {u.image ? 'Signed in' : 'Pending'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => removeUser(u.id)}
                    className="text-stone-300 hover:text-red-400 transition"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-stone-600 text-sm">No users yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
