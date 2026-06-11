import "server-only";

/**
 * R2 erasure for RGPD Art. 17 (droit à l'effacement / right to erasure).
 *
 * Closes the gap recorded in docs/architecture/04-Security.md §8.5 and
 * docs/17-Bear-Bull-Adjudicated-2026-06-11.md finding 3: the account
 * deletion route cascaded DB rows but left R2 blobs behind — photos
 * relied on a 30-day lifecycle rule and generated PDFs (which contain
 * the address, names and photos) were NEVER purged.
 *
 * Strategy (belt and braces):
 *   1. Enumerate every R2 key recorded in the database for the user:
 *      photos.r2_key, inspections.contract_pdf_r2_key, the scan-report
 *      PDF url folded into inspections.risk_score jsonb (pdfUrl), and
 *      dispute_letters.letter_pdf_url (schema column; defensive — no
 *      code path writes it yet).
 *   2. Additionally list the whole `${userId}/` prefix in the bucket.
 *      Every upload path namespaces keys under the user id
 *      (r2-upload.ts, upload-intent, render-and-upload), so the prefix
 *      sweep catches orphans whose DB rows are already gone.
 *   3. Delete the union in batches of <= 1000 keys (DeleteObjects API
 *      ceiling). Missing objects are a success (idempotent erasure).
 *      Per-key failures are collected, logged by the caller for a
 *      manual sweep, and NEVER block the DB erasure — a single 404 or
 *      transient R2 error must not stop the user from leaving.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface R2PurgeFailure {
  key: string;
  error: string;
}

export interface R2PurgeResult {
  /** Distinct keys we attempted to delete (DB-recorded ∪ prefix listing). */
  attempted: number;
  /** Keys confirmed gone (deleted now, or already absent — idempotent). */
  deleted: number;
  /** Keys that could not be deleted — caller logs these for manual sweep. */
  failed: R2PurgeFailure[];
}

/**
 * Minimal structural S3 surface so unit tests can inject a fake client.
 * Methods are bivariant in TS, so the real S3Client satisfies this shape.
 */
interface S3LikeResponse {
  Contents?: { Key?: string }[];
  IsTruncated?: boolean;
  NextContinuationToken?: string;
  Errors?: { Key?: string; Code?: string; Message?: string }[];
}
export interface S3Like {
  send(command: unknown): Promise<S3LikeResponse>;
}

/**
 * Derive the R2 object key from a stored URL. Handles both shapes the
 * codebase writes:
 *   - `${R2_PUBLIC_URL}/${key}` (r2-upload.ts when the public host is set)
 *   - `https://<account>.r2.cloudflarestorage.com/<bucket>/<key>`
 *     (render-and-upload.tsx and the r2-upload fallback)
 * Returns null when the URL cannot be parsed into a key.
 */
export function keyFromR2Url(url: string | null | undefined): string | null {
  if (!url) return null;
  const publicBase = process.env.R2_PUBLIC_URL;
  if (publicBase && url.startsWith(`${publicBase}/`)) {
    return url.slice(publicBase.length + 1) || null;
  }
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\/+/, "");
    if (parsed.hostname.endsWith(".r2.cloudflarestorage.com")) {
      // Path-style URL: first segment is the bucket name.
      const slash = path.indexOf("/");
      return slash === -1 ? null : path.slice(slash + 1) || null;
    }
    return path || null;
  } catch {
    return null;
  }
}

/**
 * Enumerate every R2 key the database records for this user.
 *
 * Query failures are tolerated (logged, partial result returned): the
 * `${userId}/` prefix sweep in purgeUserR2Objects independently covers
 * the user namespace, and erasure must not be blocked by enumeration.
 */
export async function collectUserR2Keys(
  admin: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const keys = new Set<string>();
  const warn = (label: string, error: unknown) =>
    console.warn(
      `[r2-erasure] ${label} enumeration failed (prefix sweep still covers the user namespace):`,
      error,
    );

  // Inspections: contract PDFs (key column) + scan-report PDF (url
  // inside the risk_score jsonb blob — see /api/ai/scan).
  const { data: inspections, error: inspErr } = await admin
    .from("inspections")
    .select("id, contract_pdf_r2_key, risk_score")
    .eq("user_id", userId);
  if (inspErr) warn("inspections", inspErr);

  const inspectionIds: string[] = [];
  for (const row of inspections ?? []) {
    if (typeof row.id === "string") inspectionIds.push(row.id);
    if (typeof row.contract_pdf_r2_key === "string" && row.contract_pdf_r2_key) {
      keys.add(row.contract_pdf_r2_key);
    }
    const pdfUrl = (row.risk_score as { pdfUrl?: unknown } | null)?.pdfUrl;
    const reportKey = typeof pdfUrl === "string" ? keyFromR2Url(pdfUrl) : null;
    if (reportKey) keys.add(reportKey);
  }

  // Photos: r2_key, reachable via inspection_id (web flow) or via the
  // room chain (photos.inspection_id is nullable in schema.sql).
  if (inspectionIds.length > 0) {
    const { data: photos, error: photosErr } = await admin
      .from("photos")
      .select("r2_key")
      .in("inspection_id", inspectionIds);
    if (photosErr) warn("photos(inspection_id)", photosErr);
    for (const row of photos ?? []) {
      if (typeof row.r2_key === "string" && row.r2_key) keys.add(row.r2_key);
    }

    const { data: rooms, error: roomsErr } = await admin
      .from("rooms")
      .select("id")
      .in("inspection_id", inspectionIds);
    if (roomsErr) warn("rooms", roomsErr);
    const roomIds = (rooms ?? [])
      .map((r) => r.id)
      .filter((id): id is string => typeof id === "string");
    if (roomIds.length > 0) {
      const { data: roomPhotos, error: roomPhotosErr } = await admin
        .from("photos")
        .select("r2_key")
        .in("room_id", roomIds);
      if (roomPhotosErr) warn("photos(room_id)", roomPhotosErr);
      for (const row of roomPhotos ?? []) {
        if (typeof row.r2_key === "string" && row.r2_key) keys.add(row.r2_key);
      }
    }
  }

  // Dispute letters: letter_pdf_url column. No writer exists yet, but
  // the column is in schema — cover it so the day it ships, erasure
  // already does the right thing.
  const { data: letters, error: lettersErr } = await admin
    .from("dispute_letters")
    .select("letter_pdf_url")
    .eq("user_id", userId);
  if (lettersErr) warn("dispute_letters", lettersErr);
  for (const row of letters ?? []) {
    const letterKey =
      typeof row.letter_pdf_url === "string"
        ? keyFromR2Url(row.letter_pdf_url)
        : null;
    if (letterKey) keys.add(letterKey);
  }

  return [...keys];
}

/**
 * Delete every R2 object belonging to the user: the union of the
 * DB-recorded keys and a full listing of the `${userId}/` prefix.
 *
 * Never throws for per-object failures — they land in `result.failed`
 * so the caller can log them for a manual sweep while the DB erasure
 * proceeds. Throws only when R2 is not configured at all (caller
 * catches and logs the prefix for manual sweep).
 */
export async function purgeUserR2Objects(
  userId: string,
  dbKeys: string[],
  s3Override?: S3Like,
): Promise<R2PurgeResult> {
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET_NAME;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 not configured on server");
  }

  // Dynamic import keeps the AWS SDK out of any non-server bundle,
  // matching the pattern in r2-upload.ts.
  const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } =
    await import("@aws-sdk/client-s3");

  const s3: S3Like =
    s3Override ??
    (new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }) as unknown as S3Like);

  const keys = new Set<string>(dbKeys.filter((k) => Boolean(k)));

  // Prefix sweep: every upload path namespaces under `${userId}/`, so
  // this catches blobs whose DB rows were already deleted. A listing
  // failure is non-fatal — we still delete the DB-recorded keys.
  const prefix = `${userId}/`;
  try {
    let continuationToken: string | undefined;
    do {
      const resp = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );
      for (const obj of resp.Contents ?? []) {
        if (obj.Key) keys.add(obj.Key);
      }
      continuationToken = resp.IsTruncated
        ? resp.NextContinuationToken
        : undefined;
    } while (continuationToken);
  } catch (err) {
    console.warn(
      "[r2-erasure] prefix listing failed — proceeding with DB-recorded keys only:",
      { prefix, err },
    );
  }

  const allKeys = [...keys];
  const failed: R2PurgeFailure[] = [];
  let deleted = 0;

  // DeleteObjects accepts at most 1000 keys per request.
  for (let i = 0; i < allKeys.length; i += 1000) {
    const batch = allKeys.slice(i, i + 1000);
    try {
      const resp = await s3.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: batch.map((Key) => ({ Key })),
            Quiet: true, // only errors come back
          },
        }),
      );
      const errors = resp.Errors ?? [];
      for (const e of errors) {
        // An already-absent object is a success for erasure purposes:
        // the goal state (object gone) is reached. Idempotent.
        if (e.Code === "NoSuchKey" || e.Code === "404") {
          deleted += 1;
          continue;
        }
        failed.push({
          key: e.Key ?? "(unknown key)",
          error: `${e.Code ?? "Error"}: ${e.Message ?? "unknown"}`,
        });
      }
      deleted += batch.length - errors.length;
    } catch (err) {
      // Whole batch failed (network, auth…). Record every key for the
      // manual sweep and keep going — later batches may still succeed.
      const message = err instanceof Error ? err.message : String(err);
      for (const key of batch) failed.push({ key, error: message });
    }
  }

  return { attempted: allKeys.length, deleted, failed };
}
