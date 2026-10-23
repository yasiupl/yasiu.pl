// The database of the actor @blog@yasiu.pl: followers, replies, reactions, the known posts and the
// delivery queue (see README.md, "Fediverse"). It is one SQLite file in DATA_DIR. On blade12,
// DATA_DIR is a volume (see infra/api/docker-compose.yml).
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS actors (id TEXT PRIMARY KEY, json TEXT NOT NULL, fetched_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS followers (
  actor TEXT PRIMARY KEY, inbox TEXT NOT NULL, shared_inbox TEXT, follow_id TEXT, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS replies (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL, in_reply_to TEXT NOT NULL, actor TEXT NOT NULL, url TEXT,
  published TEXT, updated TEXT, summary TEXT, content TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS replies_slug ON replies (slug);
CREATE TABLE IF NOT EXISTS reactions (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, actor TEXT NOT NULL, slug TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS reactions_slug ON reactions (slug);
CREATE TABLE IF NOT EXISTS posts (object TEXT PRIMARY KEY, updated TEXT, json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT, inbox TEXT NOT NULL, body TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
  next_at INTEGER NOT NULL, created_at INTEGER NOT NULL, last_error TEXT);
CREATE INDEX IF NOT EXISTS deliveries_next ON deliveries (next_at);
`;

let db;

export function apDb() {
  if (!db) {
    const dir = process.env.DATA_DIR || './.data';
    mkdirSync(dir, { recursive: true });
    db = new DatabaseSync(join(dir, 'activitypub.sqlite'));
    db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
    db.exec(SCHEMA);
  }
  return db;
}

export function apMeta(key, value) {
  const d = apDb();
  if (value === undefined) return d.prepare('SELECT value FROM meta WHERE key = ?').get(key)?.value ?? null;
  d.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value').run(key, value);
  return value;
}
