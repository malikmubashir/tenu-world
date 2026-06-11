/**
 * Launch funnel instrumentation (#T187, 2026-06-11).
 *
 * Single write path into public.funnel_events — the table behind the
 * docs/17 adjudication metrics: acquisition source, conversion funnel,
 * attach rate. Funnel stages, in order:
 *
 *   landing            first attributed visit (middleware, utm_* or ?src=)
 *   signup             auth callback, new user (attribution from cookie)
 *   inspection_created POST /api/inspection/create success
 *   checkout_started   POST /api/checkout — Stripe session created
 *   paid               Stripe webhook — new payments row inserted
 *   scanned            POST /api/ai/scan success
 *   letter_purchased   Stripe webhook — product includes dispute
 *   outcome_survey     14-day Brevo survey response (Pipeline 3, later)
 *
 * The table is service-role only (RLS enabled, zero policies — see
 * supabase/migrations/0003_funnel_events.sql), so writes go through the
 * admin client. That is a deliberate, narrow exception to the "no admin
 * client in user-facing routes" rule in src/lib/supabase/admin.ts: this
 * module only ever INSERTs analytics rows, never reads or touches
 * user-scoped tables.
 *
 * Fire-and-forget by contract: recordFunnelEvent NEVER throws and is
 * never awaited by callers. Analytics must not be able to fail a
 * payment, a scan, or a login — a dropped event is a console.warn.
 */

export type FunnelEvent =
  | "landing"
  | "signup"
  | "inspection_created"
  | "checkout_started"
  | "paid"
  | "scanned"
  | "letter_purchased"
  | "outcome_survey";

export interface FunnelEventContext {
  userId?: string | null;
  anonymousId?: string | null;
  source?: string | null;
  utm?: Record<string, string> | null;
  locale?: string | null;
  path?: string | null;
}

/**
 * First-touch attribution cookie, stamped by middleware on the first
 * request that carries ?src= or utm_* params, drained (read, not
 * cleared) by the auth callback when the signup event is recorded.
 * 90 days — long enough to cover a typical "saw a flyer in September,
 * disputed the deposit in November" student journey.
 */
export const ATTRIBUTION_COOKIE = "tenu_attr";
export const ATTRIBUTION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export interface AttributionPayload {
  source: string | null;
  utm: Record<string, string> | null;
  landed_at: string;
  path: string;
}

/** Decode the tenu_attr cookie. Returns null on any malformed input. */
export function decodeAttribution(
  raw: string | undefined | null,
): AttributionPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as AttributionPayload;
    if (typeof parsed !== "object" || parsed === null) return null;
    return {
      source: typeof parsed.source === "string" ? parsed.source : null,
      utm:
        parsed.utm && typeof parsed.utm === "object" ? parsed.utm : null,
      landed_at: typeof parsed.landed_at === "string" ? parsed.landed_at : "",
      path: typeof parsed.path === "string" ? parsed.path : "/",
    };
  } catch {
    return null;
  }
}

/**
 * Record one funnel event. Fire-and-forget: call without await, never
 * throws into the caller. The admin client is imported lazily so this
 * module stays importable from any server context (and from tests that
 * do not mock @/lib/supabase/admin — the failed import is swallowed).
 */
export function recordFunnelEvent(
  event: FunnelEvent,
  ctx: FunnelEventContext = {},
): void {
  void (async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    const { error } = await supabase.from("funnel_events").insert({
      user_id: ctx.userId ?? null,
      anonymous_id: ctx.anonymousId ?? null,
      event,
      source: ctx.source ?? null,
      utm: ctx.utm ?? null,
      locale: ctx.locale ?? null,
      path: ctx.path ?? null,
    });
    if (error) {
      console.warn(`[funnel] '${event}' insert failed:`, error.message);
    }
  })().catch((err) => {
    console.warn(
      `[funnel] '${event}' dropped:`,
      err instanceof Error ? err.message : err,
    );
  });
}
