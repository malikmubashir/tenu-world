"use client";

/**
 * CookieBanner — first-visit consent surface for non-essential cookies.
 *
 * Legal basis: ePrivacy Directive (transposed as art. 82 Loi
 * Informatique et Libertés) + GDPR Art. 6.1.a. Strictly necessary
 * cookies do not need consent; analytics and marketing do.
 *
 * UX rules enforced here:
 *   - No dark patterns. "Essential only" and "Accept all" share the
 *     same visual weight.
 *   - Rejection is as easy as acceptance. Single click, no scrolling.
 *   - Default = no non-essential cookies fire. If the banner is on
 *     screen, analytics/marketing MUST NOT be loaded yet.
 *   - A decision is remembered in localStorage under COOKIE_PREFS_KEY.
 *     Authenticated users also get a row in public.consents.
 *
 * Hosts that need runtime gating (analytics, Google Maps tile load,
 * marketing pixels) should check `readCookiePrefs()?.analytics` /
 * `.marketing` before firing.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  COOKIE_BANNER_COPY,
  COOKIES_TEXT_VERSION,
  allAcceptedPrefs,
  defaultRejectedPrefs,
  readCookiePrefs,
  writeCookiePrefs,
  type Locale,
} from "@/lib/legal/consents";

interface Props {
  /**
   * Locale resolved from the layout. Cookie banner stays in that
   * language even if the user later switches — they can re-open it
   * from /legal/cookies to change language.
   */
  locale: Locale;
}

export default function CookieBanner({ locale }: Props) {
  // Render nothing on the server. The banner is a client decision and
  // hydrating from localStorage avoids a flash of banner for returning
  // visitors.
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const copy = COOKIE_BANNER_COPY[locale];

  useEffect(() => {
    setMounted(true);
    const existing = readCookiePrefs();
    setVisible(!existing);
  }, []);

  async function persist(granted: boolean) {
    const prefs = granted ? allAcceptedPrefs(locale) : defaultRejectedPrefs(locale);
    writeCookiePrefs(prefs);
    setVisible(false);

    // Best-effort mirror to DB for authenticated users. Anon visitors
    // keep the preference in localStorage only.
    try {
      await fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "cookies_nonessential",
          locale,
          granted,
        }),
        // Fire-and-forget — a 401 for anon users is expected and fine.
        keepalive: true,
      });
    } catch {
      // Network error — localStorage is still authoritative for the
      // banner not reappearing. Server audit trail will pick up on
      // next authed visit via readCookiePrefs() + sync.
    }
  }

  if (!mounted || !visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={copy.ariaLabel}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-tenu-cream-dark bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] sm:p-5"
      data-cookies-text-version={COOKIES_TEXT_VERSION}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex-1">
          <h2 className="mb-1 text-sm font-semibold text-tenu-forest">
            {copy.title}
          </h2>
          <p className="text-xs leading-relaxed text-tenu-slate/80">
            {copy.body}
          </p>
          <Link
            href={locale === "fr" ? "/legal/cookies/fr" : "/legal/cookies/en"}
            className="mt-1 inline-block text-xs text-tenu-forest underline hover:no-underline"
          >
            {copy.manage}
          </Link>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:self-center">
          <button
            type="button"
            onClick={() => persist(false)}
            className="rounded-lg border border-tenu-forest px-4 py-2 text-sm font-medium text-tenu-forest hover:bg-tenu-cream"
          >
            {copy.rejectAll}
          </button>
          <button
            type="button"
            onClick={() => persist(true)}
            className="rounded-lg bg-tenu-forest px-4 py-2 text-sm font-medium text-white hover:bg-tenu-forest-light"
          >
            {copy.acceptAll}
          </button>
        </div>
      </div>
    </div>
  );
}
