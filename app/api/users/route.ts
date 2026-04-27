import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import db from '@/lib/db';
import { hash } from 'bcryptjs';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = db.prepare('SELECT id, name, email, image, role, created_at FROM users').all();
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

  db.prepare(`
    INSERT INTO users (id, name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, body.name ?? null, body.email, hashedPassword, body.role ?? 'helper');

  const user = db.prepare('SELECT id, name, email, image, role, created_at FROM users WHERE id = ?').get(id);
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

  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  return NextResponse.json({ ok: true });
}
