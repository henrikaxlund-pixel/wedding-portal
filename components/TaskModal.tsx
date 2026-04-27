'use client';

import { useState, useRef } from 'react';
import { Task, User, Status, Attachment } from './KanbanBoard';

const STATUSES: { value: Status; label: string; color: string }[] = [
  { value: 'not_started', label: 'Not started', color: 'bg-stone-100 text-stone-600' },
  { value: 'started',     label: 'Started',     color: 'bg-blue-100 text-blue-600' },
  { value: 'completed',   label: 'Completed',   color: 'bg-green-100 text-green-600' },
];

interface Props {
  task: Task;
  users: User[];
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskModal({ task, users, onClose, onUpdate, onDelete }: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [status, setStatus] = useState<Status>(task.status);
  const [assigneeId, setAssigneeId] = useState<string>(task.assignee_id ?? '');
  const [attachments, setAttachments] = useState<Attachment[]>(task.attachments);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        status,
        assignee_id: assigneeId || null,
      }),
    });
    const updated = await res.json();
    onUpdate({ ...updated, attachments });
    setSaving(false);
    onClose();
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/tasks/${task.id}/attachments`, {
      method: 'POST',
      body: fd,
    });
    const att = await res.json();
    setAttachments(prev => [...prev, att]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function removeAttachment(attId: string, filename: string) {
    await fetch(`/api/tasks/${task.id}/attachments?attachmentId=${attId}`, { method: 'DELETE' });
    setAttachments(prev => prev.filter(a => a.id !== attId));
  }

  async function handleDelete() {
    if (!confirm('Delete this task?')) return;
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
    onDelete(task.id);
  }

  function fileIcon(mimetype: string) {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype === 'application/pdf') return '📄';
    return '📎';
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-lg font-semibold text-stone-800 border-b border-stone-200 pb-1 focus:outline-none focus:border-rose-400"
              placeholder="Task title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
              placeholder="Add notes, links, details…"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Status</label>
            <div className="flex gap-2">
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                    status === s.value
                      ? s.color + ' ring-2 ring-offset-1 ring-rose-300'
                      : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Assigned to</label>
            <select
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              <option value="">Unassigned</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
              ))}
            </select>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Attachments</label>
            {attachments.length > 0 && (
              <ul className="space-y-1.5 mb-2">
                {attachments.map(att => (
                  <li key={att.id} className="flex items-center gap-2 text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                    <span>{fileIcon(att.mimetype)}</span>
                    <a
                      href={`/uploads/${att.filename}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-stone-700 hover:text-rose-500 truncate"
                    >
                      {att.original}
                    </a>
                    <span className="text-xs text-stone-400 shrink-0">{formatSize(att.size)}</span>
                    <button
                      onClick={() => removeAttachment(att.id, att.filename)}
                      className="text-stone-300 hover:text-red-400 transition shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 cursor-pointer border border-dashed border-stone-300 rounded-xl px-3 py-2 hover:border-stone-400 transition">
              {uploading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Uploading…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Attach file or image
                </>
              )}
              <input ref={fileInputRef} type="file" className="hidden" onChange={uploadFile} />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-100 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleDelete}
            className="text-sm text-red-400 hover:text-red-600 transition"
          >
            Delete task
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-xl text-stone-500 hover:bg-stone-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="text-sm px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
