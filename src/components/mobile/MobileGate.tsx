"use client";

/**
 * MobileGate — invisible boot component mounted in the root web layout.
 *
 * On Capacitor (iOS / Android) the app loads index.html on launch, which
 * renders the marketing landing. That is the wrong destination for a
 * native user. This component runs once on mount, detects the native
 * platform, then routes to whichever screen makes sense:
 *
 *   1. Has not seen onboarding         → /intro/
 *   2. Has seen onboarding, no session → /login/
 *   3. Has session                     → /app-home/
 *
 * On the web (Vercel deploy) the component is a no-op so the marketing
 * page renders unchanged.
 *
 * Trade-off: the marketing landing flashes for ~150ms on app launch
 * before redirect. The Capacitor SplashScreen.hide() in Shell.tsx is
 * tuned to outlast this so the user only sees the splash → destination.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNative } from "@/lib/mobile/platform";
import { prefGetBool, PrefKey } from "@/lib/mobile/preferences";
import { createClient } from "@/lib/supabase/client";

export default function MobileGate() {
  const router = useRouter();

  useEffect(() => {
    if (!isNative()) return;
    let cancelled = false;

    void (async () => {
      const introDone = await prefGetBool(PrefKey.IntroCompletedV1);
      if (cancelled) return;
      if (!introDone) {
        router.replace("/intro/");
        return;
      }

      // Onboarding done — check Supabase session before sending to app-home.
      let hasSession = false;
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        hasSession = !!data.session;
      } catch {
        // Supabase env vars missing in dev — treat as not-logged-in so the
        // login screen renders rather than a blank app-home that errors.
        hasSession = false;
      }
      if (cancelled) return;
      router.replace(hasSession ? "/app-home/" : "/login/");
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
