import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import sql from '@/lib/db';

// ── Admin: manually match a submission to a guest ────────────────────────────

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { matched_guest_id } = await req.json();

  if (!matched_guest_id) {
    return NextResponse.json({ error: 'matched_guest_id required' }, { status: 400 });
  }

  // Get the submission to know what response to write to the guest
  const [submission] = await sql`SELECT * FROM rsvp_submissions WHERE id = ${id}`;
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Update the submission
  await sql`
    UPDATE rsvp_submissions
    SET matched_guest_id = ${matched_guest_id}, match_type = 'manual'
    WHERE id = ${id}
  `;

  // Update the guest's RSVP
  await sql`
    UPDATE guests
    SET answered = ${submission.response}, updated_at = NOW()
    WHERE id = ${matched_guest_id}
  `;

  const [updated] = await sql`
    SELECT s.*, g.name AS guest_name
    FROM rsvp_submissions s
    LEFT JOIN guests g ON s.matched_guest_id = g.id
    WHERE s.id = ${id}
  `;

  return NextResponse.json(updated);
}

// ── Admin: delete a submission (spam / test) ─────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await sql`DELETE FROM rsvp_submissions WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
