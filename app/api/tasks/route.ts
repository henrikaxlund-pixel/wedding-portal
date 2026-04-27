import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import db from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tasks = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.image as assignee_image
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    ORDER BY t.column, t.position
  `).all();

  const attachments = db.prepare('SELECT * FROM attachments').all();

  const tasksWithAttachments = tasks.map((task: any) => ({
    ...task,
    attachments: attachments.filter((a: any) => a.task_id === task.id),
  }));

  return NextResponse.json(tasksWithAttachments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const id = crypto.randomUUID();

  const maxPos = db.prepare('SELECT MAX(position) as mp FROM tasks WHERE column = ?')
    .get(body.column) as any;
  const position = (maxPos?.mp ?? -1) + 1;

  db.prepare(`
    INSERT INTO tasks (id, column, title, description, assignee_id, status, position)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, body.column, body.title, body.description ?? null,
    body.assignee_id ?? null, body.status ?? 'not_started', position);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  return NextResponse.json(task, { status: 201 });
}
