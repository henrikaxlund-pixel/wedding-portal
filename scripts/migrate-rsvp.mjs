import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database(join(process.cwd(), 'data', 'wedding.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS guests_new (
    id                   TEXT PRIMARY KEY,
    name                 TEXT NOT NULL,
    side                 TEXT NOT NULL DEFAULT 'henrik',
    std_sent             INTEGER NOT NULL DEFAULT 0,
    invited              INTEGER NOT NULL DEFAULT 0,
    answered             TEXT,
    avec                 TEXT,
    rsvp_by              TEXT,
    table_no             TEXT,
    dietary_restrictions TEXT,
    notes                TEXT,
    created_at           TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
  );

  INSERT INTO guests_new
    SELECT id, name, side, std_sent, invited,
      CASE WHEN answered = 1 THEN 'accepted' ELSE NULL END,
      avec, rsvp_by, table_no, dietary_restrictions, notes, created_at, updated_at
    FROM guests;

  DROP TABLE guests;
  ALTER TABLE guests_new RENAME TO guests;
`);

console.log('✓ Migrated answered to nullable text (accepted/declined/null)');
db.close();
