import postgres from 'postgres';
import { randomUUID } from 'crypto';
import { config } from 'dotenv';

// Load .env.local
config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

await sql`DELETE FROM guests`;
console.log('Cleared existing guests.\n');

// avec_offered = true  → invited solo but offered a +1 slot (name TBD)
// avec = 'Name'        → known partner (named person, either already in list or confirmed)
// Known couples cross-reference each other in the avec field.
const guests = [
  // ── Riina's side ──────────────────────────────────────────────────────────
  // Known couples — each other's avec
  { name: 'Heta Hyttinen',       side: 'riina', avec: 'Joel Hiljanen' },
  { name: 'Joel Hiljanen',       side: 'riina', avec: 'Heta Hyttinen' },
  { name: 'Enni Salmenpohja',    side: 'riina', avec: 'Ilkka Salmenpohja' },
  { name: 'Ilkka Salmenpohja',   side: 'riina', avec: 'Enni Salmenpohja' },
  { name: 'Pirre Sköld',         side: 'riina', avec: 'Florian Fink' },
  { name: 'Florian Fink',        side: 'riina', avec: 'Pirre Sköld' },
  { name: 'Jenny Lehtelä',       side: 'riina', avec: 'Leevi Lehtelä' },
  { name: 'Leevi Lehtelä',       side: 'riina', avec: 'Jenny Lehtelä' },
  { name: 'Paula Oksman',        side: 'riina', avec: 'Jari Heino' },
  { name: 'Jari Heino',          side: 'riina', avec: 'Paula Oksman' },
  { name: 'Mika Oksman',         side: 'riina', avec: 'Sari' },
  { name: 'Sari',                side: 'riina', avec: 'Mika Oksman' },
  { name: 'Marika Ripatti',      side: 'riina', avec: 'Mika Ripatti' },
  { name: 'Mika Ripatti',        side: 'riina', avec: 'Marika Ripatti' },

  // Offered a +1 slot — partner name unknown yet
  { name: 'Hippo Taatila',       side: 'riina', avec_offered: true },
  { name: 'Viljami Puustinen',   side: 'riina', avec_offered: true },
  { name: 'Jessika Elo',         side: 'riina', avec_offered: true },
  { name: 'Matias Löfman',       side: 'riina', avec_offered: true },

  // Solo
  { name: 'Aino Järventaus',     side: 'riina' },
  { name: 'Joel Jännes',         side: 'riina' },
  { name: 'Lauri Rinkinen',      side: 'riina' },
  { name: 'Joni Kinnunen',       side: 'riina' },

  // ── Henrik's side ─────────────────────────────────────────────────────────
  // Known couples
  { name: 'Tomas Danska',        side: 'henrik', avec: 'Danskas wife' },
  { name: 'Danskas wife',        side: 'henrik', avec: 'Tomas Danska' },
  { name: 'Leandro Righini',     side: 'henrik', avec: 'Mari Righini' },
  { name: 'Mari Righini',        side: 'henrik', avec: 'Leandro Righini' },

  // Offered a +1 slot
  { name: 'Uffe Norström',       side: 'henrik', avec_offered: true },
  { name: 'Peppe',               side: 'henrik', avec_offered: true },
  { name: 'Anders Göransson',    side: 'henrik', avec_offered: true },
  { name: 'Fredrik Lundgren',    side: 'henrik', avec_offered: true },
  { name: 'Friida Turku',        side: 'henrik', avec_offered: true },
  { name: 'Fredrik Axlund',      side: 'henrik', avec_offered: true },
  { name: 'Anna Axlund',         side: 'henrik', avec_offered: true },
  { name: 'Linus Löfgren',       side: 'henrik', avec_offered: true },
  { name: 'Kaj Axlund',          side: 'henrik', avec_offered: true },
  { name: 'Lena Axlund',         side: 'henrik', avec_offered: true },
  { name: 'Tom Murray',          side: 'henrik', avec_offered: true },
  { name: 'Rici Siren',          side: 'henrik', avec_offered: true },
  { name: 'JC Delgado',          side: 'henrik', avec_offered: true },
  { name: 'Karolina Miller',     side: 'henrik', avec_offered: true },

  // Solo
  { name: 'Robban Nyström',      side: 'henrik' },
  { name: 'Hanna Löfgren',       side: 'henrik' },
  { name: 'Anders Löfgren',      side: 'henrik' },
  { name: 'Kicki Löfgren',       side: 'henrik' },
  { name: 'Pete Ruikka',         side: 'henrik' },
  { name: 'Tania Hoffren',       side: 'henrik' },
];

for (const g of guests) {
  await sql`
    INSERT INTO guests (id, name, side, std_sent, invited, answered, avec_offered, avec)
    VALUES (
      ${randomUUID()}, ${g.name}, ${g.side},
      false, false, null,
      ${!!g.avec_offered}, ${g.avec ?? null}
    )
  `;
  const tag = g.avec ? `avec → ${g.avec}` : g.avec_offered ? 'avec offered (TBD)' : 'solo';
  console.log(`✓  [${g.side.padEnd(6)}]  ${g.name.padEnd(22)}  ${tag}`);
}

await sql.end();
const r = guests.filter(g => g.side === 'riina').length;
const h = guests.filter(g => g.side === 'henrik').length;
console.log(`\nDone — ${guests.length} guests (${r} Riina, ${h} Henrik).`);
