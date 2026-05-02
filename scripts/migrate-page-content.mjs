import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database(join(process.cwd(), 'data', 'wedding.db'));
db.prepare("DELETE FROM page_content WHERE key IN ('venue_title','venue_body','program_title','program_body')").run();
console.log('✓ Removed old venue/program keys');
db.close();
