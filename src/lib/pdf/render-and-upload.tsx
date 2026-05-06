/**
 * Render a scan report to PDF and upload it to R2.
 *
 * Returns the permanent R2 URL, SHA-256 fingerprint, and optionally a
 * 2-hour presigned GET URL for download links in emails and report pages.
 *
 * Server-only. @react-pdf/renderer pulls in headless rendering libs
 * that must not ship in the client bundle.
 */
import "server-only";
import { createHash } from "crypto";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ScanReportPdf } from "./scan-report";
import type { RiskScanOutputV2 } from "@/lib/ai/types/risk-scan";

interface RenderInput {
  inspectionId: string;
  userId: string;
  address: string;
  scan: RiskScanOutputV2;
  /** When true, also generate a 2-hour presigned GET URL. Default false. */
  presign?: boolean;
}

interface RenderResult {
  /** R2 key under user namespace. */
  key: string;
  /** Permanent R2 URL (internal — not for direct user exposure). */
  url: string;
  /** PDF size in bytes — useful for telemetry + rate-limit tracking. */
  sizeBytes: number;
  /** Hex SHA-256 of the rendered buffer. */
  sha256: string;
  /** 2-hour presigned GET URL, populated only when input.presign is true. */
  presignedUrl?: string;
}

function makeS3Client(accountId: string, accessKeyId: string, secretAccessKey: string) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function renderAndUploadScanPdf(
  input: RenderInput,
): Promise<RenderResult> {
  const { inspectionId, userId, address, scan, presign = false } = input;

  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET_NAME;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 not configured on server");
  }

  // Render the React tree to a PDF buffer in memory. ~50-200 KB for a
  // typical 4-room inspection.
  const buffer = await renderToBuffer(
    <ScanReportPdf
      inspectionId={inspectionId}
      address={address}
      generatedAt={new Date().toISOString()}
      scan={scan}
    />,
  );

  const sizeBytes = buffer.length;
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const key = `${userId}/reports/${inspectionId}-${Date.now()}.pdf`;

  const s3 = makeS3Client(accountId, accessKeyId, secretAccessKey);

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
      ContentDisposition: `inline; filename="tenu-rapport-${inspectionId.slice(0, 8)}.pdf"`,
      ChecksumSHA256: Buffer.from(sha256, "hex").toString("base64"),
    }),
  );

  const url = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;

  let presignedUrl: string | undefined;
  if (presign) {
    presignedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 7200 },
    );
  }

  return { key, url, sizeBytes, sha256, presignedUrl };
}

/**
 * Generate a fresh presigned GET URL for an already-uploaded PDF key.
 * 2-hour expiry. Does not re-render or re-upload.
 */
export async function presignPdfKey(key: string): Promise<string> {
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET_NAME;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 not configured on server");
  }

  const s3 = makeS3Client(accountId, accessKeyId, secretAccessKey);
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 7200 },
  );
}
