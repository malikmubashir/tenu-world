import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scanAllRooms, ScanError, type ScanInput } from "@/lib/ai/risk-scan";
import { notifyScanComplete } from "@/lib/email/notify";
import { renderAndUploadScanPdf } from "@/lib/pdf/render-and-upload";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    inspectionId: string;
    tenantNotes?: string;
  };
  const { inspectionId, tenantNotes } = body;

  // verify ownership + pull full inspection context for the prompt
  const { data: inspection } = await supabase
    .from("inspections")
    .select(
      "id, user_id, status, jurisdiction, address_formatted, move_in_date, move_out_date, deposit_amount_cents, deposit_currency",
    )
    .eq("id", inspectionId)
    .single();

  if (!inspection || inspection.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (inspection.status !== "submitted") {
    return NextResponse.json(
      { error: "Inspection must be submitted before scanning" },
      { status: 400 },
    );
  }

  // fetch rooms with photos
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, room_type, label, sort_order")
    .eq("inspection_id", inspectionId)
    .order("sort_order");

  if (!rooms || rooms.length === 0) {
    return NextResponse.json({ error: "No rooms found" }, { status: 400 });
  }

  // fetch photos for each room
  const roomsWithPhotos = await Promise.all(
    rooms.map(async (room) => {
      const { data: photos } = await supabase
        .from("photos")
        .select("r2_url")
        .eq("room_id", room.id)
        .order("sort_order");

      return {
        roomId: room.id,
        roomType: room.room_type,
        label: room.label,
        photoUrls: (photos ?? [])
          .map((p: { r2_url: string | null }) => p.r2_url)
          .filter(Boolean) as string[],
      };
    }),
  );

  const depositAmountEur =
    inspection.deposit_amount_cents && inspection.deposit_currency === "EUR"
      ? Math.round(inspection.deposit_amount_cents / 100)
      : 0;

  const scanInput: ScanInput = {
    inspectionId,
    address: inspection.address_formatted ?? "non communiquee",
    jurisdiction: (inspection.jurisdiction === "uk" ? "uk" : "fr"),
    moveInDate: inspection.move_in_date,
    moveOutDate: inspection.move_out_date,
    depositAmountEur,
    hasInventory: false, // TODO: wire when inventory-of-entry feature lands
    rooms: roomsWithPhotos,
    tenantNotes,
  };

  // run AI scan with typed error handling
  let scanResult;
  try {
    scanResult = await scanAllRooms(scanInput);
  } catch (err) {
    if (err instanceof ScanError) {
      const status =
        err.code === "INSUFFICIENT_PHOTOS" || err.code === "INVALID_INPUT"
          ? 400
          : err.code === "BUDGET_EXCEEDED"
            ? 402
            : err.code === "MODEL_REFUSAL"
              ? 422
              : 502;
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status },
      );
    }
    throw err;
  }

  // store collapsed legacy shape per room (keeps current UI working)
  for (const roomRisk of scanResult.rooms) {
    await supabase
      .from("rooms")
      .update({
        risk_level: roomRisk.riskLevel,
        risk_score: roomRisk.riskScore,
        risk_notes: {
          issues: roomRisk.issues,
          summary: roomRisk.summary,
        },
        estimated_deduction_eur: roomRisk.estimatedDeductionEur,
      })
      .eq("id", roomRisk.roomId);
  }

  // Generate the report PDF + push to R2. Best-effort: a render or
  // upload failure must not fail the scan response — the scan_result
  // is the primary deliverable, the PDF is a convenience artefact.
  // Captured for the email + report-view link if it succeeds.
  let pdfUrl: string | null = null;
  if (scanResult.v2) {
    try {
      const out = await renderAndUploadScanPdf({
        inspectionId,
        userId: user.id,
        address: inspection.address_formatted ?? "non communiquee",
        scan: scanResult.v2,
      });
      pdfUrl = out.url;
    } catch (err) {
      console.warn("[scan] PDF render/upload failed (non-fatal):", err);
    }
  }

  // persist the full v2 payload + observability metadata on the inspection
  // using the existing risk_score jsonb column (no schema migration needed).
  // pdfUrl folded into the same blob.
  await supabase
    .from("inspections")
    .update({
      status: "scanned",
      risk_score: {
        v2: scanResult.v2 ?? null,
        overallRisk: scanResult.overallRisk,
        totalEstimatedDeductionEur: scanResult.totalEstimatedDeduction,
        scanTimestamp: scanResult.scanTimestamp,
        pdfUrl,
        telemetry: {
          costEur: scanResult.costEur,
          modelUsed: scanResult.modelUsed,
          attemptCount: scanResult.attemptCount,
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", inspectionId);

  // Fire scan-complete email. Best-effort: the scan is already persisted,
  // a transport failure should not surface as a 5xx to the caller. Log
  // and move on — out-of-band monitoring will pick up persistent failures.
  try {
    const emailRes = await notifyScanComplete({
      userId: user.id,
      inspectionId,
      pdfUrl,
    });
    if (!emailRes.ok) {
      console.warn("[scan] notifyScanComplete failed:", emailRes.error);
    }
  } catch (err) {
    console.warn("[scan] notifyScanComplete threw:", err);
  }

  return NextResponse.json({
    scanResult,
    status: "scanned",
    pdfUrl,
  });
}
