import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import sql from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const updates: Record<string, any> = {};
    const allowed = ['name', 'side', 'std_sent', 'invited', 'answered', 'avec_offered', 'avec', 'rsvp_by', 'table_no', 'dietary_restrictions', 'notes'];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (['std_sent', 'invited', 'avec_offered'].includes(key)) {
          updates[key] = !!body[key];
        } else {
          updates[key] = body[key] ?? null;
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.updated_at = new Date();
    await sql`UPDATE guests SET ${sql(updates)} WHERE id = ${id}`;

    const [guest] = await sql`SELECT * FROM guests WHERE id = ${id}`;
    return NextResponse.json(guest);
  } catch (e: any) {
    console.error('PATCH /api/guests/[id] error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await sql`DELETE FROM guests WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
