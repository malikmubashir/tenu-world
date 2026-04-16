import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface CreateInspectionBody {
  jurisdiction: "fr" | "uk";
  address: {
    formatted: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    region?: string;
    countryCode: string;
    placeId: string;
    lat: number;
    lng: number;
  };
  moveInDate?: string;
  moveOutDate?: string;
  rooms: { type: string; label?: string }[];
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CreateInspectionBody;
  const { jurisdiction, address, moveInDate, moveOutDate, rooms } = body;

  if (!jurisdiction || !address?.formatted || !address?.placeId || !rooms?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  /* Create inspection with structured address */
  const { data: inspection, error: inspError } = await supabase
    .from("inspections")
    .insert({
      user_id: user.id,
      jurisdiction,
      status: "capturing",
      address_formatted: address.formatted,
      address_line1: address.line1,
      address_line2: address.line2 ?? null,
      city: address.city,
      postal_code: address.postalCode,
      region: address.region ?? null,
      country_code: address.countryCode,
      google_place_id: address.placeId,
      address_lat: address.lat,
      address_lng: address.lng,
      move_in_date: moveInDate ?? null,
      move_out_date: moveOutDate ?? null,
    })
    .select("id")
    .single();

  if (inspError || !inspection) {
    return NextResponse.json({ error: inspError?.message ?? "Failed to create inspection" }, { status: 500 });
  }

  /* Create rooms */
  const roomInserts = rooms.map((r, i) => ({
    inspection_id: inspection.id,
    room_type: r.type,
    label: r.label ?? null,
    sort_order: i,
  }));

  const { data: createdRooms, error: roomError } = await supabase
    .from("rooms")
    .insert(roomInserts)
    .select("id, room_type, sort_order");

  if (roomError) {
    return NextResponse.json({ error: roomError.message }, { status: 500 });
  }

  return NextResponse.json({
    inspectionId: inspection.id,
    rooms: createdRooms,
    address: {
      lat: address.lat,
      lng: address.lng,
    },
  });
}
