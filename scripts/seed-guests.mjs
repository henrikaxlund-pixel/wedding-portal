import postgres from 'postgres';
import { randomUUID } from 'crypto';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

await sql`DELETE FROM guests`;
console.log('Cleared existing guests.\n');

// avec = 'Name'        → linked couple (partner already in list)
// avec_offered = true  → coming as 2 but partner name unknown yet
// (neither)            → solo guest
const guests = [

  // ── RIINA'S SIDE ─────────────────────────────────────────────────────────

  // Couples
  { name: 'Heta Hyttinen',        side: 'riina', avec: 'Joel Hiljanen' },
  { name: 'Joel Hiljanen',        side: 'riina', avec: 'Heta Hyttinen' },

  { name: 'Enni Salmenpohja',     side: 'riina', avec: 'Ilkka Salmenpohja' },
  { name: 'Ilkka Salmenpohja',    side: 'riina', avec: 'Enni Salmenpohja' },

  { name: 'Niki Westerbacka',     side: 'riina', avec: 'Tero' },
  { name: 'Tero',                 side: 'riina', avec: 'Niki Westerbacka' },

  { name: 'Jessika Elo',          side: 'riina', avec: 'Oskari Holmberg' },
  { name: 'Oskari Holmberg',      side: 'riina', avec: 'Jessika Elo' },

  { name: 'Marja Lappalainen',    side: 'riina', avec: 'Jarkko Vehniäinen' },
  { name: 'Jarkko Vehniäinen',    side: 'riina', avec: 'Marja Lappalainen' },

  { name: 'Pirre Sköld',          side: 'riina', avec: 'Florian Fink' },
  { name: 'Florian Fink',         side: 'riina', avec: 'Pirre Sköld' },

  { name: 'Matias Löfman',        side: 'riina', avec: 'Karoliina' },
  { name: 'Karoliina',            side: 'riina', avec: 'Matias Löfman' },

  { name: 'Keiko Mashima',        side: 'riina', avec: 'Petri Lindroos' },
  { name: 'Petri Lindroos',       side: 'riina', avec: 'Keiko Mashima' },

  { name: 'Nino Laurenne',        side: 'riina', avec: 'Netta Laurenne' },
  { name: 'Netta Laurenne',       side: 'riina', avec: 'Nino Laurenne' },

  { name: 'Aleksi Munter',        side: 'riina', avec: 'Olenka Munter' },
  { name: 'Olenka Munter',        side: 'riina', avec: 'Aleksi Munter' },

  { name: 'Santeri Kallio',       side: 'riina', avec: 'Wilhelmiina Vilhunen' },
  { name: 'Wilhelmiina Vilhunen', side: 'riina', avec: 'Santeri Kallio' },

  { name: 'Sami Boman',           side: 'riina', avec: 'Mia Itkonen' },
  { name: 'Mia Itkonen',          side: 'riina', avec: 'Sami Boman' },

  { name: 'Eliel Koivu',          side: 'riina', avec: 'AJ Schon' },
  { name: 'AJ Schon',             side: 'riina', avec: 'Eliel Koivu' },

  { name: 'Taneli Jarva',         side: 'riina', avec: 'Emma Ceau' },
  { name: 'Emma Ceau',            side: 'riina', avec: 'Taneli Jarva' },

  { name: 'Sami Hinkka',          side: 'riina', avec: 'Melodie Ohnehem' },
  { name: 'Melodie Ohnehem',      side: 'riina', avec: 'Sami Hinkka' },

  { name: 'Teppo Ristola',        side: 'riina', avec: 'Tytti Hujanen' },
  { name: 'Tytti Hujanen',        side: 'riina', avec: 'Teppo Ristola' },

  { name: 'Cristian Vuorivirta',  side: 'riina', avec: 'Johnny Vuorivirta' },
  { name: 'Johnny Vuorivirta',    side: 'riina', avec: 'Cristian Vuorivirta' },

  { name: 'Mikko Rauvola',        side: 'riina', avec: 'Rauvolan rouva' },
  { name: 'Rauvolan rouva',       side: 'riina', avec: 'Mikko Rauvola' },

  { name: 'Jenny Lehtelä',        side: 'riina', avec: 'Leevi Lehtelä' },
  { name: 'Leevi Lehtelä',        side: 'riina', avec: 'Jenny Lehtelä' },

  { name: 'Paula Oksman',         side: 'riina', avec: 'Jari Heino' },
  { name: 'Jari Heino',           side: 'riina', avec: 'Paula Oksman' },

  { name: 'Mika Oksman',          side: 'riina', avec: 'Sari' },
  { name: 'Sari',                 side: 'riina', avec: 'Mika Oksman' },

  { name: 'Marika Ripatti',       side: 'riina', avec: 'Mika Ripatti' },
  { name: 'Mika Ripatti',         side: 'riina', avec: 'Marika Ripatti' },

  // Solo
  { name: 'Aino Järventaus',      side: 'riina' },
  { name: 'Karoliina Harjula',    side: 'riina' },
  { name: 'Laura Vähähyyppä',     side: 'riina' },
  { name: 'Hippo Taatila',        side: 'riina' },
  { name: 'Viljami Puustinen',    side: 'riina' },
  { name: 'Joel Jännes',          side: 'riina' },
  { name: 'Paul Henry Nordman',   side: 'riina' },
  { name: 'Aino Hyttinen',        side: 'riina' },
  { name: 'Wiltsi Karjalainen',   side: 'riina' },
  { name: 'Rasmus Stoltzenberg',  side: 'riina', answered: 'accepted' },
  { name: 'Samuel Ruotsalainen',  side: 'riina' },
  { name: 'Jonne Lehtonen',       side: 'riina' },
  { name: 'Gunnar Sauermann',     side: 'riina' },
  { name: 'Heidi Vornanen',       side: 'riina' },
  { name: 'Hanna Wendelin',       side: 'riina' },
  { name: 'Tarja Leskinen',       side: 'riina' },
  { name: 'Kjell Simosas',        side: 'riina' },
  { name: 'Ville Markkanen',      side: 'riina' },
  { name: 'Daniel Moilanen',      side: 'riina' },
  { name: 'Niklas Sandin',        side: 'riina' },
  { name: 'Carrie Zaray',         side: 'riina' },
  { name: 'Carissa Shaul',        side: 'riina' },
  { name: 'Lauri Rinkinen',       side: 'riina' },
  { name: 'Joni Kinnunen',        side: 'riina' },

  // ── HENRIK'S SIDE ────────────────────────────────────────────────────────

  // Couples (both named)
  { name: 'Tomas Danska',         side: 'henrik', avec: 'Danskas wife' },
  { name: 'Danskas wife',         side: 'henrik', avec: 'Tomas Danska' },

  { name: 'Leandro Righini',      side: 'henrik', avec: 'Mari Righini' },
  { name: 'Mari Righini',         side: 'henrik', avec: 'Leandro Righini' },

  // avec_offered — coming as 2, partner name unknown
  { name: 'Uffe Norström',        side: 'henrik', avec_offered: true },
  { name: 'Peppe',                side: 'henrik', avec_offered: true },
  { name: 'Anders Göransson',     side: 'henrik', avec_offered: true },
  { name: 'Fredrik Lundgren',     side: 'henrik', avec_offered: true },
  { name: 'Friida Turku',         side: 'henrik', avec_offered: true },
  { name: 'Fredrik Axlund',       side: 'henrik', avec_offered: true },
  { name: 'Anna Axlund',          side: 'henrik', avec_offered: true },
  { name: 'Linus Löfgren',        side: 'henrik', avec_offered: true },
  { name: 'Lena Axlund',          side: 'henrik', avec_offered: true },
  { name: 'Tom Murray',           side: 'henrik', avec_offered: true },
  { name: 'Rici Siren',           side: 'henrik', avec_offered: true },
  { name: 'JC Delgado',           side: 'henrik', avec_offered: true },
  { name: 'Karolina Miller',      side: 'henrik', avec_offered: true },

  // Solo
  { name: 'Robban Nyström',       side: 'henrik' },
  { name: 'Hanna Löfgren',        side: 'henrik' },
  { name: 'Anders Löfgren',       side: 'henrik' },
  { name: 'Kicki Löfgren',        side: 'henrik' },
  { name: 'Kaj Axlund',           side: 'henrik' },
  { name: 'Pete Ruikka',          side: 'henrik' },
  { name: 'Tania Hoffren',        side: 'henrik' },
];

for (const g of guests) {
  await sql`
    INSERT INTO guests (id, name, side, std_sent, invited, answered, avec_offered, avec)
    VALUES (
      ${randomUUID()}, ${g.name}, ${g.side},
      false, false, ${g.answered ?? null},
      ${!!g.avec_offered}, ${g.avec ?? null}
    )
  `;
  const tag = g.avec ? `↔ ${g.avec}` : g.avec_offered ? '+1 TBD' : 'solo';
  console.log(`✓  [${g.side.padEnd(6)}]  ${g.name.padEnd(26)}  ${tag}`);
}

await sql.end();
const r = guests.filter(g => g.side === 'riina').length;
const h = guests.filter(g => g.side === 'henrik').length;
console.log(`\nDone — ${guests.length} guests total  (Riina: ${r}  Henrik: ${h})`);
