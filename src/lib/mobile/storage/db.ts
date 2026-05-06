/**
 * Local SQLite store for the mobile shell.
 *
 * Two reasons for SQLite instead of IndexedDB or Preferences:
 *   1. Photos can be heavy. We store metadata + file path in SQLite
 *      and the actual bytes on Capacitor Filesystem, so the DB stays
 *      small and queryable.
 *   2. We need range queries (pending_uploads ORDER BY attempt_count)
 *      which are awkward on IndexedDB.
 *
 * On the web the SQLite plugin has a jeep-sqlite WebAssembly fallback.
 * We don't install that here because the web path already uses server
 * endpoints directly — local buffering is a mobile-only concern.
 * If you hit "Not implemented on web" you tried to call the DB in a
 * browser context. Guard the call site with isNative() first.
 */
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { isNative } from "../platform";

const DB_NAME = "tenu_local";
const DB_VERSION = 2;

let connection: SQLiteConnection | null = null;
let db: SQLiteDBConnection | null = null;

/**
 * Idempotent init. Safe to call from every screen `useEffect`.
 * Resolves with null on web — caller must handle that.
 */
export async function openDb(): Promise<SQLiteDBConnection | null> {
  if (!isNative()) return null;
  if (db) return db;

  if (!connection) {
    connection = new SQLiteConnection(CapacitorSQLite);
  }

  const isConn = (await connection.isConnection(DB_NAME, false)).result;
  db = isConn
    ? await connection.retrieveConnection(DB_NAME, false)
    : await connection.createConnection(DB_NAME, false, "no-encryption", DB_VERSION, false);

  await db.open();
  await migrate(db);
  return db;
}

async function migrate(conn: SQLiteDBConnection): Promise<void> {
  // v1 — drafts, photos, upload_queue.
  // v2 — adds drafts.server_inspection_id and photos.inspection_id so
  //       the sync engine can tie each buffered photo to the server
  //       inspection row materialized by /api/inspection/create. These
  //       columns are nullable on creation; Review & Send fills them
  //       before the sync loop drains the queue.
  const statements = [
    `CREATE TABLE IF NOT EXISTS drafts (
      id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      synced_at INTEGER,
      server_inspection_id TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      draft_id TEXT NOT NULL,
      inspection_id TEXT,
      room_id TEXT NOT NULL,
      local_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      sha256 TEXT NOT NULL,
      exif_timestamp TEXT,
      captured_at INTEGER NOT NULL,
      remote_key TEXT,
      uploaded_at INTEGER,
      FOREIGN KEY (draft_id) REFERENCES drafts (id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS upload_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photo_id TEXT NOT NULL UNIQUE,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      last_attempt_at INTEGER,
      last_error TEXT,
      FOREIGN KEY (photo_id) REFERENCES photos (id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_photos_draft ON photos (draft_id)`,
    `CREATE INDEX IF NOT EXISTS idx_photos_inspection ON photos (inspection_id)`,
    `CREATE INDEX IF NOT EXISTS idx_queue_attempts ON upload_queue (attempt_count, last_attempt_at)`,
  ];

  for (const sql of statements) {
    await conn.execute(sql);
  }

  // Best-effort ALTERs for pre-v2 installs (SQLite accepts a duplicate
  // column error silently when wrapped in try/catch; we just keep going).
  try {
    await conn.execute(`ALTER TABLE drafts ADD COLUMN server_inspection_id TEXT`);
  } catch {
    // column already exists
  }
  try {
    await conn.execute(`ALTER TABLE photos ADD COLUMN inspection_id TEXT`);
  } catch {
    // column already exists
  }
  // v3 — intent cache columns on upload_queue for upload-resume on reconnect
  try { await conn.execute(`ALTER TABLE upload_queue ADD COLUMN intent_url TEXT`); } catch { /* exists */ }
  try { await conn.execute(`ALTER TABLE upload_queue ADD COLUMN intent_key TEXT`); } catch { /* exists */ }
  try { await conn.execute(`ALTER TABLE upload_queue ADD COLUMN intent_headers TEXT`); } catch { /* exists */ }
  try { await conn.execute(`ALTER TABLE upload_queue ADD COLUMN intent_fetched_at INTEGER`); } catch { /* exists */ }
}

export async function closeDb(): Promise<void> {
  if (!connection || !db) return;
  await connection.closeConnection(DB_NAME, false);
  db = null;
  connection = null;
}
