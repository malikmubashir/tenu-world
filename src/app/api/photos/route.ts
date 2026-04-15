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
    .select("id, r2_url, captured_at, sort_order")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ photos });
}

/** POST /api/photos — save photo metadata after R2 upload */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { roomId, r2Key, r2Url, mimeType, sizeBytes } = body as {
    roomId: string;
    r2Key: string;
    r2Url: string;
    mimeType: string;
    sizeBytes: number;
  };

  if (!roomId || !r2Key || !r2Url) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
      r2_key: r2Key,
      r2_url: r2Url,
      mime_type: mimeType ?? "image/jpeg",
      size_bytes: sizeBytes ?? 0,
      sort_order: nextOrder,
    })
    .select("id, r2_url, captured_at, sort_order")
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
