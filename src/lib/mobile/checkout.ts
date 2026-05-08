/**
 * Stripe Checkout in-app web view for Capacitor native apps.
 *
 * Opens Stripe Checkout in SFSafariViewController (iOS) or Chrome Custom
 * Tab (Android) via @capacitor/browser. These system-provided browsers
 * inherit stored passwords/cards, show the site's HTTPS padlock, and stay
 * inside the app — exactly what Stripe recommends for mobile.
 *
 * Flow:
 *   1. App calls POST /api/checkout, receives { url: string }
 *   2. openStripeCheckout(url, inspectionId) opens the Capacitor Browser
 *   3. Stripe redirects on success to:
 *        https://tenu.world/inspection/{id}/payment-return?status=paid
 *      (iOS Universal Link / Android App Link intercepts this)
 *   4. App.appUrlOpen fires → deepLink.ts parses the URL as a return intent
 *   5. Browser closes, app navigates to the report page
 *
 * On web (non-native), falls back to a standard window.location redirect
 * so the same calling code works in the browser-based checkout flow.
 *
 * Return-URL deep-link format:
 *   successUrl: https://tenu.world/inspection/{id}/payment-return?status=paid
 *   cancelUrl:  https://tenu.world/inspection/{id}/payment-return?status=cancelled
 *
 * The /inspection/[id]/payment-return page (or a route handler) handles
 * these and redirects to the final report or back to the upload step.
 */
import { isNative } from "./platform";

export interface CheckoutOptions {
  inspectionId: string;
  /**
   * Callback fired when the in-app browser closes, regardless of whether
   * the payment succeeded or was cancelled. The result is determined by
   * reading the payment status from Supabase (Stripe webhook will have
   * already updated it), not from the URL — URL params can be spoofed.
   */
  onClose?: () => void;
}

/**
 * Opens a Stripe Checkout URL in the appropriate browser surface.
 *
 * @param stripeUrl - The `url` returned by POST /api/checkout
 * @param options   - Inspection context + close callback
 */
export async function openStripeCheckout(
  stripeUrl: string,
  options: CheckoutOptions
): Promise<void> {
  if (!isNative()) {
    // Web: Stripe Checkout is a full-page redirect.
    window.location.href = stripeUrl;
    return;
  }

  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({
      url: stripeUrl,
      // presentationStyle: "fullscreen" keeps the transition consistent with
      // what Stripe recommends; "popover" is the default on iPad which would
      // look odd here.
      presentationStyle: "fullscreen",
      // toolbarColor: "#0B1F3A" — Identity v1 navy. Tints the Safari toolbar
      // on iOS so the transition feels branded. Ignored on Android.
      toolbarColor: "#0B1F3A",
    });

    // Listen for the browser finishing. On iOS this fires when the user taps
    // "Done" or the Universal Link redirect triggers a close. On Android it
    // fires when the Custom Tab is dismissed.
    const handle = await Browser.addListener("browserFinished", () => {
      handle.remove();
      options.onClose?.();
    });
  } catch (err) {
    // Plugin unavailable (web preview, old Capacitor) — fall back to redirect
    console.warn("[checkout] Browser plugin unavailable, falling back:", err);
    window.location.href = stripeUrl;
  }
}

/**
 * Builds the success and cancel return URLs for a Stripe Checkout session.
 * Both land on the same page; the `status` param distinguishes the outcome.
 * The page calls the Stripe API server-side to verify (never trust the URL).
 */
export function stripeReturnUrls(inspectionId: string): {
  successUrl: string;
  cancelUrl: string;
} {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "https://tenu.world";

  const base = `${origin}/inspection/${inspectionId}/payment-return`;
  return {
    successUrl: `${base}?status=paid`,
    cancelUrl: `${base}?status=cancelled`,
  };
}
