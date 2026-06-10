"use client";

/**
 * /inspection/[id]/payment-return
 *
 * Landing page for Stripe Checkout redirects (both web and native in-app browser).
 *
 * Stripe redirects here with ?status=paid or ?status=cancelled after the user
 * completes or abandons checkout. We do NOT trust the URL param — it can be
 * spoofed. Instead we query Supabase for the inspection's current status
 * (set server-side by the Stripe webhook) and route accordingly.
 *
 * On native (Capacitor):
 *   - iOS Universal Link / Android App Link intercepts this URL and fires
 *     App.appUrlOpen → deepLink.ts → the in-app browser closes, and the
 *     app itself lands on this page inside the WebView.
 *   - The @capacitor/browser Browser plugin also fires "browserFinished"
 *     which triggers the onClose callback in checkout.ts.
 *
 * Outcomes:
 *   paid (verified from DB)    → redirect to /inspection/[id]/report
 *   cancelled / not yet paid   → redirect back to /inspection/[id]/review
 *                                 with a ?payment=cancelled query param
 *   error (DB unreachable)     → show retry link; do not 500
 */

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type VerifyState = "loading" | "paid" | "cancelled" | "error";

export default function PaymentReturnPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<VerifyState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const supabase = createClient();

      // Retry up to 8 × 750 ms = 6 s to give the Stripe webhook time to
      // land and update the inspection row before we check it.
      const MAX_TRIES = 8;
      const DELAY_MS = 750;

      for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, DELAY_MS));
        }
        if (cancelled) return;

        const { data, error } = await supabase
          .from("inspections")
          .select("status")
          .eq("id", params.id)
          .maybeSingle();

        if (error) {
          // Transient DB error — keep trying unless we've exhausted retries.
          if (attempt === MAX_TRIES - 1) {
            setState("error");
          }
          continue;
        }

        if (data?.status === "paid" || data?.status === "scanning") {
          // Webhook has already fired and updated the row.
          setState("paid");
          return;
        }

        // URL param is a hint only — if Stripe says cancelled, trust it
        // but stop polling rather than continuing to hit the DB.
        const urlStatus = searchParams.get("status");
        if (urlStatus === "cancelled") {
          setState("cancelled");
          return;
        }
      }

      // Exhausted retries — webhook has not landed yet or payment was not
      // completed. Fall back to URL param to decide UI.
      if (cancelled) return;
      const urlStatus = searchParams.get("status");
      setState(urlStatus === "paid" ? "paid" : "cancelled");
    }

    verify().catch(() => setState("error"));
    return () => {
      cancelled = true;
    };
  }, [params.id, searchParams]);

  // Redirect once we know the outcome.
  useEffect(() => {
    if (state === "paid") {
      router.replace(`/inspection/${params.id}/report`);
    } else if (state === "cancelled") {
      router.replace(`/inspection/${params.id}/review?payment=cancelled`);
    }
  }, [state, params.id, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-tenu-canvas text-tenu-ink">
      {state === "loading" && (
        <>
          <svg
            className="animate-spin h-8 w-8 text-tenu-ink motion-reduce:animate-none"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <p className="text-sm text-tenu-ink-muted">
            Verifying payment…
          </p>
        </>
      )}

      {state === "error" && (
        <div className="text-center space-y-3 px-6">
          <p className="font-medium">Could not verify payment status.</p>
          <p className="text-sm text-tenu-ink-muted">
            If your payment was successful you can view your report directly.
          </p>
          <a
            href={`/inspection/${params.id}/report`}
            className="inline-block mt-2 text-sm font-medium text-tenu-accent underline decoration-1 underline-offset-2"
          >
            Go to report →
          </a>
        </div>
      )}
    </div>
  );
}
