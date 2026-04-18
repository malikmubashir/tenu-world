import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — BYPASSES RLS.
 *
 * Use ONLY from server paths that have no user session:
 *   - Stripe webhook (no auth cookies, no bearer token)
 *   - Supabase scheduled functions / cron jobs
 *   - Admin back-office scripts
 *
 * NEVER import from a client component or a user-facing route.
 * `server-only` makes an accidental client import a build error.
 *
 * Background (2026-04-18): the consents write path silently failed in
 * prod for two weeks because public.consents had SELECT-only RLS and
 * no INSERT policy. We fixed that by adding user-scoped policies. The
 * Stripe webhook is the inverse case — it writes on behalf of a user
 * it can't authenticate as (request comes from Stripe, not the user's
 * browser). RLS was silently denying every payments/inspections/
 * dispute_letters write. Service-role bypasses RLS by design.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "createAdminClient: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
    );
  }
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
