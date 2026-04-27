'use client';

import { useEffect, useState } from 'react';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';

export const COLUMNS = [
  { id: 'venue', label: 'Venue & Entertainment', emoji: '🎉' },
  { id: 'catering', label: 'Catering', emoji: '🍽️' },
  { id: 'clothes', label: 'Clothes', emoji: '👗' },
  { id: 'ceremony', label: 'Ceremony', emoji: '💒' },
];

export type Status = 'not_started' | 'started' | 'completed';

export interface Attachment {
  id: string;
  task_id: string;
  filename: string;
  original: string;
  mimetype: string;
  size: number;
}

export interface Task {
  id: string;
  column: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  assignee_image: string | null;
  status: Status;
  position: number;
  attachments: Attachment[];
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskColumn, setNewTaskColumn] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([t, u]) => {
      setTasks(t);
      setUsers(u);
      setLoading(false);
    });
  }, []);

  function tasksForColumn(col: string) {
    return tasks.filter(t => t.column === col).sort((a, b) => a.position - b.position);
  }

  async function addTask(column: string, title: string) {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column, title }),
    });
    const task = await res.json();
    setTasks(prev => [...prev, { ...task, attachments: [] }]);
    setNewTaskColumn(null);
    setEditingTask({ ...task, attachments: [] });
  }

  function updateTask(updated: Task) {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  }

  function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
    setEditingTask(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-400">
        Loading…
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex-shrink-0 w-72">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-stone-700 text-sm flex items-center gap-1.5">
                <span>{col.emoji}</span>
                {col.label}
                <span className="ml-1 bg-stone-200 text-stone-500 text-xs px-1.5 py-0.5 rounded-full">
                  {tasksForColumn(col.id).length}
                </span>
              </h2>
            </div>

            {/* Task cards */}
            <div className="space-y-2 min-h-[2rem]">
              {tasksForColumn(col.id).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => setEditingTask(task)}
                  onStatusChange={async (status) => {
                    const res = await fetch(`/api/tasks/${task.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status }),
                    });
                    const updated = await res.json();
                    updateTask({ ...updated, attachments: task.attachments });
                  }}
                />
              ))}
            </div>

            {/* Add task */}
            {newTaskColumn === col.id ? (
              <NewTaskInput
                onAdd={(title) => addTask(col.id, title)}
                onCancel={() => setNewTaskColumn(null)}
              />
            ) : (
              <button
                onClick={() => setNewTaskColumn(col.id)}
                className="mt-2 w-full text-left text-sm text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl px-3 py-2 transition flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add task
              </button>
            )}
          </div>
        ))}
      </div>

      {editingTask && (
        <TaskModal
          task={editingTask}
          users={users}
          onClose={() => setEditingTask(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
    </>
  );
}

function NewTaskInput({ onAdd, onCancel }: { onAdd: (title: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && title.trim()) onAdd(title.trim());
    if (e.key === 'Escape') onCancel();
  }

  return (
    <div className="mt-2">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Task title…"
        className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
      />
      <div className="flex gap-2 mt-1.5">
        <button
          onClick={() => title.trim() && onAdd(title.trim())}
          className="text-xs bg-rose-500 text-white px-3 py-1.5 rounded-lg hover:bg-rose-600 transition"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="text-xs text-stone-500 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

