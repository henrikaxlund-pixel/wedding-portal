import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env.local', quiet: true });
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

const sections = [
  { id: 'guest-info-adults', title: '', body: 'We love your kids but this event is for adults only <3' },
  { id: 'guest-info-dresscode', title: 'Dresscode', body: 'A festive you.' },
  {
    id: 'guest-info-accommodation', title: 'Accommodation',
    body: 'Hotels nearby\n\n[Noli Sörnäinen](https://nolistudios.com/locations/helsinki/noli-sornainen/)\n[Citybox Helsinki](https://cityboxhotels.com/fi/hotels/helsinki/helsinki)\n[Scandic Hakaniemi](https://www.scandichotels.com/fi/hotellit/scandic-hakaniemi)\n[Scandic Kallio](https://www.scandichotels.com/fi/hotellit/scandic-kallio)\n[Hilton Helsinki Strand](https://www.hilton.com/fi/hotels/helhihi-hilton-helsinki-strand/)',
  },
  {
    id: 'guest-info-transportation', title: 'Transportation',
    body: 'In addition to Ubers, Bolts and taxis, HSL public transport drops you next to the venue.\n\n[HSL public transport](https://www.hsl.fi/)',
  },
  {
    id: 'guest-info-arrival', title: 'Arrival',
    body: 'The venue is located under [Siltanen](https://maps.app.goo.gl/GUGq4iJSLcWj8JGr6). The Hämeentie gate will remain closed, so guests should arrive through the courtyard in Kaikukatu. Follow the signage.',
  },
  {
    id: 'guest-info-gifts', title: 'Gifts',
    body: 'We do not need more material things. If you wish to gift the couple, contributions to the honeymoon account are most welcome.',
  },
];

try {
  await sql.begin(async tx => {
    // Lock this content row so a concurrent edit cannot be overwritten.
    await tx`INSERT INTO page_content (key, value, updated_at) VALUES ('modules', '[]', NOW()) ON CONFLICT (key) DO NOTHING`;
    const [row] = await tx`SELECT value FROM page_content WHERE key = 'modules' FOR UPDATE`;
    const existing = JSON.parse(row.value);
    if (!Array.isArray(existing)) throw new Error('Existing modules are not an array; no changes made');
    const additions = sections.filter(section => !existing.some(module => module.id === section.id));
    if (additions.length) {
      await tx`UPDATE page_content SET value = ${JSON.stringify([...existing, ...additions])}, updated_at = NOW() WHERE key = 'modules'`;
    }
    console.log(`Added ${additions.length} guest information sections; preserved ${existing.length} existing sections.`);
  });
} finally {
  await sql.end();
}
