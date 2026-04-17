import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/photos?roomId=xxx — fetch photos for a room */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roomId = request.nextUrl.searchParams.get("roomId");
  if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

  const { data: photos, error } = await supabase
    .from("photos")
    .select("id, r2_url, captured_at, sort_order, sha256_hash, exif_timestamp")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ photos });
}

/**
 * POST /api/photos — persist photo metadata after the R2 upload
 * Server Action has already placed the blob in R2.
 *
 * Evidence-chain fields (2026-04-17): sha256Hash is mandatory,
 * exifTimestamp is best-effort. inspectionId is required so we
 * can denormalize it onto photos (avoids the rooms→inspections
 * join on every read) and verify the room actually belongs to
 * the inspection the caller claims — defense in depth on top of
 * Supabase RLS.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    roomId,
    inspectionId,
    r2Key,
    r2Url,
    mimeType,
    sizeBytes,
    sha256Hash,
    exifTimestamp,
  } = body as {
    roomId: string;
    inspectionId: string;
    r2Key: string;
    r2Url: string;
    mimeType: string;
    sizeBytes: number;
    sha256Hash: string;
    exifTimestamp: string | null;
  };

  if (!roomId || !inspectionId || !r2Key || !r2Url || !sha256Hash) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify the room belongs to the inspection the caller claims, and
  // both belong to this user. RLS would catch the user part, but we
  // check explicitly so the response is a clean 403 instead of a silent
  // insert failure.
  const { data: roomCheck } = await supabase
    .from("rooms")
    .select("id, inspection_id, inspections!inner(user_id)")
    .eq("id", roomId)
    .eq("inspection_id", inspectionId)
    .maybeSingle();

  if (!roomCheck) {
    return NextResponse.json(
      { error: "Room does not belong to inspection" },
      { status: 403 },
    );
  }

  // get current max sort_order for this room
  const { data: existing } = await supabase
    .from("photos")
    .select("sort_order")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data: photo, error } = await supabase
    .from("photos")
    .insert({
      room_id: roomId,
      inspection_id: inspectionId,
      r2_key: r2Key,
      r2_url: r2Url,
      mime_type: mimeType ?? "image/jpeg",
      size_bytes: sizeBytes ?? 0,
      sort_order: nextOrder,
      sha256_hash: sha256Hash,
      exif_timestamp: exifTimestamp ?? null,
      source: "camera",
    })
    .select("id, r2_url, captured_at, sort_order, sha256_hash, exif_timestamp")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ photo });
}

/** DELETE /api/photos?id=xxx — remove a photo */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const photoId = request.nextUrl.searchParams.get("id");
  if (!photoId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase.from("photos").delete().eq("id", photoId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
