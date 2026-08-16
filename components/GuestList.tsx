'use client';

import { useEffect, useState } from 'react';
import RsvpSubmissions from './RsvpSubmissions';

export interface Guest {
  id: string;
  name: string;
  side: 'henrik' | 'riina';
  std_sent: number;
  invited: number;
  answered: string | null;
  avec_offered: number;
  avec: string | null;
  rsvp_by: string | null;
  table_no: string | null;
  dietary_restrictions: string | null;
  notes: string | null;
  family_group: string | null;
}

const FAMILY_GROUPS: { value: string; label: string; color: string }[] = [
  { value: 'riina_family', label: "Riina's family", color: 'bg-pink-100 text-pink-700' },
  { value: 'henrik_family', label: "Henrik's family", color: 'bg-sky-100 text-sky-700' },
];

// Sentinel for "no answer" filter (answered === null)
const FILTER_NONE = '__none__';

type EditingField = { guestId: string; field: keyof Guest } | null;

export default function GuestList() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: '', side: 'riina' as 'henrik' | 'riina' });
  const [addingAvecFor, setAddingAvecFor] = useState<string | null>(null);
  const [newAvecName, setNewAvecName] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/guests')
      .then(r => r.json())
      .then(g => { setGuests(Array.isArray(g) ? g : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const byName = (a: Guest, b: Guest) => a.name.localeCompare(b.name);

  const totalInvited  = guests.filter(g => g.invited).length;
  const totalAccepted = guests.filter(g => g.answered === 'accepted').length;
  const totalDeclined = guests.filter(g => g.answered === 'declined').length;
  const totalNoAnswer = guests.filter(g => !g.answered).length;

  function toggleFilter(value: string) {
    setStatusFilter(prev => prev === value ? null : value);
  }

  function matchesFilter(guest: Guest): boolean {
    if (statusFilter === null) return true;
    if (statusFilter === FILTER_NONE) return !guest.answered;
    return guest.answered === statusFilter;
  }

  function toggleCollapse(key: string) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function patchGuest(id: string, data: Partial<Guest>) {
    const res = await fetch(`/api/guests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setGuests(prev => prev.map(g => g.id === id ? updated : g));
  }

  async function toggleBoolean(guest: Guest, field: 'std_sent' | 'invited' | 'avec_offered') {
    await patchGuest(guest.id, { [field]: guest[field] ? 0 : 1 });
  }

  async function setRsvp(guest: Guest, value: string | null) {
    await patchGuest(guest.id, { answered: value as any });
  }

  async function switchSide(guest: Guest) {
    await patchGuest(guest.id, { side: guest.side === 'riina' ? 'henrik' : 'riina' });
  }

  async function cycleFamily(guest: Guest) {
    const correctGroup = guest.side === 'riina' ? 'riina_family' : 'henrik_family';
    const next = guest.family_group === correctGroup ? null : correctGroup;
    await patchGuest(guest.id, { family_group: next });
  }

  function startEdit(guest: Guest, field: keyof Guest) {
    setEditingField({ guestId: guest.id, field });
    setEditValue((guest[field] ?? '') as string);
  }

  async function commitEdit(guest: Guest) {
    if (!editingField) return;
    await patchGuest(guest.id, { [editingField.field]: editValue || null });
    setEditingField(null);
  }

  async function deleteGuest(guest: Guest) {
    if (!confirm(`Remove ${guest.name}?`)) return;
    const linked = guests.filter(g => g.id !== guest.id && g.avec === guest.name);
    for (const l of linked) await patchGuest(l.id, { avec: null });
    await fetch(`/api/guests/${guest.id}`, { method: 'DELETE' });
    setGuests(prev => prev.filter(g => g.id !== guest.id));
  }

  async function addGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!newGuest.name.trim()) return;
    const res = await fetch('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGuest),
    });
    const guest = await res.json();
    setGuests(prev => [...prev, guest]);
    setNewGuest({ name: '', side: 'henrik' });
    setShowAddForm(false);
  }

  async function addAvec(e: React.FormEvent, mainGuest: Guest) {
    e.preventDefault();
    const name = newAvecName.trim();
    if (!name) return;
    const res = await fetch('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, side: mainGuest.side, avec: mainGuest.name }),
    });
    const created = await res.json();
    await patchGuest(mainGuest.id, { avec: name });
    setGuests(prev => [...prev, created]);
    setAddingAvecFor(null);
    setNewAvecName('');
  }

  if (loading) return <div className="text-stone-600">Loading…</div>;

  const statCard = (label: string, count: number, filterKey: string, activeClass: string, inactiveClass: string) => {
    const isActive = statusFilter === filterKey;
    return (
      <button
        onClick={() => toggleFilter(filterKey)}
        className={`rounded-2xl px-5 py-4 text-center transition select-none border ${
          isActive ? activeClass : inactiveClass
        }`}
      >
        <p className={`text-4xl font-bold ${isActive ? '' : 'opacity-80'}`}>{count}</p>
        <p className="text-sm font-medium mt-1">{label}</p>
        {isActive && <p className="text-xs mt-1 opacity-70">click to clear</p>}
      </button>
    );
  };

  return (
    <div className="space-y-8">
      {/* Status filter cards */}
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {statCard('Coming', totalAccepted, 'accepted',
            'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-300 text-emerald-800',
            'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-300 cursor-pointer')}
          {statCard('Not coming', totalDeclined, 'declined',
            'bg-red-100 border-red-500 ring-2 ring-red-300 text-red-700',
            'bg-red-50 border-red-200 text-red-500 hover:border-red-300 cursor-pointer')}
          {statCard('No answer yet', totalNoAnswer, FILTER_NONE,
            'bg-stone-100 border-stone-500 ring-2 ring-stone-300 text-stone-700',
            'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300 cursor-pointer')}
        </div>
        <div className="flex gap-3 text-sm text-stone-400 px-1">
          <span>{guests.length} listed</span>
          <span>·</span>
          <span>{totalInvited} invited</span>
          {statusFilter && (
            <button onClick={() => setStatusFilter(null)} className="text-stone-400 hover:text-stone-700 underline ml-1">
              show all
            </button>
          )}
        </div>
      </div>

      {/* Add guest button */}
      <div className="flex justify-end">
        {showAddForm ? (
          <form onSubmit={addGuest} className="flex items-center gap-2 bg-white border border-stone-200 rounded-2xl px-4 py-2 shadow-sm">
            <input
              autoFocus
              value={newGuest.name}
              onChange={e => setNewGuest(f => ({ ...f, name: e.target.value }))}
              placeholder="Guest name"
              className="border border-stone-200 rounded-xl px-3 py-1.5 text-sm text-stone-900 bg-white placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 w-48"
            />
            <select
              value={newGuest.side}
              onChange={e => setNewGuest(f => ({ ...f, side: e.target.value as 'henrik' | 'riina' }))}
              className="border border-stone-200 rounded-xl px-3 py-1.5 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <option value="riina">Riina's side</option>
              <option value="henrik">Henrik's side</option>
            </select>
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-800 text-white text-sm px-3 py-1.5 rounded-xl transition">Add</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-sm text-stone-600 hover:text-stone-900 px-2">Cancel</button>
          </form>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 text-sm bg-emerald-500 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl transition font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add guest
          </button>
        )}
      </div>

      {/* Tables */}
      {[
        { label: "Riina's guests", side: 'riina' as const, familyLabel: "Riina's family", familyValue: 'riina_family' },
        { label: "Henrik's guests", side: 'henrik' as const, familyLabel: "Henrik's family", familyValue: 'henrik_family' },
      ].map(section => {
        const all = guests.filter(g => g.side === section.side).sort(byName);
        const familyAll  = all.filter(g => g.family_group === section.familyValue);
        const regularAll = all.filter(g => g.family_group !== section.familyValue);
        const family  = sortWithCouples(familyAll.filter(matchesFilter));
        const regular = sortWithCouples(regularAll.filter(matchesFilter));
        const visibleCount = family.length + regular.length;
        const pairColors = computePairColors(all);
        const sectionKey = section.side;
        const familyKey  = section.familyValue;
        const isSectionCollapsed = collapsed[sectionKey] ?? false;
        const isFamilyCollapsed  = collapsed[familyKey]  ?? false;

        const renderRows = (list: Guest[]) => list.map(guest => (
          <tr key={guest.id} className="hover:bg-stone-50 group">
            {/* Name */}
            <td className="px-4 py-2 font-medium text-stone-800 whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                {/* Couple indicator */}
                {guest.avec ? (
                  <span
                    title={`Avec: ${guest.avec}`}
                    className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${pairColors.get(guest.id) ?? 'bg-stone-300'}`}
                  />
                ) : (
                  <span className="flex-shrink-0 w-2.5" />
                )}
                <EditableCell
                  guest={guest} field="name" editingField={editingField}
                  editValue={editValue} setEditValue={setEditValue}
                  onStart={startEdit} onCommit={commitEdit}
                />
                {/* Family group tag */}
                {guest.family_group ? (
                  <button
                    onClick={() => cycleFamily(guest)}
                    title="Click to remove from family group"
                    className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-medium transition ${
                      FAMILY_GROUPS.find(f => f.value === guest.family_group)?.color ?? 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    Fam
                  </button>
                ) : (
                  <button
                    onClick={() => cycleFamily(guest)}
                    title="Add to family group"
                    className="ml-1 text-xs text-stone-300 hover:text-stone-600 opacity-0 group-hover:opacity-100 transition"
                  >fam</button>
                )}
                {/* Switch side button */}
                <button
                  onClick={() => switchSide(guest)}
                  title={`Move to ${guest.side === 'riina' ? "Henrik's" : "Riina's"} side`}
                  className="ml-1 text-xs text-stone-300 hover:text-violet-500 opacity-0 group-hover:opacity-100 transition"
                >
                  ⇄
                </button>
              </div>

              {/* Add avec */}
              {(!guest.avec || !guests.some(g => g.name === guest.avec)) && (
                <div className="ml-4 mt-0.5">
                  {addingAvecFor === guest.id ? (
                    <form
                      onSubmit={e => addAvec(e, guest)}
                      className="flex items-center gap-1.5"
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        autoFocus
                        value={newAvecName}
                        onChange={e => setNewAvecName(e.target.value)}
                        placeholder="Partner name…"
                        className="border border-emerald-300 rounded-lg px-2 py-0.5 text-xs text-stone-900 bg-white w-36 focus:outline-none focus:ring-1 focus:ring-emerald-300"
                      />
                      <button type="submit" className="text-xs text-emerald-600 hover:text-emerald-800 font-medium transition">Add</button>
                      <button
                        type="button"
                        onClick={() => { setAddingAvecFor(null); setNewAvecName(''); }}
                        className="text-xs text-stone-300 hover:text-stone-700 transition"
                      >✕</button>
                    </form>
                  ) : (
                    <button
                      onClick={() => { setAddingAvecFor(guest.id); setNewAvecName(''); }}
                      className="text-xs text-stone-300 hover:text-violet-500 transition opacity-0 group-hover:opacity-100 flex items-center gap-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      add avec
                    </button>
                  )}
                </div>
              )}
            </td>
            {/* Invited toggle */}
            <td className="px-2 py-2 text-center w-14">
              <button
                onClick={() => toggleBoolean(guest, 'invited')}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition ${
                  guest.invited ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300 hover:border-emerald-300'
                }`}
              >
                {guest.invited ? <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : null}
              </button>
            </td>
            {/* RSVP three-state */}
            <td className="px-3 py-2 text-center w-28">
              <div className="flex items-center justify-center gap-0.5">
                <button
                  onClick={() => setRsvp(guest, 'accepted')}
                  title="Accepted"
                  className={`px-2 py-0.5 rounded-l-lg border text-xs font-medium transition ${
                    guest.answered === 'accepted'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-emerald-300 hover:text-emerald-600'
                  }`}
                >✓</button>
                <button
                  onClick={() => setRsvp(guest, null)}
                  title="No response"
                  className={`px-2 py-0.5 border-t border-b text-xs font-medium transition ${
                    guest.answered === null
                      ? 'bg-stone-100 border-stone-300 text-stone-700'
                      : 'bg-white border-stone-200 text-stone-300 hover:border-stone-300 hover:text-stone-700'
                  }`}
                >—</button>
                <button
                  onClick={() => setRsvp(guest, 'declined')}
                  title="Declined"
                  className={`px-2 py-0.5 rounded-r-lg border text-xs font-medium transition ${
                    guest.answered === 'declined'
                      ? 'bg-red-400 border-red-400 text-white'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-red-300 hover:text-red-400'
                  }`}
                >✗</button>
              </div>
            </td>
            {/* Text fields */}
            {(['rsvp_by', 'table_no', 'notes'] as const).map(f => (
              <td key={f} className="px-3 py-2 text-stone-600 max-w-[120px]">
                <EditableCell
                  guest={guest} field={f} editingField={editingField}
                  editValue={editValue} setEditValue={setEditValue}
                  onStart={startEdit} onCommit={commitEdit}
                />
              </td>
            ))}
            {/* Delete */}
            <td className="px-3 py-2">
              <button
                onClick={() => deleteGuest(guest)}
                className="text-stone-300 hover:text-red-400 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </td>
          </tr>
        ));

        return (
          <div key={section.side}>
            {/* Section header — click to collapse */}
            <button
              onClick={() => toggleCollapse(sectionKey)}
              className="w-full flex items-center gap-2 mb-2 group"
            >
              <svg
                className={`w-4 h-4 text-stone-400 transition-transform ${isSectionCollapsed ? '-rotate-90' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="font-semibold text-stone-700">{section.label}</span>
              <span className="bg-stone-200 text-stone-700 text-xs px-1.5 py-0.5 rounded-full">
                {statusFilter ? `${visibleCount} of ${all.length}` : all.length}
              </span>
            </button>

            {!isSectionCollapsed && (
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-100 text-xs text-stone-600 uppercase tracking-wide">
                        <th className="text-left px-4 py-2.5 font-medium">Name</th>
                        <th className="text-center px-2 py-2.5 font-medium w-14">Invited</th>
                        <th className="text-center px-3 py-2.5 font-medium w-28">RSVP</th>
                        <th className="text-left px-3 py-2.5 font-medium">RSVP by</th>
                        <th className="text-left px-3 py-2.5 font-medium">Table</th>
                        <th className="text-left px-3 py-2.5 font-medium">Notes</th>
                        <th className="px-3 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {visibleCount === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-stone-400 text-sm">
                            {statusFilter ? 'No guests match this filter.' : 'No guests yet.'}
                          </td>
                        </tr>
                      )}
                      {renderRows(regular)}
                      {familyAll.length > 0 && (
                        <>
                          {/* Family sub-section header — click to collapse */}
                          <tr>
                            <td colSpan={7} className="px-4 py-1.5 bg-stone-50 border-t-2 border-stone-200">
                              <button
                                onClick={() => toggleCollapse(familyKey)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider"
                              >
                                <svg
                                  className={`w-3 h-3 transition-transform ${isFamilyCollapsed ? '-rotate-90' : ''}`}
                                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                {section.familyLabel}
                                <span className="ml-1 normal-case font-normal text-stone-400">
                                  {statusFilter ? `${family.length} of ${familyAll.length}` : familyAll.length}
                                </span>
                              </button>
                            </td>
                          </tr>
                          {!isFamilyCollapsed && renderRows(family)}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* RSVP inbox — at the bottom for matching */}
      <RsvpSubmissions guests={guests} />
    </div>
  );
}


const PAIR_COLORS = [
  'bg-amber-400', 'bg-sky-400', 'bg-rose-400', 'bg-violet-400', 'bg-teal-400',
  'bg-orange-400', 'bg-pink-400', 'bg-cyan-400', 'bg-lime-500', 'bg-indigo-400',
];

function computePairColors(list: Guest[]): Map<string, string> {
  const map = new Map<string, string>();
  const used = new Set<string>();
  let idx = 0;
  for (const guest of list) {
    if (used.has(guest.id) || !guest.avec) continue;
    const partner = list.find(g => !used.has(g.id) && g.name === guest.avec);
    if (partner) {
      const color = PAIR_COLORS[idx % PAIR_COLORS.length];
      map.set(guest.id, color);
      map.set(partner.id, color);
      used.add(guest.id);
      used.add(partner.id);
      idx++;
    }
  }
  return map;
}

function sortWithCouples(list: Guest[]): Guest[] {
  const result: Guest[] = [];
  const used = new Set<string>();
  for (const guest of list) {
    if (used.has(guest.id)) continue;
    result.push(guest);
    used.add(guest.id);
    if (guest.avec) {
      const partner = list.find(g => !used.has(g.id) && g.name === guest.avec);
      if (partner) { result.push(partner); used.add(partner.id); }
    }
  }
  return result;
}

function EditableCell({ guest, field, editingField, editValue, setEditValue, onStart, onCommit }: {
  guest: Guest;
  field: keyof Guest;
  editingField: EditingField;
  editValue: string;
  setEditValue: (v: string) => void;
  onStart: (g: Guest, f: keyof Guest) => void;
  onCommit: (g: Guest) => void;
}) {
  const isEditing = editingField?.guestId === guest.id && editingField?.field === field;
  const value = (guest[field] ?? '') as string;

  if (isEditing) {
    return (
      <input
        autoFocus
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onBlur={() => onCommit(guest)}
        onKeyDown={e => {
          if (e.key === 'Enter') onCommit(guest);
          if (e.key === 'Escape') { setEditValue(''); onCommit(guest); }
        }}
        className="w-full border border-emerald-300 rounded-lg px-2 py-0.5 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
      />
    );
  }

  return (
    <span
      onClick={() => onStart(guest, field)}
      className="block truncate cursor-text hover:bg-stone-100 rounded px-1 py-0.5 min-w-[40px] min-h-[22px]"
      title={value}
    >
      {value || <span className="text-stone-300">—</span>}
    </span>
  );
}
