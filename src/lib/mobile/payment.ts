/**
 * Mobile payment handoff helpers (#T156).
 *
 * The scan endpoint is payment-gated (#T145): the app must send the user
 * through Stripe Checkout before POST /api/ai/scan succeeds. The session
 * is created from the app's authenticated API call (Bearer token) and the
 * returned Stripe URL is opened in the system browser surface — the Stripe
 * page needs no Tenu session, only the URL. Payment confirmation comes
 * back via the Stripe webhook flipping inspections.status to 'paid'; the
 * app polls that column with the helpers below.
 *
 * Pure functions only — no Capacitor imports — so they are unit-testable
 * under vitest without a native shim.
 */

/** Scan SKUs purchasable from the submit flow. Dispute is sold post-verdict
 *  on the web report surface only. */
export type MobileScanProduct = "report" | "exit_only";

/**
 * Maps the local draft type to the checkout SKU.
 *   entrée  → "report"    (tier-priced entry scan, pay at upload)
 *   sortie  → "exit_only" (flat €25 cold exit scan — the mobile flow has
 *                          no link to a prior entry record)
 */
export function scanProductForDraftType(
  draftType: string | undefined,
): MobileScanProduct {
  return draftType === "sortie" ? "exit_only" : "report";
}

/**
 * Stripe return URLs for an app-initiated checkout.
 *
 * Hardcoded to tenu.world: inside Capacitor, window.location.origin is the
 * local shell origin (capacitor://localhost), which Stripe cannot redirect
 * to. `from=app` tells the payment-return page to show a static
 * "return to the app" panel instead of redirecting — the external browser
 * holds no Tenu session, so the web report page would dead-end at login.
 */
export function appPaymentReturnUrls(inspectionId: string): {
  successUrl: string;
  cancelUrl: string;
} {
  const base = `https://tenu.world/inspection/${inspectionId}/payment-return`;
  return {
    successUrl: `${base}?status=paid&from=app`,
    cancelUrl: `${base}?status=cancelled&from=app`,
  };
}

/** First poll fires after this delay; webhooks usually land within seconds. */
export const PAYMENT_POLL_BASE_MS = 5_000;
/** Backoff ceiling — the user may sit on the Stripe page for minutes. */
export const PAYMENT_POLL_MAX_MS = 30_000;

/**
 * Delay before poll number `attempt` (0-based): 5s, 7.5s, 11.25s, …
 * capped at 30s. Gentle exponential backoff so an abandoned payment does
 * not hammer Supabase, while the happy path confirms within ~5s.
 */
export function nextPollDelayMs(attempt: number): number {
  const exp = PAYMENT_POLL_BASE_MS * Math.pow(1.5, Math.max(0, attempt));
  return Math.min(PAYMENT_POLL_MAX_MS, Math.round(exp));
}

/** Inspection statuses (migration 008) the awaiting-payment poller acts on. */
export type PaymentPollOutcome =
  | "keep_waiting" // not paid yet (submitted / capturing / unknown)
  | "run_scan" // paid — the app should fire POST /api/ai/scan
  | "scan_in_progress" // another surface already triggered the scan
  | "scan_done"; // scanned (or later) — go straight to the result UI

/** Classifies a polled inspections.status value for the submit flow. */
export function classifyPolledStatus(
  status: string | null | undefined,
): PaymentPollOutcome {
  switch (status) {
    case "paid":
      return "run_scan";
    case "scanning":
      return "scan_in_progress";
    case "scanned":
    case "disputed":
    case "closed":
      return "scan_done";
    default:
      return "keep_waiting";
  }
}
