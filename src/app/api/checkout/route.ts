import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createCheckoutSession,
  calculatePrice,
  type Product,
  type InspectionRoom,
} from "@/lib/payments/stripe";
import {
  isValidWaiverPayload,
  WAIVER_TEXT_VERSION,
  type WaiverConsentPayload,
} from "@/lib/legal/withdrawal-waiver";
import { evaluateDisputeEligibility } from "@/lib/ai/dispute-eligibility";

/**
 * POST /api/checkout
 * Creates a Stripe Checkout session with dynamic pricing based on rooms.
 *
 * Body:
 *   product: "report" | "dispute" | "report_and_dispute"
 *   inspectionId: string (UUID)
 *   successUrl: string
 *   cancelUrl: string
 *
 * Rooms and jurisdiction are fetched from the inspection record in Supabase.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { product, inspectionId, successUrl, cancelUrl, waiverConsent } =
    body as {
      product: Product;
      inspectionId: string;
      successUrl: string;
      cancelUrl: string;
      waiverConsent?: WaiverConsentPayload;
    };

  if (!product || !inspectionId || !successUrl || !cancelUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["report", "dispute", "report_and_dispute", "exit_only"].includes(product)) {
    return NextResponse.json({ error: "Invalid product type" }, { status: 400 });
  }

  // L221-28 1° CConso: both waiver checkboxes must be ticked server-side.
  // We do NOT create a Stripe session without proof of active opt-in.
  if (!isValidWaiverPayload(waiverConsent)) {
    return NextResponse.json(
      {
        error: "Withdrawal waiver required",
        code: "WAIVER_MISSING",
        expectedVersion: WAIVER_TEXT_VERSION,
      },
      { status: 400 },
    );
  }

  // Fetch inspection with rooms — verify ownership.
  // risk_score is the v2 scan JSONB; used below for the dispute gate.
  const { data: inspection, error: inspError } = await supabase
    .from("inspections")
    .select("id, user_id, jurisdiction, risk_score")
    .eq("id", inspectionId)
    .single();

  if (inspError || !inspection || inspection.user_id !== user.id) {
    return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
  }

  // Dispute gate. Must fire BEFORE Stripe session creation so a crafted
  // POST cannot bypass the UI check. Same helper the pricing page calls.
  if (product === "dispute" || product === "report_and_dispute") {
    const eligibility = evaluateDisputeEligibility(inspection.risk_score);
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: "Dispute letter not eligible for this inspection",
          code: "DISPUTE_NOT_ELIGIBLE",
          reason: eligibility.reason,
          message_fr: eligibility.message_fr,
          message_en: eligibility.message_en,
        },
        { status: 400 },
      );
    }
  }

  const { data: rooms } = await supabase
    .from("rooms")
    .select("room_type, label")
    .eq("inspection_id", inspectionId);

  if (!rooms || rooms.length === 0) {
    return NextResponse.json({ error: "No rooms found for this inspection" }, { status: 400 });
  }

  const inspectionRooms: InspectionRoom[] = rooms.map((r) => ({
    type: r.room_type,
    label: r.label ?? undefined,
  }));

  const jurisdiction = inspection.jurisdiction as "fr" | "uk";

  // Record the waiver BEFORE creating the Stripe session.
  // Append-only row, linked to user + inspection. IP + UA captured for
  // burden-of-proof defence (L221-28 + GDPR Art. 7.1).
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  const { data: consentRow, error: consentErr } = await supabase
    .from("consents")
    .insert({
      user_id: user.id,
      consent_type: "withdrawal_waiver_l221_28",
      text_version: waiverConsent!.textVersion,
      locale: waiverConsent!.locale,
      inspection_id: inspectionId,
      intended_product: product,
      checkbox_checked: true,
      ip_address: ipAddress,
      user_agent: userAgent,
    })
    .select("id")
    .single();

  if (consentErr || !consentRow) {
    return NextResponse.json(
      { error: "Failed to record waiver consent" },
      { status: 500 },
    );
  }

  const session = await createCheckoutSession({
    product,
    rooms: inspectionRooms,
    jurisdiction,
    inspectionId,
    userId: user.id,
    userEmail: user.email ?? "",
    successUrl,
    cancelUrl,
    waiverConsentId: consentRow.id,
  });

  return NextResponse.json({
    sessionId: session.sessionId,
    url: session.url,
  });
}

/**
 * GET /api/checkout?inspectionId=xxx
 * Returns price breakdown without creating a session (for preview).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const inspectionId = searchParams.get("inspectionId");

  if (!inspectionId) {
    return NextResponse.json({ error: "Missing inspectionId" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: inspection } = await supabase
    .from("inspections")
    .select("id, user_id, jurisdiction")
    .eq("id", inspectionId)
    .single();

  if (!inspection || inspection.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: rooms } = await supabase
    .from("rooms")
    .select("room_type, label")
    .eq("inspection_id", inspectionId);

  if (!rooms || rooms.length === 0) {
    return NextResponse.json({ error: "No rooms" }, { status: 400 });
  }

  const inspectionRooms: InspectionRoom[] = rooms.map((r) => ({
    type: r.room_type,
    label: r.label ?? undefined,
  }));

  const jurisdiction = inspection.jurisdiction as "fr" | "uk";
  const pricing = calculatePrice(inspectionRooms, jurisdiction);

  return NextResponse.json({ pricing });
}
