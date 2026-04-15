import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scanAllRooms } from "@/lib/ai/risk-scan";

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

  // verify ownership
  const { data: inspection } = await supabase
    .from("inspections")
    .select("id, user_id, status, jurisdiction, address")
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

  // run AI scan
  const scanResult = await scanAllRooms(inspectionId, roomsWithPhotos);

  // store results in rooms table
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

  // update inspection status
  await supabase
    .from("inspections")
    .update({
      status: "scanned",
      updated_at: new Date().toISOString(),
    })
    .eq("id", inspectionId);

  return NextResponse.json({
    scanResult,
    status: "scanned",
  });
}
