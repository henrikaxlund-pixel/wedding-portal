'use client';

import { useEffect, useState } from 'react';

interface ProgramItem {
  id: string;
  time: string | null;
  time_end: string | null;
  title: string;
  description: string | null;
  position: number;
}

type EditTarget = { id: string; field: 'time' | 'time_end' | 'title' | 'description' } | null;

// Winter solstice 2026 in Helsinki (UTC+2): 20:50 UTC = 22:50 local
const SOLSTICE_MINUTES = 22 * 60 + 50;
const SOLSTICE_LABEL = '22:50';

function parseMinutes(t: string | null): number | null {
  if (!t) return null;
  const parts = t.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return parts[0] * 60 + parts[1];
}

function formatGap(minutes: number): string {
  if (minutes <= 0) return '';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export default function ProgramEditor() {
  const [items, setItems] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditTarget>(null);
  const [editValue, setEditValue] = useState('');
  const [adding, setAdding] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [newTimeEnd, setNewTimeEnd] = useState('');
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetch('/api/program').then(r => r.json()).then(d => { setItems(d); setLoading(false); });
  }, []);

  async function patch(id: string, data: Partial<ProgramItem>) {
    const res = await fetch(`/api/program/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setItems(prev => prev.map(i => i.id === id ? updated : i));
  }

  function startEdit(item: ProgramItem, field: NonNullable<EditTarget>['field']) {
    setEditing({ id: item.id, field: field as any });
    setEditValue((item[field as keyof ProgramItem] ?? '') as string);
  }

  async function commitEdit() {
    if (!editing) return;
    await patch(editing.id, { [editing.field]: editValue.trim() || null });
    setEditing(null);
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const res = await fetch('/api/program', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), time: newTime.trim() || null, time_end: newTimeEnd.trim() || null }),
    });
    const item = await res.json();
    setItems(prev => [...prev, item]);
    setNewTitle(''); setNewTime(''); setNewTimeEnd('');
    setAdding(false);
  }

  async function deleteItem(id: string, title: string) {
    if (!confirm(`Remove "${title || 'this block'}"?`)) return;
    await fetch(`/api/program/${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(i => i.id !== id));
  }

  async function move(index: number, direction: -1 | 1) {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= items.length) return;
    const a = items[index], b = items[swapIndex];
    const newItems = [...items];
    newItems[index] = { ...b, position: a.position };
    newItems[swapIndex] = { ...a, position: b.position };
    setItems(newItems);
    await Promise.all([patch(a.id, { position: b.position }), patch(b.id, { position: a.position })]);
  }

  if (loading) return <div className="text-stone-400 text-sm py-4">Loading program…</div>;

  // Determine where to insert the solstice marker
  // It goes after the last item whose start time is ≤ solstice time,
  // or before everything if all items start after the solstice.
  let solsticeAfterIndex: number | null = null; // insert after items[solsticeAfterIndex]
  let solsticeBeforeAll = false;
  if (items.length > 0) {
    let placed = false;
    for (let i = items.length - 1; i >= 0; i--) {
      const t = parseMinutes(items[i].time);
      if (t !== null && t <= SOLSTICE_MINUTES) {
        solsticeAfterIndex = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      const firstWithTime = items.find(it => parseMinutes(it.time) !== null);
      if (firstWithTime) solsticeBeforeAll = true;
      // if no items have times at all, don't show the solstice line
    }
  }

  const showSolstice = items.length === 0 || solsticeAfterIndex !== null || solsticeBeforeAll;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
        <div>
          <h2 className="font-semibold text-stone-800">Wedding Program</h2>
          <p className="text-xs text-stone-400 mt-0.5">Click any field to edit · use ↑↓ to reorder</p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-sm bg-emerald-500 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl transition font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add block
          </button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && !adding && (
        <div className="px-6 py-12 text-center text-stone-400 text-sm">
          No program blocks yet — add the first one.
        </div>
      )}

      <div className="divide-y divide-stone-50">

        {/* Solstice line before all events */}
        {solsticeBeforeAll && <SolsticeLine />}

        {items.map((item, index) => {
          // Gap between previous item's end and this item's start
          const prevItem = index > 0 ? items[index - 1] : null;
          const gapMinutes = (() => {
            if (!prevItem) return null;
            const prevEnd = parseMinutes(prevItem.time_end);
            const thisStart = parseMinutes(item.time);
            if (prevEnd === null || thisStart === null) return null;
            return thisStart - prevEnd;
          })();
          const gapLabel = gapMinutes !== null && gapMinutes > 0 ? formatGap(gapMinutes) : null;

          return (
            <div key={item.id}>
              {/* Time gap between events */}
              {gapLabel && (
                <div className="flex items-center gap-3 px-6 py-1">
                  <div className="w-20 flex-shrink-0" />
                  <div className="flex items-center gap-2 text-xs text-stone-300">
                    <div className="h-px w-6 bg-stone-100" />
                    <span>{gapLabel}</span>
                    <div className="h-px flex-1 bg-stone-100" />
                  </div>
                </div>
              )}

              {/* Block row */}
              <div className="flex items-start gap-4 px-6 py-4 hover:bg-stone-50 group">

                {/* Time column */}
                <div className="w-20 flex-shrink-0 pt-0.5 space-y-0.5">
                  {/* Start time */}
                  {editing?.id === item.id && editing.field === 'time' ? (
                    <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }}
                      placeholder="14:00"
                      className="w-full border border-emerald-300 rounded-lg px-2 py-0.5 text-sm font-mono text-stone-900 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-300"
                    />
                  ) : (
                    <span onClick={() => startEdit(item, 'time')}
                      className={`block text-sm font-mono cursor-text rounded px-1 py-0.5 hover:bg-stone-100 min-h-[22px] leading-tight ${item.time ? 'text-stone-700 font-medium' : 'text-stone-300'}`}
                    >{item.time ?? '––:––'}</span>
                  )}
                  {/* End time */}
                  {editing?.id === item.id && editing.field === 'time_end' ? (
                    <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }}
                      placeholder="15:00"
                      className="w-full border border-emerald-300 rounded-lg px-2 py-0.5 text-sm font-mono text-stone-900 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-300"
                    />
                  ) : (
                    <span onClick={() => startEdit(item, 'time_end')}
                      className={`block text-xs font-mono cursor-text rounded px-1 py-0.5 hover:bg-stone-100 min-h-[18px] leading-tight ${item.time_end ? 'text-stone-400' : 'text-stone-200 opacity-0 group-hover:opacity-100'}`}
                    >{item.time_end ? `↳ ${item.time_end}` : '↳ end'}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {editing?.id === item.id && editing.field === 'title' ? (
                    <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }}
                      className="w-full border border-emerald-300 rounded-lg px-2 py-0.5 text-sm font-semibold text-stone-900 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-300"
                    />
                  ) : (
                    <span onClick={() => startEdit(item, 'title')}
                      className="block text-sm font-semibold text-stone-800 cursor-text rounded px-1 py-0.5 hover:bg-stone-100 min-h-[24px]"
                    >{item.title || <span className="text-stone-300 font-normal italic">Untitled</span>}</span>
                  )}
                  {editing?.id === item.id && editing.field === 'description' ? (
                    <textarea autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => { if (e.key === 'Escape') setEditing(null); }}
                      rows={2} placeholder="Add notes…"
                      className="mt-1 w-full border border-emerald-300 rounded-lg px-2 py-1 text-sm text-stone-600 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-300 resize-none"
                    />
                  ) : (
                    <span onClick={() => startEdit(item, 'description')}
                      className={`block mt-0.5 text-sm cursor-text rounded px-1 py-0.5 hover:bg-stone-100 min-h-[20px] ${item.description ? 'text-stone-500' : 'text-stone-300 opacity-0 group-hover:opacity-100 italic text-xs'}`}
                    >{item.description ?? 'Add notes…'}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition flex-shrink-0 pt-0.5">
                  <button onClick={() => move(index, -1)} disabled={index === 0}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-20 disabled:cursor-not-allowed transition" title="Move up">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button onClick={() => move(index, 1)} disabled={index === items.length - 1}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-20 disabled:cursor-not-allowed transition" title="Move down">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button onClick={() => deleteItem(item.id, item.title)}
                    className="p-1.5 rounded-lg text-stone-300 hover:text-red-400 hover:bg-red-50 transition ml-0.5" title="Delete">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>

              {/* Solstice line after this item */}
              {solsticeAfterIndex === index && <SolsticeLine />}
            </div>
          );
        })}
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={addItem} className="flex items-center gap-2 px-6 py-4 border-t border-stone-100 bg-stone-50 flex-wrap">
          <input value={newTime} onChange={e => setNewTime(e.target.value)}
            placeholder="Start (14:00)"
            className="w-28 border border-stone-200 rounded-xl px-3 py-1.5 text-sm font-mono text-stone-900 bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <input value={newTimeEnd} onChange={e => setNewTimeEnd(e.target.value)}
            placeholder="End (15:30)"
            className="w-28 border border-stone-200 rounded-xl px-3 py-1.5 text-sm font-mono text-stone-900 bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
            placeholder="Block title…"
            className="flex-1 min-w-[160px] border border-stone-200 rounded-xl px-3 py-1.5 text-sm text-stone-900 bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <button type="submit" className="bg-emerald-500 hover:bg-emerald-700 text-white text-sm px-4 py-1.5 rounded-xl transition font-medium">Add</button>
          <button type="button" onClick={() => { setAdding(false); setNewTitle(''); setNewTime(''); setNewTimeEnd(''); }}
            className="text-sm text-stone-400 hover:text-stone-600 px-2 transition">Cancel</button>
        </form>
      )}
    </div>
  );
}

function SolsticeLine() {
  return (
    <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 border-y border-amber-100">
      <div className="w-20 flex-shrink-0 text-xs font-mono font-semibold text-amber-600">{SOLSTICE_LABEL}</div>
      <div className="flex items-center gap-2 flex-1">
        <div className="h-px flex-1 bg-amber-200" />
        <span className="text-xs font-medium text-amber-600 whitespace-nowrap">☀ Winter Solstice</span>
        <div className="h-px flex-1 bg-amber-200" />
      </div>
    </div>
  );
}
