import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import sql from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, any> = {};
  if (body.time        !== undefined) updates.time        = body.time ?? null;
  if (body.time_end    !== undefined) updates.time_end    = body.time_end ?? null;
  if (body.title       !== undefined) updates.title       = body.title;
  if (body.description !== undefined) updates.description = body.description ?? null;
  if (body.position    !== undefined) updates.position    = body.position;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  updates.updated_at = new Date();
  await sql`UPDATE program_items SET ${sql(updates)} WHERE id = ${id}`;

  const [item] = await sql`SELECT * FROM program_items WHERE id = ${id}`;
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await sql`DELETE FROM program_items WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
