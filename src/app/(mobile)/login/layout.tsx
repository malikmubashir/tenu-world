"use client";

/**
 * Login layout — Shell only, no TabBar.
 *
 * Pre-auth state. The bottom tab bar belongs to the post-login app-home
 * tree; before sign-in there's nothing to switch between.
 */
import type { ReactNode } from "react";
import Shell from "@/components/mobile/Shell";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <Shell>
      <main className="flex flex-1 flex-col">{children}</main>
    </Shell>
  );
}
