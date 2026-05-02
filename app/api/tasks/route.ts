import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import sql from '@/lib/db';
import { storageUrl } from '@/lib/supabase';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tasks = await sql`SELECT * FROM tasks ORDER BY "column", position`;

  const assigneeRows = await sql`
    SELECT ta.task_id, u.id, u.name, u.image
    FROM task_assignees ta
    JOIN users u ON ta.user_id = u.id
  `;

  const attachments = await sql`SELECT * FROM attachments`;

  const tasksWithData = tasks.map((task: any) => ({
    ...task,
    assignees: assigneeRows
      .filter((a: any) => a.task_id === task.id)
      .map((a: any) => ({ id: a.id, name: a.name, image: a.image })),
    attachments: attachments
      .filter((a: any) => a.task_id === task.id)
      .map((a: any) => ({ ...a, filename: storageUrl('attachments', a.filename) })),
  }));

  return NextResponse.json(tasksWithData);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const id = crypto.randomUUID();

  const [maxPos] = await sql`SELECT MAX(position) AS mp FROM tasks WHERE "column" = ${body.column}`;
  const position = (maxPos?.mp ?? -1) + 1;

  const [task] = await sql`
    INSERT INTO tasks (id, "column", title, description, status, position)
    VALUES (${id}, ${body.column}, ${body.title}, ${body.description ?? null}, ${'not_started'}, ${position})
    RETURNING *
  `;

  return NextResponse.json(task, { status: 201 });
}
