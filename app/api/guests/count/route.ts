import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import sql from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [row] = await sql`SELECT COUNT(*) AS count FROM guests WHERE answered = 'accepted'`;
  return NextResponse.json({ count: Number(row.count) });
}
