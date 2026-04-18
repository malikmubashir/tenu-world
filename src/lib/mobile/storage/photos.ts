/**
 * Local photo store — writes the image bytes to Capacitor Filesystem
 * and a metadata row to SQLite. The web fallback keeps a Blob URL in
 * memory (no offline buffering on the web mobile browser — if the tab
 * closes, the draft survives but the photo doesn't, by design).
 */
import { Filesystem, Directory } from "@capacitor/filesystem";
import { openDb } from "./db";
import { isNative } from "../platform";
import type { CapturedPhoto } from "../camera";

export interface LocalPhotoRecord {
  id: string;
  draftId: string;
  /**
   * Server-side inspection UUID. Null until the Review & Send step
   * materializes the draft via /api/inspection/create. The sync loop
   * skips photos with a null inspectionId.
   */
  inspectionId: string | null;
  roomId: string;
  localPath: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  exifTimestamp: string | null;
  capturedAt: number;
  remoteKey: string | null;
  uploadedAt: number | null;
}

export function newPhotoId(): string {
  return `photo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Persist a freshly-captured photo to local storage + enqueue it for
 * upload. Returns the saved record.
 */
export async function savePhotoLocally(
  draftId: string,
  roomId: string,
  photo: CapturedPhoto,
  hash: string,
  exifTimestamp: string | null,
): Promise<LocalPhotoRecord> {
  const id = newPhotoId();
  const ext = photo.mimeType.split("/")[1] || "jpg";
  const filename = `${id}.${ext}`;
  const capturedAt = Date.now();
  const sizeBytes = photo.blob.size;

  let localPath = "";

  if (isNative()) {
    const base64 = await blobToBase64(photo.blob);
    const result = await Filesystem.writeFile({
      path: `photos/${draftId}/${filename}`,
      data: base64,
      directory: Directory.Data,
      recursive: true,
    });
    localPath = result.uri;
  } else {
    // On the web we keep the blob URL only. Not persistent across
    // tab close — acceptable for the scaffold; the mobile build is
    // the real target.
    localPath = photo.previewUrl;
  }

  const record: LocalPhotoRecord = {
    id,
    draftId,
    inspectionId: null,
    roomId,
    localPath,
    mimeType: photo.mimeType,
    sizeBytes,
    sha256: hash,
    exifTimestamp,
    capturedAt,
    remoteKey: null,
    uploadedAt: null,
  };

  const db = await openDb();
  if (db) {
    await db.run(
      `INSERT INTO photos (id, draft_id, inspection_id, room_id, local_path, mime_type, size_bytes, sha256, exif_timestamp, captured_at, remote_key, uploaded_at)
       VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
      [id, draftId, roomId, localPath, photo.mimeType, sizeBytes, hash, exifTimestamp, capturedAt],
    );
    await db.run(
      `INSERT INTO upload_queue (photo_id, attempt_count) VALUES (?, 0)`,
      [id],
    );
  }

  return record;
}

export async function listPhotosForDraft(draftId: string): Promise<LocalPhotoRecord[]> {
  const db = await openDb();
  if (!db) return [];
  const res = await db.query(
    `SELECT * FROM photos WHERE draft_id = ? ORDER BY captured_at ASC`,
    [draftId],
  );
  return (res.values ?? []).map(rowToRecord);
}

export async function listPhotosForRoom(
  draftId: string,
  roomId: string,
): Promise<LocalPhotoRecord[]> {
  const db = await openDb();
  if (!db) return [];
  const res = await db.query(
    `SELECT * FROM photos WHERE draft_id = ? AND room_id = ? ORDER BY captured_at ASC`,
    [draftId, roomId],
  );
  return (res.values ?? []).map(rowToRecord);
}

export async function markPhotoUploaded(
  photoId: string,
  remoteKey: string,
): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await db.run(
    `UPDATE photos SET remote_key = ?, uploaded_at = ? WHERE id = ?`,
    [remoteKey, Date.now(), photoId],
  );
  await db.run(`DELETE FROM upload_queue WHERE photo_id = ?`, [photoId]);
}

export async function readPhotoBytes(record: LocalPhotoRecord): Promise<Blob> {
  if (!isNative()) {
    // Web fallback — re-fetch the blob URL.
    const res = await fetch(record.localPath);
    return res.blob();
  }
  // On native, the localPath is a file:// URI. Fetch can read it.
  const res = await fetch(record.localPath);
  return res.blob();
}

function rowToRecord(row: Record<string, unknown>): LocalPhotoRecord {
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

/**
 * Back-fills photos.inspection_id for every buffered photo in a draft,
 * once the server has minted an inspection row. Called from Review &
 * Send after /api/inspection/create returns.
 */
export async function attachInspectionToDraftPhotos(
  draftId: string,
  inspectionId: string,
): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await db.run(
    `UPDATE photos SET inspection_id = ? WHERE draft_id = ? AND inspection_id IS NULL`,
    [inspectionId, draftId],
  );
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // strip data:image/...;base64, prefix
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
