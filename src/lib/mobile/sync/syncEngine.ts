/**
 * Sync engine — drains the local upload queue to R2 via presigned URLs
 * issued by the tenu.world API.
 *
 * Flow per photo:
 *   1. POST /api/mobile/upload-intent  → { url, key, headers }
 *   2. PUT url with raw bytes          → R2 stores the object
 *   3. POST /api/mobile/upload-commit  → writes photos row server-side
 *   4. Mark local photo uploaded
 *
 * Prerequisite: the draft must already have a server-side inspection
 * row (draft.serverInspectionId !== null). The materialization call
 * /api/inspection/create is triggered from the Review & Send step,
 * NOT here. This engine only ships photos whose parent inspection
 * already exists; photos with no inspectionId are skipped with a
 * "draft-not-synced" reason.
 *
 * Online/offline detection is Capacitor Network on device, navigator
 * on web. The engine runs as a simple interval loop; no workers.
 */
import { Network } from "@capacitor/network";
import {
  nextPendingBatch,
  recordAttemptFailure,
  shouldRetryNow,
} from "../storage/uploadQueue";
import {
  listPhotosForDraft,
  markPhotoUploaded,
  readPhotoBytes,
  type LocalPhotoRecord,
} from "../storage/photos";
import { openDb } from "../storage/db";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://tenu.world";

export interface SyncResult {
  uploaded: number;
  failed: number;
  skipped: number;
}

export async function drainOnce(
  authToken: string | null,
): Promise<SyncResult> {
  const online = await isOnline();
  if (!online || !authToken) {
    return { uploaded: 0, failed: 0, skipped: 0 };
  }

  const batch = await nextPendingBatch(4);
  let uploaded = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of batch) {
    if (!shouldRetryNow(item)) {
      skipped++;
      continue;
    }
    const photo = await loadPhotoById(item.photoId);
    if (!photo) {
      skipped++;
      continue;
    }
    if (!photo.inspectionId) {
      // Draft not yet materialized into a server-side inspection row.
      // Skip quietly — the Review & Send step will set inspectionId and
      // the next tick will pick it up.
      skipped++;
      continue;
    }
    try {
      const key = await uploadPhoto(photo, authToken);
      await markPhotoUploaded(photo.id, key);
      uploaded++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      await recordAttemptFailure(photo.id, message);
      failed++;
    }
  }

  return { uploaded, failed, skipped };
}

async function uploadPhoto(
  photo: LocalPhotoRecord,
  authToken: string,
): Promise<string> {
  // 1. Intent — ask server for a presigned PUT URL.
  const intentRes = await fetch(`${API_BASE}/api/mobile/upload-intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      inspectionId: photo.inspectionId,
      roomId: photo.roomId,
      mimeType: photo.mimeType,
      sizeBytes: photo.sizeBytes,
      sha256: photo.sha256,
    }),
  });
  if (!intentRes.ok) {
    throw new Error(`upload-intent ${intentRes.status}`);
  }
  const intent = (await intentRes.json()) as {
    url: string;
    key: string;
    headers?: Record<string, string>;
  };

  // 2. PUT the bytes directly to R2.
  const bytes = await readPhotoBytes(photo);
  const putRes = await fetch(intent.url, {
    method: "PUT",
    headers: {
      "Content-Type": photo.mimeType,
      ...(intent.headers ?? {}),
    },
    body: bytes,
  });
  if (!putRes.ok) {
    throw new Error(`r2 put ${putRes.status}`);
  }

  // 3. Commit — server records the photos row + evidence chain fields.
  const commitRes = await fetch(`${API_BASE}/api/mobile/upload-commit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      inspectionId: photo.inspectionId,
      roomId: photo.roomId,
      key: intent.key,
      mimeType: photo.mimeType,
      sizeBytes: photo.sizeBytes,
      sha256: photo.sha256,
      exifTimestamp: photo.exifTimestamp,
      capturedAt: new Date(photo.capturedAt).toISOString(),
    }),
  });
  if (!commitRes.ok) {
    throw new Error(`upload-commit ${commitRes.status}`);
  }

  return intent.key;
}

async function loadPhotoById(id: string): Promise<LocalPhotoRecord | null> {
  const db = await openDb();
  if (!db) return null;
  const res = await db.query(`SELECT * FROM photos WHERE id = ? LIMIT 1`, [id]);
  const row = res.values?.[0];
  if (!row) return null;
  return {
    id: row.id as string,
    draftId: row.draft_id as string,
    inspectionId: (row.inspection_id as string | null) ?? null,
    roomId: row.room_id as string,
    localPath: row.local_path as string,
    mimeType: row.mime_type as string,
    sizeBytes: row.size_bytes as number,
    sha256: row.sha256 as string,
    exifTimestamp: (row.exif_timestamp as string | null) ?? null,
    capturedAt: row.captured_at as number,
    remoteKey: (row.remote_key as string | null) ?? null,
    uploadedAt: (row.uploaded_at as number | null) ?? null,
  };
}

async function isOnline(): Promise<boolean> {
  try {
    const status = await Network.getStatus();
    return status.connected;
  } catch {
    // Network plugin not available (e.g. server build, tests).
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  }
}

/**
 * Fire-and-forget background loop. Call once from the mobile shell
 * `useEffect`. Returns a stop function.
 */
export function startSyncLoop(
  getAuthToken: () => Promise<string | null>,
  intervalMs = 15_000,
): () => void {
  let stopped = false;
  (async function loop() {
    while (!stopped) {
      try {
        const token = await getAuthToken();
        await drainOnce(token);
      } catch {
        // Swallow — next tick will try again.
      }
      await sleep(intervalMs);
    }
  })();
  return () => {
    stopped = true;
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// DONE(2026-04-18): /api/mobile/upload-intent and /api/mobile/upload-commit
// are implemented. Intent returns a 5-min presigned PUT URL; commit
// writes the photos row with sha256 + EXIF. Next gap: /api/inspection/
// create hook from the mobile Review & Send step, so draft.serverInspectionId
// gets populated before the sync loop finds the photos.
