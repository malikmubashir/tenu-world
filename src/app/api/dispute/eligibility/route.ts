import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateDisputeEligibility } from "@/lib/ai/dispute-eligibility";

/**
 * GET /api/dispute/eligibility?inspectionId=xxx
 *
 * Returns whether the caller is allowed to buy a dispute letter for
 * this inspection. Called from:
 *   - /pricing page to hide or disable the dispute card
 *   - /inspection/[id]/report page to show or swap the upsell CTA
 *
 * 401 if not logged in, 404 if inspection not owned, 200 otherwise.
 * Shape: { eligible, reason, message_fr, message_en, quality_flag,
 *          total_deduction_eur, deposit_amount_eur, refundable_eur }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const inspectionId = searchParams.get("inspectionId");

  if (!inspectionId) {
    return NextResponse.json(
      { error: "Missing inspectionId" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: inspection, error } = await supabase
    .from("inspections")
    .select("id, user_id, risk_score")
    .eq("id", inspectionId)
    .single();

  if (error || !inspection || inspection.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const eligibility = evaluateDisputeEligibility(inspection.risk_score);
  return NextResponse.json(eligibility);
}
