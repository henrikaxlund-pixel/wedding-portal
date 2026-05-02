import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import sql from '@/lib/db';

const DEFAULTS: Record<string, string> = {
  hero_title:       'Riina & Henrik',
  hero_subtitle:    'Winter Solstice · 21 December 2026 · Helsinki',
  hero_body:        'Join us as we celebrate the longest night of the year.',
  background_type:  'color',
  background_value: '#1a1a2e',
  text_color:       '#f5f0e8',
  modules:          '[]',
};

export async function GET() {
  const rows = await sql`SELECT key, value FROM page_content`;
  const content = { ...DEFAULTS };
  for (const row of rows) content[row.key] = row.value;
  return NextResponse.json(content);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Record<string, string>;

  for (const [key, value] of Object.entries(body)) {
    await sql`
      INSERT INTO page_content (key, value, updated_at) VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
    `;
  }

  return NextResponse.json({ ok: true });
}
