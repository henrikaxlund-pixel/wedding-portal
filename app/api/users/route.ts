import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import sql from '@/lib/db';
import { hash } from 'bcryptjs';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await sql`SELECT id, name, email, image, role, created_at FROM users`;
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  if (!body.email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const id = crypto.randomUUID();
  const hashedPassword = body.password ? await hash(body.password, 12) : null;

  const [user] = await sql`
    INSERT INTO users (id, name, email, password, role)
    VALUES (${id}, ${body.name ?? null}, ${body.email}, ${hashedPassword}, ${body.role ?? 'dearest'})
    RETURNING id, name, email, image, role, created_at
  `;

  return NextResponse.json(user, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('id');
  if (!userId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await sql`DELETE FROM users WHERE id = ${userId}`;
  return NextResponse.json({ ok: true });
}
