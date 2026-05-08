/**
 * POST /api/mobile/push-token
 *
 * Upserts a device push token for the authenticated user.
 * Called from src/lib/mobile/notifications.ts after the Capacitor
 * PushNotifications plugin returns a registration token.
 *
 * Body: { token: string; platform: "ios" | "android" }
 *
 * DELETE /api/mobile/push-token
 *
 * Removes a token when the app deregisters (e.g. logout).
 * Body: { token: string }
 */
import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return (cookieStore as unknown as { getAll(): { name: string; value: string }[] }).getAll();
        },
        setAll(toSet: { name: string; value: string; options?: unknown }[]) {
          try {
            for (const { name, value, options } of toSet) {
              (cookieStore as unknown as { set(name: string, value: string, options: unknown): void }).set(
                name,
                value,
                options
              );
            }
          } catch {
            /* read-only context, ignore */
          }
        },
      },
    }
  );
}

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { token?: string; platform?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token, platform } = body;
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }
  if (platform !== "ios" && platform !== "android") {
    return NextResponse.json({ error: "platform must be ios or android" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("device_tokens").upsert(
    { user_id: userId, token, platform, updated_at: new Date().toISOString() },
    { onConflict: "user_id,token", ignoreDuplicates: false }
  );

  if (error) {
    console.error("[push-token] upsert error:", error.message);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token } = body;
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("device_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("token", token);

  if (error) {
    console.error("[push-token] delete error:", error.message);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
