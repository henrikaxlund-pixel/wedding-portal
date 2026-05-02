import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import sql from '@/lib/db';
import { supabaseAdmin, storageUrl } from '@/lib/supabase';
import path from 'path';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: taskId } = await params;

  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const ext = path.extname(file.name);
  const storagePath = `${crypto.randomUUID()}${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabaseAdmin.storage
    .from('attachments')
    .upload(storagePath, buffer, { contentType: file.type });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const id = crypto.randomUUID();
  const [attachment] = await sql`
    INSERT INTO attachments (id, task_id, filename, original, mimetype, size)
    VALUES (${id}, ${taskId}, ${storagePath}, ${file.name}, ${file.type}, ${file.size})
    RETURNING *
  `;

  return NextResponse.json(
    { ...attachment, filename: storageUrl('attachments', storagePath) },
    { status: 201 },
  );
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const attachmentId = searchParams.get('attachmentId');
  if (!attachmentId) return NextResponse.json({ error: 'Missing attachmentId' }, { status: 400 });

  const [att] = await sql`SELECT * FROM attachments WHERE id = ${attachmentId}`;
  if (att) {
    await supabaseAdmin.storage.from('attachments').remove([att.filename]);
    await sql`DELETE FROM attachments WHERE id = ${attachmentId}`;
  }

  return NextResponse.json({ ok: true });
}
