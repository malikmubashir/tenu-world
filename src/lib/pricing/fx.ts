/**
 * FX helpers: EUR/GBP lookup from fx_rates table + unit conversion.
 *
 * The rate is fetched once daily from ECB by /api/cron/ecb-fx and stored in
 * supabase.fx_rates. At runtime we do a single SELECT on the admin client
 * (bypasses RLS, avoids user-context cookie dependency in server components).
 *
 * Fallback: if the table is empty or the query fails we use a hardcoded rate
 * that is updated here on any material GBP swing (>2%). This prevents the UK
 * pricing from breaking on a cold start or Supabase hiccup.
 */

import { createAdminClient } from "@/lib/supabase/admin";

/** Hardcoded fallback — update if GBP moves >2% vs this baseline. */
const FALLBACK_EUR_GBP = 0.856;

/**
 * Returns the most recent EUR→GBP rate from the database, or the hardcoded
 * fallback if no row exists or the query throws.
 */
export async function getLatestEurGbp(): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("fx_rates")
      .select("eur_gbp")
      .order("date", { ascending: false })
      .limit(1)
      .single();

    if (data?.eur_gbp && typeof data.eur_gbp === "number" && data.eur_gbp > 0) {
      return data.eur_gbp;
    }
  } catch {
    // db unavailable — fall through to hardcoded rate
  }
  return FALLBACK_EUR_GBP;
}

/**
 * Converts a EUR amount in cents to GBP pence using the provided rate.
 * Rounds to nearest penny.
 */
export function convertEurCentsToGbpCents(eurCents: number, eurGbpRate: number): number {
  return Math.round(eurCents * eurGbpRate);
}
