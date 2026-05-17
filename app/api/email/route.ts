import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import sql from '@/lib/db';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_FROM,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subject, body } = await req.json();
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
  }

  // Fetch all confirmed guests with an email address
  const guests = await sql`
    SELECT name, email FROM guests
    WHERE answered = 'accepted' AND email IS NOT NULL AND email != ''
  `;

  if (guests.length === 0) {
    return NextResponse.json({ error: 'No confirmed guests with email addresses' }, { status: 400 });
  }

  const errors: string[] = [];
  let sent = 0;

  for (const guest of guests) {
    try {
      await transporter.sendMail({
        from: `Riina & Henrik <${process.env.GMAIL_FROM}>`,
        to: guest.email,
        subject,
        text: body,
      });
      sent++;
    } catch (e: any) {
      errors.push(`${guest.name}: ${e.message}`);
    }
  }

  return NextResponse.json({ sent, total: guests.length, errors });
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const guests = await sql`
    SELECT name, email FROM guests
    WHERE answered = 'accepted' AND email IS NOT NULL AND email != ''
    ORDER BY name
  `;

  return NextResponse.json(guests);
}
