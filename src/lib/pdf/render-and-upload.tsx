/**
 * Render a scan report to PDF and upload it to R2.
 *
 * Returns the public R2 URL so it can be linked in the Brevo email
 * template + persisted on the inspections row.
 *
 * Server-only. @react-pdf/renderer pulls in headless rendering libs
 * that must not ship in the client bundle.
 */
import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ScanReportPdf } from "./scan-report";
import type { RiskScanOutputV2 } from "@/lib/ai/types/risk-scan";

interface RenderInput {
  inspectionId: string;
  userId: string;
  address: string;
  scan: RiskScanOutputV2;
}

interface RenderResult {
  /** R2 key under user namespace. */
  key: string;
  /** Public R2 URL (same hostname pattern as photos). */
  url: string;
  /** PDF size in bytes — useful for telemetry + rate-limit tracking. */
  sizeBytes: number;
}

export async function renderAndUploadScanPdf(
  input: RenderInput,
): Promise<RenderResult> {
  const { inspectionId, userId, address, scan } = input;

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
  const key = `${userId}/reports/${inspectionId}-${Date.now()}.pdf`;

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
      ContentDisposition: `inline; filename="tenu-rapport-${inspectionId.slice(0, 8)}.pdf"`,
    }),
  );

  const url = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
  return { key, url, sizeBytes };
}
