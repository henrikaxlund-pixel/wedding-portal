import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import db from '@/lib/db';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: taskId } = await params;

  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const ext = path.extname(file.name);
  const filename = `${crypto.randomUUID()}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filepath, buffer);

  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO attachments (id, task_id, filename, original, mimetype, size)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, taskId, filename, file.name, file.type, file.size);

  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id);
  return NextResponse.json(attachment, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const attachmentId = searchParams.get('attachmentId');
  if (!attachmentId) return NextResponse.json({ error: 'Missing attachmentId' }, { status: 400 });

  const att = db.prepare('SELECT * FROM attachments WHERE id = ?').get(attachmentId) as any;
  if (att) {
    const filepath = path.join(UPLOAD_DIR, att.filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    db.prepare('DELETE FROM attachments WHERE id = ?').run(attachmentId);
  }

  return NextResponse.json({ ok: true });
}
