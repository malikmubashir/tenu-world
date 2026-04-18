import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/mobile/upload-intent
 *
 * Mobile-only presigned-URL endpoint. The phone calls this to get a
 * short-lived PUT URL, then uploads the photo bytes directly to
 * Cloudflare R2. We never stream the binary through Vercel — mobile
 * networks are expensive and Vercel request size limits bite on large
 * JPEGs.
 *
 * Request body (JSON):
 *   {
 *     roomId: string,         // the room the photo belongs to
 *     inspectionId: string,   // checked against rooms.inspection_id
 *     mimeType: string,       // image/jpeg or image/png
 *     sizeBytes: number,      // for the sanity cap (< 15 MB)
 *     sha256: string,         // hex-encoded, returned back in commit
 *   }
 *
 * Response:
 *   {
 *     url: string,            // presigned PUT URL, expires in 5 min
 *     key: string,            // R2 key to send back in /upload-commit
 *     headers: Record<string,string>,  // headers the client MUST send
 *     expiresAt: string,      // ISO timestamp when URL dies
 *   }
 *
 * Auth: Supabase session cookie OR Authorization: Bearer <access_token>.
 * Mobile sends the bearer token — cookies don't flow across the
 * Capacitor / tenu.world origin boundary.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Bearer token fallback for native clients. createClient() already
  // reads cookies when present.
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    await supabase.auth.getUser(token); // side-effect: hydrates session
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    roomId?: string;
    inspectionId?: string;
    mimeType?: string;
    sizeBytes?: number;
    sha256?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { roomId, inspectionId, mimeType, sizeBytes, sha256 } = body;

  if (!roomId || !inspectionId || !mimeType || !sizeBytes || !sha256) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  if (!/^image\/(jpeg|png|heic|webp)$/i.test(mimeType)) {
    return NextResponse.json({ error: "Unsupported mimeType" }, { status: 400 });
  }

  if (sizeBytes > 15 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Photo exceeds 15 MB limit" },
      { status: 413 },
    );
  }

  if (!/^[a-f0-9]{64}$/i.test(sha256)) {
    return NextResponse.json(
      { error: "sha256 must be 64-char hex" },
      { status: 400 },
    );
  }

  // Ownership check. RLS protects the metadata row later, but we want
  // a clean 403 before spending a presigned URL.
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
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    return NextResponse.json(
      { error: "R2 not configured on server" },
      { status: 500 },
    );
  }

  const ext =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/heic"
        ? "heic"
        : mimeType === "image/webp"
          ? "webp"
          : "jpg";
  const key = `${user.id}/${roomId}/${Date.now()}-${sha256.slice(0, 8)}.${ext}`;

  // Defer-import the SDK so web bundles don't pick it up.
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const putCmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: mimeType,
    ContentLength: sizeBytes,
    // The x-amz-checksum-sha256 header is base64, not hex. We skip it
    // on the server side — the client still verifies the hash against
    // its local copy after a successful upload.
  });

  const expiresIn = 300; // 5 minutes
  const url = await getSignedUrl(s3, putCmd, { expiresIn });

  return NextResponse.json({
    url,
    key,
    headers: {
      "Content-Type": mimeType,
    },
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  });
}
