import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createCheckoutSession,
  calculatePrice,
  type Product,
  type InspectionRoom,
} from "@/lib/payments/stripe";

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
  const { product, inspectionId, successUrl, cancelUrl } = body as {
    product: Product;
    inspectionId: string;
    successUrl: string;
    cancelUrl: string;
  };

  if (!product || !inspectionId || !successUrl || !cancelUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["report", "dispute", "report_and_dispute"].includes(product)) {
    return NextResponse.json({ error: "Invalid product type" }, { status: 400 });
  }

  // Fetch inspection with rooms — verify ownership
  const { data: inspection, error: inspError } = await supabase
    .from("inspections")
    .select("id, user_id, jurisdiction")
    .eq("id", inspectionId)
    .single();

  if (inspError || !inspection || inspection.user_id !== user.id) {
    return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
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

  const session = await createCheckoutSession({
    product,
    rooms: inspectionRooms,
    jurisdiction,
    inspectionId,
    userId: user.id,
    userEmail: user.email ?? "",
    successUrl,
    cancelUrl,
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
