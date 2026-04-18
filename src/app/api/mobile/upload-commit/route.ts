import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/mobile/upload-commit
 *
 * Called by the mobile app after it has PUT the photo bytes to R2
 * using the URL from /api/mobile/upload-intent. Persists the metadata
 * row — at this point the binary is already in the bucket.
 *
 * Request body (JSON):
 *   {
 *     key: string,              // the R2 key returned from /upload-intent
 *     roomId: string,
 *     inspectionId: string,
 *     mimeType: string,
 *     sizeBytes: number,
 *     sha256: string,           // hex — must match the photo bytes
 *     exifTimestamp: string | null,  // ISO-8601 when present
 *     capturedAt: string,       // ISO-8601, device clock
 *   }
 *
 * Response: { photoId, sortOrder } on success.
 *
 * Server does NOT re-hash the R2 object here — that would mean a read
 * for every upload. The sha256 value is the client's claim; R2 gets
 * swept by a scheduled function weekly to verify the hash matches the
 * stored bytes (flag mismatches for manual review). Acceptable for
 * the soft-launch threat model.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    await supabase.auth.getUser(token);
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    key?: string;
    roomId?: string;
    inspectionId?: string;
    mimeType?: string;
    sizeBytes?: number;
    sha256?: string;
    exifTimestamp?: string | null;
    capturedAt?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    key,
    roomId,
    inspectionId,
    mimeType,
    sizeBytes,
    sha256,
    exifTimestamp,
    capturedAt,
  } = body;

  if (!key || !roomId || !inspectionId || !sha256 || !capturedAt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Bind the key path to the authenticated user. This is belt-and-suspenders:
  // /upload-intent already generated the key with this prefix, so a caller
  // using someone else's pre-signed key would fail the prefix match here.
  if (!key.startsWith(`${user.id}/${roomId}/`)) {
    return NextResponse.json(
      { error: "Key does not match caller and room" },
      { status: 403 },
    );
  }

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

  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!accountId || !bucket) {
    return NextResponse.json(
      { error: "R2 not configured on server" },
      { status: 500 },
    );
  }

  // Public-ish URL — R2 buckets fronted via a custom domain, signed
  // via Supabase storage RLS on read. We store both the R2 key and a
  // canonical URL so clients can render without round-tripping through
  // the API for a signed GET.
  const r2Url = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;

  const { data: existing } = await supabase
    .from("photos")
    .select("sort_order")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder =
    existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data: photo, error } = await supabase
    .from("photos")
    .insert({
      room_id: roomId,
      inspection_id: inspectionId,
      r2_key: key,
      r2_url: r2Url,
      mime_type: mimeType ?? "image/jpeg",
      size_bytes: sizeBytes ?? 0,
      sort_order: nextOrder,
      sha256_hash: sha256,
      exif_timestamp: exifTimestamp ?? null,
      captured_at: capturedAt,
      source: "mobile-camera",
    })
    .select("id, sort_order")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    photoId: photo.id,
    sortOrder: photo.sort_order,
  });
}
