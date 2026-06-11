import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  collectUserR2Keys,
  purgeUserR2Objects,
} from "@/lib/storage/r2-erasure";

/**
 * POST /api/account/delete — GDPR Art. 17 erasure (droit à l'effacement).
 *
 * Flow:
 *   1. Resolve the current session via the cookie-scoped server client.
 *   2. Verify the typed email matches the session email (belt + braces;
 *      the client already gates the button).
 *   3. Purge the user's R2 objects BEFORE the DB cascade (Art. 17 covers
 *      the blobs, not just the rows): photos (photos.r2_key), contract
 *      PDFs (inspections.contract_pdf_r2_key), scan-report PDFs
 *      (risk_score.pdfUrl), dispute-letter PDFs (letter_pdf_url), plus a
 *      full sweep of the `${userId}/` key prefix. Generated PDFs contain
 *      the address, names and photos — before 2026-06-11 they were never
 *      purged at all (docs/architecture/04-Security.md §8.5, resolved).
 *      Purge failures are logged for a manual sweep and never block the
 *      DB erasure — one stale 404 must not stop the user from leaving.
 *   4. Sign the user out so the cookie is cleared before we blow up
 *      the underlying auth.users row.
 *   5. Use the service-role admin client to call auth.admin.deleteUser.
 *      Supabase cascades to public.profiles (FK on delete cascade), which
 *      itself cascades to inspections, photos, consents, payments,
 *      dispute_letters — all FKed with on delete cascade in schema.sql.
 *
 * Why the admin client here: auth.admin.deleteUser requires service-role
 * by design. The cookie-scoped anon client cannot delete users. The R2
 * key enumeration also uses it: by step 3 we are acting on the user's
 * explicit erasure request, and the purge must see rows even if RLS or
 * session state would hide them.
 *
 * Idempotency: if the row is already gone, Supabase returns a 404 we
 * surface as 200 to the caller — the user-visible outcome is the same.
 * R2-side, already-deleted objects count as success for the same reason.
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

  const admin = createAdminClient();

  // Art. 17: purge R2 blobs BEFORE the DB cascade removes the rows that
  // record their keys. Best-effort by design — failures are logged for a
  // manual sweep (the `${userId}/` prefix bounds it) and the DB erasure
  // proceeds regardless.
  try {
    const dbKeys = await collectUserR2Keys(admin, user.id);
    const purge = await purgeUserR2Objects(user.id, dbKeys);
    if (purge.failed.length > 0) {
      console.error(
        "[account-delete] R2 purge incomplete — manual sweep required:",
        { userId: user.id, prefix: `${user.id}/`, failed: purge.failed },
      );
    } else {
      console.info("[account-delete] R2 purge complete:", {
        userId: user.id,
        attempted: purge.attempted,
        deleted: purge.deleted,
      });
    }
  } catch (err) {
    console.error(
      "[account-delete] R2 purge failed — manual sweep required for prefix:",
      { userId: user.id, prefix: `${user.id}/`, err },
    );
  }

  // Clear the cookie next. If admin delete fails after this point we
  // still want the session gone — the user asked to leave.
  await supabase.auth.signOut();

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
