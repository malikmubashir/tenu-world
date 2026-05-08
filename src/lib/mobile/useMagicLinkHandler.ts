/**
 * useMagicLinkHandler
 *
 * Handles the two deep-link intents that need in-app routing on Capacitor:
 *
 *   1. auth-callback — a Supabase magic-link URL intercepted by an iOS
 *      Universal Link or Android App Link before Safari/Chrome opens.
 *
 *      Strategy: navigate the WebView to the production /auth/callback
 *      URL (https://tenu.world/auth/callback?...). The server-side Next.js
 *      route handler establishes the Supabase session, records the DPA
 *      consent from the SIGNUP_CONSENT_COOKIE (stamped by the login page),
 *      and redirects to the post-auth target. Navigation to tenu.world is
 *      allowed by capacitor.config.ts allowNavigation, so the WebView
 *      follows the redirect. After the server redirect lands on a static
 *      path (e.g. /inspection/new), the WebView serves it from out/.
 *
 *      We never call verifyOtp() from the client — the server owns the
 *      session-creation and consent-recording responsibilities; the hook
 *      only initiates the navigation.
 *
 *   2. payment-return — Stripe's successUrl/cancelUrl. When the in-app
 *      browser (SFSafariViewController / Chrome Custom Tab) is open, the
 *      Universal Link / App Link fires App.appUrlOpen. We push to the
 *      payment-return page which polls Supabase for the verified status.
 *
 * Mount this hook in Shell.tsx (or the root mobile layout) exactly once.
 * It is a no-op on web — guarded by isNative().
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onDeepLink } from "./deepLink";
import { isNative } from "./platform";

export function useMagicLinkHandler(): void {
  const router = useRouter();

  useEffect(() => {
    if (!isNative()) return;

    const unsubscribe = onDeepLink((intent) => {
      if (intent.kind === "auth-callback") {
        // Reconstruct the original callback URL on the production server.
        // The server route records the DPA consent and establishes the
        // Supabase session, then redirects to the post-auth page.
        const base = "https://tenu.world/auth/callback";
        const params = new URLSearchParams();
        if (intent.tokenHash) params.set("token_hash", intent.tokenHash);
        if (intent.type) params.set("type", intent.type);
        if (intent.code) params.set("code", intent.code);
        if (intent.redirect) params.set("redirect", intent.redirect);
        const qs = params.toString();
        // Full-page navigation so the server route handler runs in the
        // WebView and the Supabase session cookie is set correctly.
        window.location.href = qs ? `${base}?${qs}` : base;
        return;
      }

      if (intent.kind === "payment-return") {
        // Close the in-app browser first (it may still be open if the
        // App Link intercept fired before browserFinished). The
        // payment-return page polls Supabase for the real status — we
        // pass the URL hint as a fallback only.
        router.push(
          `/inspection/${intent.inspectionId}/payment-return?status=${intent.statusHint}`
        );
      }
    });

    return unsubscribe;
  }, [router]);
}
