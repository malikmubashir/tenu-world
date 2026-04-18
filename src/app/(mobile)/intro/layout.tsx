"use client";

/**
 * Intro layout — Shell only, no TabBar.
 *
 * The bottom tab bar belongs to the app-home tree. The intro is a linear
 * carousel that owns the full viewport, so we mount the safe-area Shell
 * but not the TabBar.
 */
import type { ReactNode } from "react";
import Shell from "@/components/mobile/Shell";

export default function IntroLayout({ children }: { children: ReactNode }) {
  return (
    <Shell>
      <main className="flex flex-1 flex-col">{children}</main>
    </Shell>
  );
}
