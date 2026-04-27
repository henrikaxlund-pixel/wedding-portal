/**
 * Creates the initial admin user (Henrik).
 * Run once: node scripts/seed-admin.mjs
 */
import Database from 'better-sqlite3';
import { createHash, randomUUID } from 'crypto';
import { scryptSync, randomBytes } from 'crypto';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

// We use bcryptjs via require since this is a plain .mjs script
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const db = new Database(join(dataDir, 'wedding.db'));
db.pragma('foreign_keys = ON');

// Create users table if it doesn't exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT,
    image       TEXT,
    role        TEXT NOT NULL DEFAULT 'helper',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const EMAIL = 'henrik@example.com'; // Change to your real email
const PASSWORD = 'changeme123';     // Change to your real password
const NAME = 'Henrik';

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(EMAIL);
if (existing) {
  console.log(`✓ Admin user already exists: ${EMAIL}`);
} else {
  const hashed = bcrypt.hashSync(PASSWORD, 12);
  const id = randomUUID();
  db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)')
    .run(id, NAME, EMAIL, hashed, 'admin');
  console.log(`✓ Created admin user: ${EMAIL} (password: ${PASSWORD})`);
  console.log('  → Change the password after first login or edit this script.');
}

db.close();
