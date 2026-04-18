"use client";

/**
 * MobileGate — invisible boot component mounted in the root web layout.
 *
 * On Capacitor (iOS / Android) the app loads index.html on launch, which
 * renders the marketing landing. That is the wrong destination for a
 * native user. This component runs once on mount, detects the native
 * platform, reads the intro-completed preference, and replaces the
 * route to either:
 *   - /intro/        (first launch — has not seen onboarding)
 *   - /app-home/     (returning user)
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

export default function MobileGate() {
  const router = useRouter();

  useEffect(() => {
    if (!isNative()) return;
    let cancelled = false;
    void (async () => {
      const introDone = await prefGetBool(PrefKey.IntroCompletedV1);
      if (cancelled) return;
      router.replace(introDone ? "/app-home/" : "/intro/");
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
