import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDisputeLetter } from "@/lib/ai/dispute-letter";
import type { ScanResult, RoomRisk } from "@/lib/ai/risk-scan";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inspectionId } = (await request.json()) as {
    inspectionId: string;
  };

  // verify ownership + scanned status
  const { data: inspection } = await supabase
    .from("inspections")
    .select("id, user_id, status, jurisdiction, address, dispute_purchased")
    .eq("id", inspectionId)
    .single();

  if (!inspection || inspection.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (inspection.status !== "scanned") {
    return NextResponse.json(
      { error: "Inspection must be scanned before generating dispute letter" },
      { status: 400 },
    );
  }

  if (!inspection.dispute_purchased) {
    return NextResponse.json(
      { error: "Dispute letter requires purchase" },
      { status: 402 },
    );
  }

  // reconstruct scan result from stored room data
  const { data: rooms } = await supabase
    .from("rooms")
    .select(
      "id, room_type, label, risk_level, risk_score, risk_notes, estimated_deduction_eur",
    )
    .eq("inspection_id", inspectionId)
    .order("sort_order");

  if (!rooms || rooms.length === 0) {
    return NextResponse.json({ error: "No rooms found" }, { status: 400 });
  }

  const roomRisks: RoomRisk[] = rooms.map((r) => ({
    roomId: r.id,
    riskLevel: (r.risk_level as "low" | "medium" | "high") ?? "low",
    riskScore: Number(r.risk_score) || 0,
    issues: (r.risk_notes as { issues?: RoomRisk["issues"] })?.issues ?? [],
    estimatedDeductionEur: Number(r.estimated_deduction_eur) || 0,
    summary:
      (r.risk_notes as { summary?: string })?.summary ?? "",
  }));

  const maxScore = Math.max(...roomRisks.map((r) => r.riskScore), 0);
  const overallRisk: "low" | "medium" | "high" =
    maxScore >= 0.7 ? "high" : maxScore >= 0.4 ? "medium" : "low";

  const scanResult: ScanResult = {
    inspectionId,
    rooms: roomRisks,
    overallRisk,
    totalEstimatedDeduction: roomRisks.reduce(
      (sum, r) => sum + r.estimatedDeductionEur,
      0,
    ),
    scanTimestamp: new Date().toISOString(),
  };

  // generate letter
  const letter = await generateDisputeLetter(
    scanResult,
    inspection.jurisdiction as "fr" | "uk",
    inspection.address,
    user.email ?? undefined,
  );

  // store in disputes table
  const { data: dispute, error: insertError } = await supabase
    .from("disputes")
    .insert({
      inspection_id: inspectionId,
      letter_locale: letter.locale,
      letter_body: letter.letterBody,
      explanation_body: letter.explanationBody,
      explanation_locale: letter.explanationLocale,
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    disputeId: dispute.id,
    letter,
  });
}
