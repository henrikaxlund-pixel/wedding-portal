import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import sql from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await sql`SELECT * FROM program_items ORDER BY position, created_at`;
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const [maxPos] = await sql`SELECT MAX(position) AS mp FROM program_items`;
  const position = (maxPos?.mp ?? -1) + 1;

  const [item] = await sql`
    INSERT INTO program_items (id, time, time_end, title, description, position)
    VALUES (${crypto.randomUUID()}, ${body.time ?? null}, ${body.time_end ?? null}, ${body.title ?? ''}, ${body.description ?? null}, ${position})
    RETURNING *
  `;

  return NextResponse.json(item, { status: 201 });
}
