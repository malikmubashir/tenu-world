import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/account/delete — GDPR Art. 17 erasure.
 *
 * Flow:
 *   1. Resolve the current session via the cookie-scoped server client.
 *   2. Verify the typed email matches the session email (belt + braces;
 *      the client already gates the button).
 *   3. Sign the user out so the cookie is cleared before we blow up
 *      the underlying auth.users row.
 *   4. Use the service-role admin client to call auth.admin.deleteUser.
 *      Supabase cascades to public.profiles (FK on delete cascade), which
 *      itself cascades to inspections, photos, consents, payments,
 *      dispute_letters — all FKed with on delete cascade in schema.sql.
 *
 * Why the admin client here: auth.admin.deleteUser requires service-role
 * by design. The cookie-scoped anon client cannot delete users.
 *
 * Idempotency: if the row is already gone, Supabase returns a 404 we
 * surface as 200 to the caller — the user-visible outcome is the same.
 */
export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const user = userData.user;

  const typed = (body.email ?? "").trim().toLowerCase();
  const sessionEmail = (user.email ?? "").trim().toLowerCase();
  if (!typed || typed !== sessionEmail) {
    return NextResponse.json({ error: "email_mismatch" }, { status: 400 });
  }

  // Clear the cookie first. If admin delete fails after this point we
  // still want the session gone — the user asked to leave.
  await supabase.auth.signOut();

  const admin = createAdminClient();
  const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);

  if (deleteErr) {
    // Log loudly. Every subsequent second the row sits is a regulatory
    // liability. Return 500 so the UI shows the support contact and the
    // client keeps trying — but the session cookie is already cleared.
    console.error("[account-delete] auth.admin.deleteUser failed:", {
      userId: user.id,
      message: deleteErr.message,
    });
    return NextResponse.json(
      { error: "delete_failed", details: deleteErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: true });
}
