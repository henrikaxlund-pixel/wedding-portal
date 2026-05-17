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
  const guests = await sql`SELECT id, name, side FROM guests`;
  return guests.find(g => normaliseName(g.name) === norm) ?? null;
}

// ── Public: submit RSVP ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, response, message, avec_name } = body;

    if (!name || !response || !['accepted', 'declined'].includes(response)) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
    }

    const match = await findMatchingGuest(name);

    const [submission] = await sql`
      INSERT INTO rsvp_submissions
        (submitted_name, submitted_email, response, message, avec_name, matched_guest_id, match_type)
      VALUES
        (${name}, ${email ?? null}, ${response}, ${message ?? null},
         ${avec_name ?? null}, ${match?.id ?? null}, ${match ? 'auto' : null})
      RETURNING *
    `;

    // If auto-matched, update the guest's answered field and save their email
    if (match) {
      await sql`
        UPDATE guests SET answered = ${response}, email = ${email ?? null}, updated_at = NOW() WHERE id = ${match.id}
      `;
    }

    // Also handle the avec guest if provided
    if (avec_name && response === 'accepted') {
      const avecMatch = await findMatchingGuest(avec_name);
      if (avecMatch) {
        // Existing guest — confirm them and link avec both ways
        await sql`UPDATE guests SET answered = 'accepted', avec = ${name}, updated_at = NOW() WHERE id = ${avecMatch.id}`;
        if (match) {
          await sql`UPDATE guests SET avec = ${avec_name} WHERE id = ${match.id}`;
        }
      } else {
        // Not in guest list — create them on the same side as the main guest
        const side = match?.side ?? 'henrik';
        const avecId = crypto.randomUUID();
        await sql`
          INSERT INTO guests (id, name, side, answered, avec)
          VALUES (${avecId}, ${avec_name}, ${side}, 'accepted', ${name})
        `;
        if (match) {
          await sql`UPDATE guests SET avec = ${avec_name} WHERE id = ${match.id}`;
        }
      }
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
