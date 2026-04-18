/**
 * Inspection-draft CRUD against local SQLite.
 *
 * A draft is the user's in-progress inspection before they tap
 * "Submit for scan". It survives app relaunch and offline time,
 * then syncs to the server as a single inspection row once all
 * photos have uploaded.
 */
import { openDb } from "./db";

export interface InspectionDraft {
  id: string;
  /** Arbitrary JSON payload — matches the web form shape. */
  payload: Record<string, unknown>;
  updatedAt: number;
  syncedAt: number | null;
  /**
   * Server UUID returned by /api/inspection/create after the Review &
   * Send step. Null until the draft has been pushed. Used to populate
   * photos.inspection_id before the sync loop uploads bytes.
   */
  serverInspectionId?: string | null;
}

/** Generate a client-side id. ULID-ish but simpler: timestamp + random. */
export function newDraftId(): string {
  return `draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveDraft(draft: InspectionDraft): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await db.run(
    `INSERT INTO drafts (id, payload_json, updated_at, synced_at, server_inspection_id)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       payload_json = excluded.payload_json,
       updated_at = excluded.updated_at`,
    [
      draft.id,
      JSON.stringify(draft.payload),
      draft.updatedAt,
      draft.syncedAt,
      draft.serverInspectionId ?? null,
    ],
  );
}

export async function loadDraft(id: string): Promise<InspectionDraft | null> {
  const db = await openDb();
  if (!db) return null;
  const res = await db.query(`SELECT * FROM drafts WHERE id = ? LIMIT 1`, [id]);
  const row = res.values?.[0];
  if (!row) return null;
  return {
    id: row.id,
    payload: JSON.parse(row.payload_json),
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
    serverInspectionId: row.server_inspection_id ?? null,
  };
}

export async function listDrafts(): Promise<InspectionDraft[]> {
  const db = await openDb();
  if (!db) return [];
  const res = await db.query(`SELECT * FROM drafts ORDER BY updated_at DESC`);
  return (res.values ?? []).map((row) => ({
    id: row.id,
    payload: JSON.parse(row.payload_json),
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
    serverInspectionId: row.server_inspection_id ?? null,
  }));
}

export async function attachServerInspectionId(
  draftId: string,
  inspectionId: string,
): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await db.run(
    `UPDATE drafts SET server_inspection_id = ? WHERE id = ?`,
    [inspectionId, draftId],
  );
}

export async function deleteDraft(id: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await db.run(`DELETE FROM drafts WHERE id = ?`, [id]);
  // ON DELETE CASCADE removes related photos + queue entries.
}

export async function markDraftSynced(id: string, syncedAt: number): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await db.run(`UPDATE drafts SET synced_at = ? WHERE id = ?`, [syncedAt, id]);
}
