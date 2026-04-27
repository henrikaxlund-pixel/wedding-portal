import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Lazy singleton — only opens on first use (not at build time)
let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const DB_PATH = path.join(dataDir, 'wedding.db');
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  initSchema(_db);
  return _db;
}

// Proxy so callers can use `db.prepare(...)` directly as before
const db = new Proxy({} as Database.Database, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

function initSchema(db: Database.Database) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT,
    image       TEXT,
    role        TEXT NOT NULL DEFAULT 'helper',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id                  TEXT PRIMARY KEY,
    user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider            TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    access_token        TEXT,
    refresh_token       TEXT,
    expires_at          INTEGER,
    token_type          TEXT,
    scope               TEXT,
    id_token            TEXT,
    UNIQUE(provider, provider_account_id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id            TEXT PRIMARY KEY,
    session_token TEXT UNIQUE NOT NULL,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires       TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier TEXT NOT NULL,
    token      TEXT NOT NULL,
    expires    TEXT NOT NULL,
    PRIMARY KEY (identifier, token)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id          TEXT PRIMARY KEY,
    column      TEXT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    status      TEXT NOT NULL DEFAULT 'not_started',
    position    INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id          TEXT PRIMARY KEY,
    task_id     TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    filename    TEXT NOT NULL,
    original    TEXT NOT NULL,
    mimetype    TEXT,
    size        INTEGER,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
}

export default db;
