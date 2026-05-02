import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import sql from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const guests = await sql`SELECT * FROM guests ORDER BY side, name`;
  return NextResponse.json(guests);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const id = crypto.randomUUID();

  const [guest] = await sql`
    INSERT INTO guests (id, name, side, std_sent, invited, answered, avec_offered, avec, rsvp_by, table_no, dietary_restrictions, notes)
    VALUES (
      ${id},
      ${body.name},
      ${body.side ?? 'henrik'},
      ${!!body.std_sent},
      ${!!body.invited},
      ${body.answered ?? null},
      ${!!body.avec_offered},
      ${body.avec ?? null},
      ${body.rsvp_by ?? null},
      ${body.table_no ?? null},
      ${body.dietary_restrictions ?? null},
      ${body.notes ?? null}
    )
    RETURNING *
  `;

  return NextResponse.json(guest, { status: 201 });
}
