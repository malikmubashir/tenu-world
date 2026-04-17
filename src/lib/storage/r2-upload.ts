"use server";

import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

interface UploadResult {
  key: string;
  url: string;
  sizeBytes: number;
  sha256Hash: string;
  exifTimestamp: string | null;
}

/**
 * Uploads a photo to Cloudflare R2 (EU jurisdiction) and returns
 * authenticity metadata alongside the R2 pointer.
 *
 * Evidence chain additions (2026-04-17):
 *   - sha256Hash: hex-encoded SHA-256 of the raw buffer. Persisted on
 *     photos.sha256_hash. Anyone with access to the R2 blob can recompute
 *     and verify the file has not been swapped post-upload.
 *   - exifTimestamp: ISO-8601 EXIF DateTimeOriginal when present. iOS
 *     PWAs frequently strip EXIF so null is an expected, non-blocking
 *     outcome; the inspection still has photos.captured_at (DB time).
 *
 * Geolocation is deliberately NOT captured per GDPR minimization — the
 * inspection address_lat/lng anchors location at property level.
 */
export async function uploadPhotoToR2(
  roomId: string,
  formData: FormData,
): Promise<UploadResult> {
  // verify auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const file = formData.get("photo") as File;
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("Invalid file: must be an image");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "image/png" ? "png" : "jpg";
  const key = `${user.id}/${roomId}/${Date.now()}.${ext}`;

  // SHA-256 of the raw bytes. Hex-encoded for portability across SQL
  // clients. 64 chars always — the photos.sha256_hash column is text.
  const sha256Hash = createHash("sha256").update(buffer).digest("hex");

  // EXIF parsing is best-effort. Browsers/iOS strip EXIF inconsistently.
  // When absent we return null and let the server receive time
  // (photos.captured_at default = now()) serve as the timestamp anchor.
  let exifTimestamp: string | null = null;
  try {
    const { default: exifr } = await import("exifr");
    const exif = await exifr.parse(buffer, {
      tiff: true,
      ifd0: false,
      exif: true,
      gps: false,
    });
    const dt =
      exif?.DateTimeOriginal ??
      exif?.CreateDate ??
      exif?.ModifyDate ??
      null;
    if (dt instanceof Date && !Number.isNaN(dt.getTime())) {
      exifTimestamp = dt.toISOString();
    }
  } catch {
    // Malformed EXIF or parser failure — fall through with null.
    exifTimestamp = null;
  }

  // upload to R2 via S3-compatible API
  const accountId = process.env.R2_ACCOUNT_ID!;
  const bucket = process.env.R2_BUCKET_NAME!;
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const s3 = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      // Persist sha256 as object metadata too — belt-and-braces if the
      // photos row is ever lost but the R2 blob survives.
      Metadata: {
        sha256: sha256Hash,
      },
    }),
  );

  const publicUrl = process.env.R2_PUBLIC_URL
    ? `${process.env.R2_PUBLIC_URL}/${key}`
    : `${endpoint}/${bucket}/${key}`;

  return {
    key,
    url: publicUrl,
    sizeBytes: buffer.length,
    sha256Hash,
    exifTimestamp,
  };
}
