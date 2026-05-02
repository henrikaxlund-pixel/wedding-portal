import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import sql from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    // Handle multi-assignee via junction table
    if (body.assignee_ids !== undefined) {
      await sql`DELETE FROM task_assignees WHERE task_id = ${id}`;
      for (const userId of (body.assignee_ids as string[])) {
        await sql`INSERT INTO task_assignees (task_id, user_id) VALUES (${id}, ${userId}) ON CONFLICT DO NOTHING`;
      }
    }

    const updates: Record<string, any> = {};
    if (body.title       !== undefined) updates.title       = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status      !== undefined) updates.status      = body.status;
    if (body.column      !== undefined) updates.column      = body.column;
    if (body.position    !== undefined) updates.position    = body.position;

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date();
      await sql`UPDATE tasks SET ${sql(updates)} WHERE id = ${id}`;
    }

    const [task] = await sql`SELECT * FROM tasks WHERE id = ${id}`;
    const assigneeRows = await sql`
      SELECT u.id, u.name, u.image
      FROM task_assignees ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.task_id = ${id}
    `;

    return NextResponse.json(task ? { ...task, assignees: assigneeRows } : { error: 'Not found' });
  } catch (e: any) {
    console.error('PATCH /api/tasks/[id] error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await sql`DELETE FROM tasks WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
