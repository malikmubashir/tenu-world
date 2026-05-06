/**
 * POST /api/pdf/build
 *
 * On-demand PDF generation + presigned download URL for a completed scan.
 *
 * If the inspection already has a pdf_url, we skip re-rendering and just
 * return a fresh 2-hour presigned URL from the stored R2 key.
 * If not (edge-case: scan completed before EX-1 landed), we render, upload,
 * persist, and return.
 *
 * Body:  { scan_id: string }   (scan_id === inspectionId)
 * Returns: { url: string, sha256: string }
 */
export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  renderAndUploadScanPdf,
  presignPdfKey,
} from "@/lib/pdf/render-and-upload";
import type { RiskScanOutputV2 } from "@/lib/ai/types/risk-scan";

function extractR2Key(url: string, bucket: string): string | null {
  // URL pattern: https://<accountId>.r2.cloudflarestorage.com/<bucket>/<key>
  const marker = `/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { scan_id?: string };
  const scanId = body.scan_id;
  if (!scanId) {
    return NextResponse.json({ error: "scan_id required" }, { status: 400 });
  }

  // Verify ownership; pull everything needed for a potential re-render.
  const { data: inspection } = await supabase
    .from("inspections")
    .select(
      "id, user_id, status, address_formatted, pdf_url, pdf_sha256",
    )
    .eq("id", scanId)
    .single();

  if (!inspection || inspection.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (inspection.status !== "scanned") {
    return NextResponse.json(
      { error: "Scan not yet complete" },
      { status: 409 },
    );
  }

  const bucket = process.env.R2_BUCKET_NAME ?? "";

  // Fast path: PDF already exists — just presign the stored key.
  if (inspection.pdf_url && inspection.pdf_sha256) {
    const key = extractR2Key(inspection.pdf_url, bucket);
    if (key) {
      const url = await presignPdfKey(key);
      return NextResponse.json({ url, sha256: inspection.pdf_sha256 });
    }
  }

  // Slow path: render, upload, persist.
  // Pull the v2 scan payload from risk_score jsonb.
  const admin = createAdminClient();
  const { data: full } = await admin
    .from("inspections")
    .select("risk_score")
    .eq("id", scanId)
    .single();

  const v2: RiskScanOutputV2 | null =
    (full?.risk_score as { v2?: RiskScanOutputV2 })?.v2 ?? null;

  if (!v2) {
    return NextResponse.json(
      { error: "Scan data not available for PDF generation" },
      { status: 422 },
    );
  }

  const out = await renderAndUploadScanPdf({
    inspectionId: scanId,
    userId: user.id,
    address: inspection.address_formatted ?? "non communiquee",
    scan: v2,
    presign: true,
  });

  // Persist the dedicated columns.
  await admin
    .from("inspections")
    .update({ pdf_url: out.url, pdf_sha256: out.sha256 })
    .eq("id", scanId);

  return NextResponse.json({
    url: out.presignedUrl ?? out.url,
    sha256: out.sha256,
  });
}

export async function GET() {
  return new NextResponse(null, { status: 405 });
}
