import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import db from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const fields: string[] = [];
  const values: any[] = [];

  if (body.title !== undefined)       { fields.push('title = ?');       values.push(body.title); }
  if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
  if (body.status !== undefined)      { fields.push('status = ?');      values.push(body.status); }
  if (body.assignee_id !== undefined) { fields.push('assignee_id = ?'); values.push(body.assignee_id); }
  if (body.column !== undefined)      { fields.push('column = ?');      values.push(body.column); }
  if (body.position !== undefined)    { fields.push('position = ?');    values.push(body.position); }

  fields.push('updated_at = datetime("now")');
  values.push(id);

  db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.image as assignee_image
    FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.id = ?
  `).get(id);

  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
