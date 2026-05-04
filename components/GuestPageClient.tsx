'use client';

import { useState, useRef } from 'react';
import Countdown from './Countdown';

type Content = Record<string, string>;

export interface Module {
  id: string;
  title: string;
  body: string;
}

interface Props {
  initialContent: Content;
  isEditor: boolean;
}

export default function GuestPageClient({ initialContent, isEditor }: Props) {
  const [content, setContent] = useState<Content>(initialContent);
  const [modules, setModules] = useState<Module[]>(() => {
    try { return JSON.parse(initialContent.modules ?? '[]'); } catch { return []; }
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bg = content.background_type === 'image' && content.background_value
    ? { backgroundImage: `url(${content.background_value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: content.background_value ?? '#1a1a2e' };

  const textColor = content.text_color ?? '#f5f0e8';

  async function save() {
    setSaving(true);
    await fetch('/api/page-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...content, modules: JSON.stringify(modules) }),
    });
    setSaving(false);
    setEditing(false);
    setBgPickerOpen(false);
  }

  function cancel() {
    setContent(initialContent);
    setModules(() => {
      try { return JSON.parse(initialContent.modules ?? '[]'); } catch { return []; }
    });
    setEditing(false);
    setBgPickerOpen(false);
  }

  function update(key: string, value: string) {
    setContent(c => ({ ...c, [key]: value }));
  }

  function updateModule(id: string, field: keyof Module, value: string) {
    setModules(ms => ms.map(m => m.id === id ? { ...m, [field]: value } : m));
  }

  function addModule() {
    setModules(ms => [...ms, { id: crypto.randomUUID(), title: 'New section', body: '' }]);
  }

  function deleteModule(id: string) {
    setModules(ms => ms.filter(m => m.id !== id));
  }

  async function uploadBg(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/page-content/upload', { method: 'POST', body: fd });
    const { url } = await res.json();
    update('background_type', 'image');
    update('background_value', url);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ ...bg, color: textColor }}>

      {/* Editor toolbar */}
      {isEditor && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm text-white px-4 py-2 flex items-center gap-3 text-sm">
          <span className="text-stone-600 text-xs font-medium">Guest page editor</span>
          <div className="flex-1" />

          {editing ? (
            <>
              {/* Background panel */}
              <div className="relative">
                <button
                  onClick={() => setBgPickerOpen(p => !p)}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
                >
                  ðŸŽ¨ Background
                </button>
                {bgPickerOpen && (
                  <div className="absolute top-full right-0 mt-2 bg-stone-900 border border-stone-700 rounded-2xl p-4 w-72 space-y-4 shadow-xl">
                    <p className="text-xs text-stone-600 uppercase tracking-wide">Background color</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={content.background_type === 'color' ? content.background_value : '#1a1a2e'}
                        onChange={e => { update('background_type', 'color'); update('background_value', e.target.value); }}
                        className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={content.background_type === 'color' ? content.background_value : ''}
                        onChange={e => { update('background_type', 'color'); update('background_value', e.target.value); }}
                        className="flex-1 bg-stone-800 text-white rounded-lg px-3 py-1.5 text-sm border border-stone-600 focus:outline-none"
                        placeholder="#1a1a2e"
                      />
                    </div>
                    <p className="text-xs text-stone-600 uppercase tracking-wide">Or upload image</p>
                    <label className="flex items-center gap-2 cursor-pointer bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-xl px-3 py-2 text-sm transition">
                      ðŸ“· Choose image
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadBg} />
                    </label>
                    {content.background_type === 'image' && (
                      <button
                        onClick={() => { update('background_type', 'color'); update('background_value', '#1a1a2e'); }}
                        className="text-xs text-stone-600 hover:text-white transition"
                      >
                        âœ• Remove image
                      </button>
                    )}
                    <p className="text-xs text-stone-600 uppercase tracking-wide">Text color</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={textColor}
                        onChange={e => update('text_color', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={textColor}
                        onChange={e => update('text_color', e.target.value)}
                        className="flex-1 bg-stone-800 text-white rounded-lg px-3 py-1.5 text-sm border border-stone-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={addModule}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
              >
                + Add section
              </button>

              <button
                onClick={save}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
              >
                {saving ? 'Savingâ€¦' : 'Save'}
              </button>
              <button
                onClick={cancel}
                className="text-stone-600 hover:text-white px-3 py-1.5 rounded-lg transition"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
            >
              âœï¸ Edit page
            </button>
          )}
        </div>
      )}

      {/* Page content */}
      <div className={`flex-1 flex flex-col items-center ${isEditor ? 'pt-14' : ''}`}>

        {/* Hero */}
        <section className="w-full flex flex-col items-center justify-center text-center px-6 py-24 gap-6">
          <EditableText
            value={content.hero_title}
            editing={editing}
            onChange={v => update('hero_title', v)}
            textColor={textColor}
            className="text-3xl sm:text-5xl font-bold tracking-widest uppercase"
            fontFamily="var(--font-cinzel)"
          />
          <EditableText
            value={content.hero_subtitle}
            editing={editing}
            onChange={v => update('hero_subtitle', v)}
            textColor={textColor}
            className="text-sm sm:text-base opacity-70 tracking-[0.25em] uppercase"
            fontFamily="var(--font-cinzel)"
          />
          <EditableText
            value={content.hero_body}
            editing={editing}
            onChange={v => update('hero_body', v)}
            textColor={textColor}
            className="text-base opacity-60 max-w-lg tracking-wide"
            fontFamily="var(--font-cinzel)"
            multiline
          />
        </section>

        {/* Divider */}
        <div className="w-64 h-px opacity-30" style={{ backgroundColor: textColor }} />

        {/* RSVP button */}
        <section className="w-full flex flex-col items-center px-6 py-12">
          <a
            href="/rsvp"
            className="border border-white/40 hover:border-white/70 px-20 py-6 text-center transition hover:bg-white/5"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            <span
              className="block text-xl tracking-[0.4em] uppercase"
              style={{ color: textColor }}
            >
              RSVP
            </span>
          </a>
        </section>

        {/* Countdown */}
        <section className="w-full flex flex-col items-center py-8 px-6 gap-4">
          <Countdown textColor={textColor} />
        </section>

        {/* Dynamic modules */}
        {modules.map(mod => (
          <section key={mod.id} className="w-full max-w-2xl px-6 py-12 flex flex-col gap-4 relative group">
            {editing && (
              <button
                onClick={() => deleteModule(mod.id)}
                className="absolute top-4 right-4 text-white/30 hover:text-red-400 transition bg-black/30 p-1.5"
                title="Delete section"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <div className="w-16 h-px opacity-20 mb-2" style={{ backgroundColor: textColor }} />
            <EditableText
              value={mod.title}
              editing={editing}
              onChange={v => updateModule(mod.id, 'title', v)}
              textColor={textColor}
              className="text-xl tracking-widest uppercase"
              fontFamily="var(--font-cinzel)"
            />
            <EditableText
              value={mod.body}
              editing={editing}
              onChange={v => updateModule(mod.id, 'body', v)}
              textColor={textColor}
              className="opacity-70 whitespace-pre-wrap leading-relaxed text-base italic"
              fontFamily="var(--font-baskerville)"
              multiline
              placeholder="Add content here…"
            />
          </section>
        ))}

        {/* Add section prompt in edit mode when no modules */}
        {editing && modules.length === 0 && (
          <button
            onClick={addModule}
            className="mt-4 text-white/40 hover:text-white/70 border border-white/20 hover:border-white/40 px-8 py-4 text-sm transition"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            + Add a section (venue, program, etc.)
          </button>
        )}

        <div className="h-24" />
      </div>
    </div>
  );
}

function EditableText({ value, editing, onChange, textColor, className, fontFamily, multiline = false, placeholder = '' }: {
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  textColor: string;
  className: string;
  fontFamily?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  const base = "bg-transparent border-b-2 border-white/20 focus:border-white/60 focus:outline-none w-full text-center";
  const style = { color: textColor, ...(fontFamily ? { fontFamily } : {}) };

  if (!editing) {
    return value ? <p className={className} style={style}>{value}</p> : null;
  }

  return multiline ? (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={3}
      placeholder={placeholder}
      className={`${className} ${base} resize-none placeholder:text-white/20`}
      style={style}
    />
  ) : (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${className} ${base} placeholder:text-white/20`}
      style={style}
    />
  );
}
