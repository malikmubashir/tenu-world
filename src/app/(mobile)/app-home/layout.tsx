"use client";

/**
 * Mobile route tree root layout.
 *
 * All routes under /(mobile)/app-home are client-only — they get
 * statically exported when MOBILE_BUILD=1 and bundled into the
 * Capacitor webDir. No server components, no async server rendering.
 *
 * The web experience continues to use the main /app routes. This tree
 * is specifically for the native shell.
 */
import type { ReactNode } from "react";
import Shell from "@/components/mobile/Shell";
import TabBar from "@/components/mobile/TabBar";
import AuthGate from "@/components/mobile/AuthGate";

export default function AppHomeLayout({ children }: { children: ReactNode }) {
  return (
    <Shell>
      <AuthGate>
        <main className="flex flex-1 flex-col">{children}</main>
        <TabBar />
      </AuthGate>
    </Shell>
  );
}
