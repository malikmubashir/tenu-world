import type { Metadata } from "next";
import Link from "next/link";
import CookiePreferencesResetter from "../fr/CookiePreferencesResetter";

export const metadata: Metadata = {
  title: "Cookie policy",
  description:
    "Cookie and tracker policy for Tenu.World.",
  robots: { index: true, follow: true },
};

/**
 * Cookie policy — EN version. Linked from the cookie banner
 * "Manage choices" when the user is in English.
 */
export default function CookiePolicyEnPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-tenu-slate">
      <header className="mb-8">
        <Link href="/" className="text-xl font-bold text-tenu-forest">
          tenu
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-tenu-forest">
          Cookie policy
        </h1>
        <p className="mt-1 text-sm text-tenu-slate/60">
          Last updated: 17 April 2026 · version v1.0-2026-04-17
        </p>
      </header>

      <section className="space-y-5 text-sm leading-relaxed">
        <p>
          Tenu.World uses cookies and similar technologies to run the
          service, measure usage and improve your experience. This page
          lists the categories used and how to control them.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-tenu-forest">
          1. Strictly necessary cookies
        </h2>
        <p>
          Required to run the service: authentication session, language
          preference, CSRF protection, checkout. No consent required
          (art. 82 LIL exemption, ePrivacy Directive).
        </p>

        <h2 className="mt-6 text-lg font-semibold text-tenu-forest">
          2. Analytics cookies
        </h2>
        <p>
          Help us understand how the service is used, spot slow pages
          and fix bugs. Set only after your explicit consent.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-tenu-forest">
          3. Marketing and third-party cookies
        </h2>
        <p>
          Used to measure campaign effectiveness and tailor content.
          Off by default, enabled only if you click &laquo;Accept
          all&raquo; in the banner.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-tenu-forest">
          4. Change your preferences
        </h2>
        <p>
          You can change your mind at any time. Use the button below
          to re-open the preference banner.
        </p>

        <CookiePreferencesResetter locale="en" />

        <h2 className="mt-6 text-lg font-semibold text-tenu-forest">
          5. Legal basis and retention
        </h2>
        <p>
          Legal basis: consent (GDPR art. 6.1.a) for non-essential
          cookies; legitimate interest (art. 6.1.f) and contract
          performance (art. 6.1.b) for strictly necessary cookies.
          Maximum retention: 13 months (CNIL recommendation).
        </p>

        <h2 className="mt-6 text-lg font-semibold text-tenu-forest">
          6. Contact
        </h2>
        <p>
          Questions about cookies:{" "}
          <a href="mailto:dpo@tenu.world" className="text-tenu-forest underline">
            dpo@tenu.world
          </a>
          .
        </p>
      </section>

      <footer className="mt-10 border-t border-tenu-cream-dark pt-6 text-xs text-tenu-slate/60">
        <Link href="/legal/privacy/en" className="underline hover:no-underline">
          Privacy policy
        </Link>
        {" · "}
        <Link href="/legal/terms/en" className="underline hover:no-underline">
          Terms of use
        </Link>
      </footer>
    </main>
  );
}
