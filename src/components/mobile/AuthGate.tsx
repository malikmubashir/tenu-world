"use client";

/**
 * AuthGate — guards every screen under /app-home.
 *
 * Runs once on mount, asks Supabase for the current session, and:
 *   - has session → renders children
 *   - no session  → router.replace('/login/')
 *
 * Web pre-render emits the gated children in the static export so the
 * JS chunk is shipped; the actual gate fires client-side after hydration.
 * A short paper-coloured veil masks the flicker.
 *
 * On the web (non-native), the gate is a passthrough — the web auth
 * flow already lives behind the middleware redirect to /auth/login.
 */
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isNative } from "@/lib/mobile/platform";
import { createClient } from "@/lib/supabase/client";
import { startSyncLoop } from "@/lib/mobile/sync/syncEngine";

type AuthState = "checking" | "authed" | "anon";

export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>("checking");

  useEffect(() => {
    // Web: rely on middleware. No client-side check needed.
    if (!isNative()) {
      setState("authed");
      return;
    }
    let cancelled = false;
    let stopSync: (() => void) | null = null;
    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          setState("authed");
          // Start the background upload sync loop. Token is refreshed on
          // each drain tick so short-lived JWTs never block an upload.
          stopSync = startSyncLoop(async () => {
            const { data: s } = await supabase.auth.getSession();
            return s.session?.access_token ?? null;
          });
        } else {
          setState("anon");
          router.replace("/login/");
        }
      } catch {
        if (cancelled) return;
        setState("anon");
        router.replace("/login/");
      }
    })();
    return () => {
      cancelled = true;
      stopSync?.();
    };
  }, [router]);

  // Render the paper veil during the check + redirect frame so the
  // user never sees the gated UI flash.
  if (state !== "authed") {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ backgroundColor: "#F4F1EA" }}
        aria-hidden="true"
      />
    );
  }

  return <>{children}</>;
}
