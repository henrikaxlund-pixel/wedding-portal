import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import sql from '@/lib/db';

/** Normalise a name for matching: lowercase, collapse whitespace, trim. */
function normaliseName(name: string) {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Try to find an exact (normalised) name match in the guests table. */
async function findMatchingGuest(submittedName: string) {
  const norm = normaliseName(submittedName);
  const guests = await sql`SELECT id, name FROM guests`;
  return guests.find(g => normaliseName(g.name) === norm) ?? null;
}

// ── Public: submit RSVP ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, response, message } = body;

    if (!name || !response || !['accepted', 'declined'].includes(response)) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
    }

    const match = await findMatchingGuest(name);

    const [submission] = await sql`
      INSERT INTO rsvp_submissions
        (submitted_name, submitted_email, response, message, matched_guest_id, match_type)
      VALUES
        (${name}, ${email ?? null}, ${response}, ${message ?? null},
         ${match?.id ?? null}, ${match ? 'auto' : null})
      RETURNING *
    `;

    // If auto-matched, update the guest's answered field
    if (match) {
      await sql`
        UPDATE guests
        SET answered = ${response}, updated_at = NOW()
        WHERE id = ${match.id}
      `;
    }

    return NextResponse.json({ ok: true, matched: !!match }, { status: 201 });
  } catch (e: any) {
    console.error('POST /api/rsvp error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── Admin: fetch submissions ─────────────────────────────────────────────────

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const submissions = await sql`
    SELECT
      s.*,
      g.name AS guest_name
    FROM rsvp_submissions s
    LEFT JOIN guests g ON s.matched_guest_id = g.id
    ORDER BY s.submitted_at DESC
  `;

  return NextResponse.json(submissions);
}
