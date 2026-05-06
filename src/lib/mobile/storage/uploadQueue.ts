/**
 * Upload queue — rows added by savePhotoLocally, drained by the sync
 * engine. Failure bumps attempt_count; we back off exponentially and
 * cap at 8 attempts before surfacing to the UI as "stuck".
 */
import { openDb } from "./db";

export interface QueueItem {
  id: number;
  photoId: string;
  attemptCount: number;
  lastAttemptAt: number | null;
  lastError: string | null;
}

export async function nextPendingBatch(limit = 4): Promise<QueueItem[]> {
  const db = await openDb();
  if (!db) return [];
  const res = await db.query(
    `SELECT * FROM upload_queue
     WHERE attempt_count < 8
     ORDER BY attempt_count ASC, COALESCE(last_attempt_at, 0) ASC
     LIMIT ?`,
    [limit],
  );
  return (res.values ?? []).map((row) => ({
    id: row.id as number,
    photoId: row.photo_id as string,
    attemptCount: row.attempt_count as number,
    lastAttemptAt: (row.last_attempt_at as number | null) ?? null,
    lastError: (row.last_error as string | null) ?? null,
  }));
}

export async function recordAttemptFailure(
  photoId: string,
  error: string,
): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await db.run(
    `UPDATE upload_queue
       SET attempt_count = attempt_count + 1,
           last_attempt_at = ?,
           last_error = ?
     WHERE photo_id = ?`,
    [Date.now(), error.slice(0, 500), photoId],
  );
}

export async function stuckCount(): Promise<number> {
  const db = await openDb();
  if (!db) return 0;
  const res = await db.query(
    `SELECT COUNT(*) AS n FROM upload_queue WHERE attempt_count >= 8`,
  );
  return (res.values?.[0]?.n as number) ?? 0;
}

/**
 * Exponential back-off: 2^attempt seconds, max 5 minutes.
 * Caller checks this before retrying a given item.
 */
export function shouldRetryNow(item: QueueItem, now = Date.now()): boolean {
  if (item.attemptCount === 0) return true;
  if (!item.lastAttemptAt) return true;
  const delayMs = Math.min(2 ** item.attemptCount * 1000, 300_000);
  return now - item.lastAttemptAt >= delayMs;
}

// ─── Upload-resume intent cache ──────────────────────────────────────────────
// R2 presigned PUT URLs are valid for 5 minutes. Caching the intent in SQLite
// means a retry after a mid-upload network drop reuses the same R2 key rather
// than issuing a new presigned URL (which would create an orphaned partial object).
// TTL is 4.5 min — 30 s buffer before the URL actually expires.

const INTENT_TTL_MS = 4.5 * 60 * 1000;

export interface StoredIntent {
  url: string;
  key: string;
  headers: Record<string, string>;
  fetchedAt: number;
}

export async function storeIntent(
  photoId: string,
  intent: Omit<StoredIntent, "fetchedAt">,
): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await db.run(
    `UPDATE upload_queue
       SET intent_url = ?, intent_key = ?, intent_headers = ?, intent_fetched_at = ?
     WHERE photo_id = ?`,
    [intent.url, intent.key, JSON.stringify(intent.headers), Date.now(), photoId],
  );
}

export async function loadIntent(photoId: string): Promise<StoredIntent | null> {
  const db = await openDb();
  if (!db) return null;
  const res = await db.query(
    `SELECT intent_url, intent_key, intent_headers, intent_fetched_at
       FROM upload_queue WHERE photo_id = ? LIMIT 1`,
    [photoId],
  );
  const row = res.values?.[0];
  if (!row?.intent_url || !row.intent_fetched_at) return null;
  const fetchedAt = row.intent_fetched_at as number;
  if (Date.now() - fetchedAt > INTENT_TTL_MS) return null;
  return {
    url: row.intent_url as string,
    key: row.intent_key as string,
    headers: JSON.parse((row.intent_headers as string | null) ?? "{}") as Record<string, string>,
    fetchedAt,
  };
}

export async function clearIntent(photoId: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await db.run(
    `UPDATE upload_queue
       SET intent_url = NULL, intent_key = NULL, intent_headers = NULL, intent_fetched_at = NULL
     WHERE photo_id = ?`,
    [photoId],
  );
}
