import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isZoneTendue, extractPostalCode, getNoticePeriodMonths } from "@/lib/geo/zone-tendue";

/**
 * POST /api/inspection/create
 *
 * Creates a new inspection with:
 *   - Basic details (jurisdiction, address, rooms)
 *   - Owner details (type, name, contact)
 *   - Tenant(s) (1-3 per inspection)
 *   - Contract info (furnished, lease dates, rent, charges)
 *   - Property characteristics (type, surface, zone tendue auto-detected)
 *   - Inspection type (move_in or move_out)
 *
 * Zone tendue is auto-detected from the address postal code (FR only).
 * Notice period is auto-calculated from zone tendue + furnished status.
 */

interface TenantInput {
  fullName: string;
  email?: string;
  phone?: string;
}

interface CreateInspectionBody {
  // Basic
  jurisdiction: "fr" | "uk";
  address: string;
  inspectionType?: "move_in" | "move_out";
  rooms: { type: string; label: string }[];

  // Owner
  ownerType?: "individual" | "company";
  ownerName?: string;
  ownerCompanyName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerAddress?: string;

  // Tenants (1-3)
  tenants?: TenantInput[];

  // Contract
  furnished?: boolean;
  leaseStartDate?: string; // ISO date
  leaseEndDate?: string;   // ISO date, null = open-ended
  monthlyRentCents?: number;
  monthlyChargesCents?: number;

  // Property characteristics
  propertyType?: "appartement" | "maison";
  surfaceM2?: number;
  mainRooms?: number;

  // Dates (legacy compat)
  moveInDate?: string;
  moveOutDate?: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CreateInspectionBody;

  // -- Validation --
  if (!body.address?.trim()) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }
  if (!body.rooms || body.rooms.length === 0) {
    return NextResponse.json({ error: "At least one room is required" }, { status: 400 });
  }
  if (!["fr", "uk"].includes(body.jurisdiction)) {
    return NextResponse.json({ error: "Jurisdiction must be 'fr' or 'uk'" }, { status: 400 });
  }
  if (body.tenants && body.tenants.length > 3) {
    return NextResponse.json({ error: "Maximum 3 tenants per inspection" }, { status: 400 });
  }
  if (body.tenants) {
    for (const t of body.tenants) {
      if (!t.fullName?.trim()) {
        return NextResponse.json({ error: "Each tenant must have a full name" }, { status: 400 });
      }
    }
  }

  // -- Zone tendue auto-detection (France only) --
  let zoneTendue = false;
  let communeInsee: string | null = null;
  const furnished = body.furnished ?? false;

  if (body.jurisdiction === "fr") {
    const postalCode = extractPostalCode(body.address);
    if (postalCode) {
      zoneTendue = isZoneTendue(postalCode);
      communeInsee = postalCode; // postal code stored as fallback; precise INSEE lookup is V2
    }
  }

  const noticePeriodMonths = body.jurisdiction === "fr"
    ? getNoticePeriodMonths(zoneTendue, furnished)
    : 1; // UK default

  // -- Determine inspection type from context --
  const inspectionType = body.inspectionType ?? "move_in";

  // -- Create inspection --
  const { data: inspection, error: insertError } = await supabase
    .from("inspections")
    .insert({
      user_id: user.id,
      jurisdiction: body.jurisdiction,
      address: body.address.trim(),
      status: "capturing",

      // Inspection type
      inspection_type: inspectionType,

      // Owner details
      owner_type: body.ownerType ?? "individual",
      owner_name: body.ownerName?.trim() || null,
      owner_company_name: body.ownerCompanyName?.trim() || null,
      owner_email: body.ownerEmail?.trim() || null,
      owner_phone: body.ownerPhone?.trim() || null,
      owner_address: body.ownerAddress?.trim() || null,

      // Contract details
      furnished,
      lease_start_date: body.leaseStartDate || body.moveInDate || null,
      lease_end_date: body.leaseEndDate || body.moveOutDate || null,
      notice_period_months: noticePeriodMonths,
      monthly_rent_cents: body.monthlyRentCents ?? null,
      monthly_charges_cents: body.monthlyChargesCents ?? null,

      // Property characteristics
      property_type: body.propertyType ?? "appartement",
      surface_m2: body.surfaceM2 ?? null,
      main_rooms: body.mainRooms ?? null,
      zone_tendue: zoneTendue,
      commune_insee: communeInsee,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Inspection insert error:", insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const inspectionId = inspection.id;

  // -- Create rooms --
  const roomInserts = body.rooms.map((room, idx) => ({
    inspection_id: inspectionId,
    room_type: room.type,
    label: room.label,
    sort_order: idx,
  }));

  const { data: roomsCreated, error: roomError } = await supabase
    .from("rooms")
    .insert(roomInserts)
    .select("id, room_type, label, sort_order");

  if (roomError) {
    console.error("Room insert error:", roomError);
    // Clean up the inspection if rooms fail
    await supabase.from("inspections").delete().eq("id", inspectionId);
    return NextResponse.json({ error: roomError.message }, { status: 500 });
  }

  // -- Create tenants --
  if (body.tenants && body.tenants.length > 0) {
    const tenantInserts = body.tenants.map((t, idx) => ({
      inspection_id: inspectionId,
      full_name: t.fullName.trim(),
      email: t.email?.trim() || null,
      phone: t.phone?.trim() || null,
      sort_order: idx,
    }));

    const { error: tenantError } = await supabase
      .from("tenants")
      .insert(tenantInserts);

    if (tenantError) {
      console.error("Tenant insert error:", tenantError);
      // Non-fatal: inspection and rooms already created, tenants can be added later
    }
  }

  return NextResponse.json({
    inspectionId,
    zoneTendue,
    noticePeriodMonths,
    furnished,
    inspectionType,
    // Server room IDs — mobile needs these to feed /api/mobile/upload-intent.
    // Map back from local room codes via room_type, e.g. "salon" → uuid.
    rooms: (roomsCreated ?? []).map((r) => ({
      id: r.id as string,
      type: r.room_type as string,
      label: r.label as string,
      sortOrder: r.sort_order as number,
    })),
  });
}
