import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/inspection/ratings?roomId=xxx
 * Returns all element ratings for a given room.
 *
 * POST /api/inspection/ratings
 * Upserts a single element rating (creates or updates).
 * Body: { roomId, elementKey, rating, comment? }
 */

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }

  // Verify ownership through room -> inspection -> user chain
  const { data: room } = await supabase
    .from("rooms")
    .select("id, inspection_id, inspections!inner(user_id)")
    .eq("id", roomId)
    .single();

  if (!room || (room as Record<string, unknown>).inspections === null) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const inspection = (room as Record<string, unknown>).inspections as { user_id: string };
  if (inspection.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: ratings, error: fetchError } = await supabase
    .from("element_ratings")
    .select("element_key, rating, comment, photo_ids")
    .eq("room_id", roomId)
    .order("created_at");

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ ratings: ratings ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { roomId, elementKey, rating, comment } = body as {
    roomId: string;
    elementKey: string;
    rating: string;
    comment?: string | null;
  };

  if (!roomId || !elementKey || !rating) {
    return NextResponse.json({ error: "roomId, elementKey, and rating are required" }, { status: 400 });
  }

  // Validate rating value
  if (!["TB", "B", "M", "MV"].includes(rating)) {
    return NextResponse.json({ error: "Rating must be TB, B, M, or MV" }, { status: 400 });
  }

  // Verify ownership
  const { data: room } = await supabase
    .from("rooms")
    .select("id, inspection_id, inspections!inner(user_id)")
    .eq("id", roomId)
    .single();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const inspection = (room as Record<string, unknown>).inspections as { user_id: string };
  if (inspection.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Upsert: insert or update on conflict(room_id, element_key)
  const { error: upsertError } = await supabase
    .from("element_ratings")
    .upsert(
      {
        room_id: roomId,
        element_key: elementKey,
        rating,
        comment: comment || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "room_id,element_key" },
    );

  if (upsertError) {
    console.error("Rating upsert error:", upsertError);
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
