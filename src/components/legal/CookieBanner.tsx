"use client";

/**
 * CookieBanner — first-visit consent surface for non-essential cookies.
 *
 * Legal basis: ePrivacy Directive (art. 82 Loi Informatique et Libertés)
 * + GDPR Art. 6.1.a. Strictly necessary cookies need no consent;
 * analytics and marketing do.
 *
 * UX model (CNIL deliberation 2020-091, deliberation 2021-014):
 *
 *   Stage 1 — three equal buttons:
 *     [Tout accepter]  [Personnaliser]  [Tout refuser]
 *
 *     Accept filled, Customize and Refuse outlined, all identical
 *     width and height. Order is product choice; CNIL only requires
 *     that Refuse is visible and as easy to reach as Accept — same
 *     level, same weight. No nudging.
 *
 *   Stage 2 — Personnaliser opens an inline panel:
 *     [x] Analyses d'usage        (first-party analytics)
 *     [x] Marketing et tiers      (third-party pixels)
 *     [Enregistrer mes choix]
 *
 *     Two toggles because analytics and marketing are materially
 *     different purposes. CNIL sanctions (Cdiscount 2020, Yahoo 2023)
 *     hit sites that grouped third-party pixels with first-party
 *     measurement. Granular saves us from that case.
 *
 * Hosts that need runtime gating (analytics beacons, Google Maps
 * tiles, marketing pixels) must check readCookiePrefs()?.analytics or
 * .marketing before firing. Otherwise the banner text becomes false
 * and the whole compliance story collapses.
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
  type CookiePrefs,
  type Locale,
} from "@/lib/legal/consents";

interface Props {
  /**
   * Locale resolved by the layout. Cookie banner stays in that
   * language; the user can change language and reset prefs from
   * /legal/cookies.
   */
  locale: Locale;
}

type Stage = "hidden" | "banner" | "customize";

const GRANULAR_COPY: Record<
  Locale,
  {
    title: string;
    analyticsLabel: string;
    analyticsHint: string;
    marketingLabel: string;
    marketingHint: string;
    essentialLabel: string;
    essentialHint: string;
    save: string;
    back: string;
  }
> = {
  fr: {
    title: "Personnaliser vos cookies",
    analyticsLabel: "Analyses d'usage",
    analyticsHint:
      "Nous aide à repérer les pages lentes, les bugs et les parcours qui bloquent. Données agrégées, pas de profilage.",
    marketingLabel: "Marketing et tiers",
    marketingHint:
      "Mesure de campagnes et pixels tiers (Meta, Google Ads). Nécessite de partager des données avec des prestataires.",
    essentialLabel: "Strictement nécessaire",
    essentialHint:
      "Authentification, langue, panier de paiement. Ne peut pas être désactivé.",
    save: "Enregistrer mes choix",
    back: "Retour",
  },
  en: {
    title: "Customize your cookies",
    analyticsLabel: "Usage analytics",
    analyticsHint:
      "Helps us spot slow pages, bugs and broken flows. Aggregated data, no profiling.",
    marketingLabel: "Marketing and third parties",
    marketingHint:
      "Campaign measurement and third-party pixels (Meta, Google Ads). Requires data sharing with vendors.",
    essentialLabel: "Strictly necessary",
    essentialHint:
      "Auth, language, checkout. Cannot be disabled.",
    save: "Save my choices",
    back: "Back",
  },
};

export default function CookieBanner({ locale }: Props) {
  const [stage, setStage] = useState<Stage>("hidden");
  const [mounted, setMounted] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const copy = COOKIE_BANNER_COPY[locale];
  const g = GRANULAR_COPY[locale];

  useEffect(() => {
    setMounted(true);
    const existing = readCookiePrefs();
    if (!existing) {
      setStage("banner");
    } else {
      // Prime the toggles with the existing choice if the user later
      // re-opens the panel from /legal/cookies (future wire-up).
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
    }
  }, []);

  async function persistAndClose(prefs: CookiePrefs, grantedFlag: boolean) {
    writeCookiePrefs(prefs);
    setStage("hidden");

    // Best-effort audit row for authenticated users. 401 for anon is
    // expected — localStorage remains the source of truth for banner
    // suppression.
    try {
      await fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "cookies_nonessential",
          locale,
          granted: grantedFlag,
        }),
        keepalive: true,
      });
    } catch {
      // Ignore network failure — banner won't reappear either way.
    }
  }

  function onRefuseAll() {
    void persistAndClose(defaultRejectedPrefs(locale), false);
  }

  function onAcceptAll() {
    void persistAndClose(allAcceptedPrefs(locale), true);
  }

  function onCustomize() {
    const existing = readCookiePrefs();
    setAnalytics(existing?.analytics ?? false);
    setMarketing(existing?.marketing ?? false);
    setStage("customize");
  }

  function onSaveCustom() {
    const prefs: CookiePrefs = {
      essential: true,
      analytics,
      marketing,
      textVersion: COOKIES_TEXT_VERSION,
      decidedAt: Date.now(),
      locale,
    };
    // granted=true iff the user enabled at least one non-essential
    // category. Mirrors the boolean we store in public.consents.
    void persistAndClose(prefs, analytics || marketing);
  }

  if (!mounted || stage === "hidden") return null;

  // ─────────────────────────────────────────────────────────────
  // Stage 1 — the three-button banner
  // ─────────────────────────────────────────────────────────────
  if (stage === "banner") {
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
              {locale === "fr" ? "En savoir plus" : "Learn more"}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:self-center">
            <button
              type="button"
              onClick={onAcceptAll}
              className="rounded-lg bg-tenu-forest px-4 py-2 text-sm font-medium text-white hover:bg-tenu-forest-light"
            >
              {copy.acceptAll}
            </button>
            <button
              type="button"
              onClick={onCustomize}
              className="rounded-lg border border-tenu-forest px-4 py-2 text-sm font-medium text-tenu-forest hover:bg-tenu-cream"
            >
              {copy.manage}
            </button>
            <button
              type="button"
              onClick={onRefuseAll}
              className="rounded-lg border border-tenu-forest px-4 py-2 text-sm font-medium text-tenu-forest hover:bg-tenu-cream"
            >
              {copy.rejectAll}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Stage 2 — granular panel. Two toggles, one save.
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={g.title}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-4"
    >
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-lg sm:rounded-2xl sm:p-6">
        <h2 className="mb-1 text-lg font-semibold text-tenu-forest">
          {g.title}
        </h2>
        <p className="mb-4 text-xs leading-relaxed text-tenu-slate/70">
          {copy.body}
        </p>

        {/* Essential — always on, disabled toggle to make invariant obvious */}
        <div className="mb-3 rounded-lg border border-tenu-cream-dark bg-tenu-cream/50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-tenu-slate">
                {g.essentialLabel}
              </p>
              <p className="mt-0.5 text-xs text-tenu-slate/70">
                {g.essentialHint}
              </p>
            </div>
            <input
              type="checkbox"
              checked
              disabled
              aria-label={g.essentialLabel}
              className="mt-1 h-4 w-4 accent-tenu-forest opacity-60"
            />
          </div>
        </div>

        {/* Analytics — first-party */}
        <label className="mb-3 block cursor-pointer rounded-lg border border-tenu-cream-dark p-3 hover:bg-tenu-cream/40">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-tenu-slate">
                {g.analyticsLabel}
              </p>
              <p className="mt-0.5 text-xs text-tenu-slate/70">
                {g.analyticsHint}
              </p>
            </div>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              className="mt-1 h-4 w-4 accent-tenu-forest"
            />
          </div>
        </label>

        {/* Marketing — third-party. Kept separate from analytics on purpose. */}
        <label className="mb-5 block cursor-pointer rounded-lg border border-tenu-cream-dark p-3 hover:bg-tenu-cream/40">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-tenu-slate">
                {g.marketingLabel}
              </p>
              <p className="mt-0.5 text-xs text-tenu-slate/70">
                {g.marketingHint}
              </p>
            </div>
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="mt-1 h-4 w-4 accent-tenu-forest"
            />
          </div>
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStage("banner")}
            className="flex-1 rounded-lg border border-tenu-cream-dark px-4 py-2.5 text-sm font-medium text-tenu-slate hover:bg-tenu-cream"
          >
            {g.back}
          </button>
          <button
            type="button"
            onClick={onSaveCustom}
            className="flex-[2] rounded-lg bg-tenu-forest px-4 py-2.5 text-sm font-medium text-white hover:bg-tenu-forest-light"
          >
            {g.save}
          </button>
        </div>
      </div>
    </div>
  );
}
