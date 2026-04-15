import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { jurisdiction, address, moveInDate, moveOutDate, rooms } = body as {
    jurisdiction: "fr" | "uk";
    address: string;
    moveInDate?: string;
    moveOutDate?: string;
    rooms: { type: string; label?: string }[];
  };

  if (!jurisdiction || !address || !rooms?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // create inspection
  const { data: inspection, error: inspError } = await supabase
    .from("inspections")
    .insert({
      user_id: user.id,
      jurisdiction,
      address,
      move_in_date: moveInDate ?? null,
      move_out_date: moveOutDate ?? null,
      status: "capturing",
    })
    .select("id")
    .single();

  if (inspError || !inspection) {
    return NextResponse.json({ error: inspError?.message ?? "Failed to create inspection" }, { status: 500 });
  }

  // create rooms
  const roomInserts = rooms.map((r: { type: string; label?: string }, i: number) => ({
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

  return NextResponse.json({ inspectionId: inspection.id, rooms: createdRooms });
}
