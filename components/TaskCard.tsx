'use client';

import { Task, Status } from './KanbanBoard';

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  not_started: { label: 'Not started', color: 'bg-stone-100 text-stone-500' },
  started:     { label: 'Started',     color: 'bg-blue-100 text-blue-600' },
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-600' },
};

interface Props {
  task: Task;
  onClick: () => void;
  onStatusChange: (status: Status) => void;
}

export default function TaskCard({ task, onClick, onStatusChange }: Props) {
  const status = STATUS_CONFIG[task.status];
  const nextStatus: Record<Status, Status> = {
    not_started: 'started',
    started: 'completed',
    completed: 'not_started',
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-stone-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-stone-300 transition cursor-pointer group"
    >
      <p className="text-sm font-medium text-stone-800 leading-snug">{task.title}</p>

      {task.description && (
        <p className="text-xs text-stone-400 mt-1 line-clamp-2">{task.description}</p>
      )}

      <div className="mt-2.5 flex items-center justify-between">
        {/* Status badge — click cycles through states */}
        <button
          onClick={e => { e.stopPropagation(); onStatusChange(nextStatus[task.status]); }}
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color} hover:opacity-80 transition`}
        >
          {status.label}
        </button>

        <div className="flex items-center gap-1.5">
          {/* Attachment count */}
          {task.attachments.length > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-stone-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {task.attachments.length}
            </span>
          )}

          {/* Assignee avatar */}
          {task.assignee_name && (
            <div
              title={task.assignee_name}
              className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold overflow-hidden"
            >
              {task.assignee_image
                ? <img src={task.assignee_image} className="w-full h-full object-cover" alt="" />
                : task.assignee_name[0]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
