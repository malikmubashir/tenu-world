/**
 * Shared consents infrastructure for the 4 UX touchpoints:
 *
 *   1. Signup    — DPA acceptance (Terms + Privacy, contract basis)
 *                  Required. Blocks login until ticked.
 *   2. Signup    — Marketing opt-in (GDPR Art. 6.1.a consent)
 *                  Optional. Unticked by default.
 *   3. Checkout  — 14-day withdrawal waiver (L221-28 1° CConso)
 *                  Two separate tickboxes. Handled by WithdrawalWaiver.
 *   4. Layout    — Non-essential cookies (ePrivacy, art. 82 LIL)
 *                  Cookie banner. Reject-non-essential is the default.
 *
 * Every checkbox records one row in public.consents with the exact
 * text_version the user saw. Git history is the legal audit trail.
 *
 * DO NOT translate the visible copy through an LLM. Any wording change
 * MUST bump the relevant *_TEXT_VERSION so prior consents remain tied
 * to the text they agreed to.
 */

// ───────────────────────────────────────────────────────────────
// Text versions — bump on ANY copy change
// ───────────────────────────────────────────────────────────────
export const DPA_TEXT_VERSION = "v1.0-2026-04-17";
export const MARKETING_TEXT_VERSION = "v1.0-2026-04-17";
export const COOKIES_TEXT_VERSION = "v1.0-2026-04-17";

// ───────────────────────────────────────────────────────────────
// Consent types — MUST match schema.sql check constraint
// ───────────────────────────────────────────────────────────────
export type ConsentType =
  | "withdrawal_waiver_l221_28"
  | "dpa_acceptance"
  | "marketing_optin"
  | "cookies_nonessential";

export type Locale = "fr" | "en";

// ───────────────────────────────────────────────────────────────
// Copy — FR + EN. Keep short, legally plain, no marketing fluff.
// ───────────────────────────────────────────────────────────────
export interface DpaCopy {
  label: string;
  /** Shown inline next to the checkbox. Keep one line. */
  required: string;
}

export const DPA_COPY: Record<Locale, DpaCopy> = {
  fr: {
    label:
      "J'accepte les Conditions d'utilisation et la Politique de confidentialité de Tenu.",
    required: "Obligatoire pour créer un compte.",
  },
  en: {
    label:
      "I accept Tenu's Terms of Use and Privacy Policy.",
    required: "Required to create an account.",
  },
};

export interface MarketingCopy {
  label: string;
  /** Shown inline under the checkbox. Clarifies it's optional. */
  hint: string;
}

export const MARKETING_COPY: Record<Locale, MarketingCopy> = {
  fr: {
    label:
      "J'accepte de recevoir des conseils, améliorations produit et communications marketing de Tenu. Je peux me désinscrire à tout moment.",
    hint: "Facultatif. Aucune influence sur l'accès au service.",
  },
  en: {
    label:
      "I agree to receive tips, product updates and marketing from Tenu. I can unsubscribe at any time.",
    hint: "Optional. Does not affect access to the service.",
  },
};

export interface CookieBannerCopy {
  title: string;
  body: string;
  /** Primary CTA — accept only strictly necessary */
  rejectAll: string;
  /** Secondary CTA — accept everything including analytics */
  acceptAll: string;
  /** Tertiary CTA — open /legal/cookies for granular choice */
  manage: string;
  /** Accessible label for the dialog */
  ariaLabel: string;
}

export const COOKIE_BANNER_COPY: Record<Locale, CookieBannerCopy> = {
  fr: {
    title: "Cookies",
    body:
      "Nous utilisons des cookies strictement nécessaires au fonctionnement du service. Les cookies d'analyse et marketing ne sont posés qu'avec votre accord. Vous pouvez modifier votre choix à tout moment depuis la page cookies.",
    rejectAll: "Tout refuser",
    acceptAll: "Tout accepter",
    manage: "Personnaliser",
    ariaLabel: "Bannière de gestion des cookies",
  },
  en: {
    title: "Cookies",
    body:
      "We use strictly necessary cookies to run the service. Analytics and marketing cookies are set only with your consent. You can change your choice at any time from the cookies page.",
    rejectAll: "Refuse all",
    acceptAll: "Accept all",
    manage: "Customize",
    ariaLabel: "Cookie preferences banner",
  },
};

// ───────────────────────────────────────────────────────────────
// Cookie that carries the signup consent intent across the OAuth /
// magic-link redirect. Read + cleared by /auth/callback.
// HTTP client-set (not httpOnly) — non-sensitive, just a marker.
// ───────────────────────────────────────────────────────────────
export const SIGNUP_CONSENT_COOKIE = "tenu_signup_consent";
export const SIGNUP_CONSENT_MAX_AGE_SECONDS = 60 * 30; // 30 min window

export interface SignupConsentIntent {
  dpa: boolean;
  marketing: boolean;
  locale: Locale;
  dpaTextVersion: string;
  marketingTextVersion: string;
  /** Millis since epoch when the user ticked. */
  tickedAt: number;
}

export function encodeSignupConsent(intent: SignupConsentIntent): string {
  // URL-safe base64 of JSON. Small payload, easy to inspect in devtools.
  if (typeof window === "undefined") return "";
  return btoa(JSON.stringify(intent))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeSignupConsent(raw: string | undefined): SignupConsentIntent | null {
  if (!raw) return null;
  try {
    const normalised = raw.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalised + "=".repeat((4 - (normalised.length % 4)) % 4);
    const json =
      typeof window === "undefined"
        ? Buffer.from(padded, "base64").toString("utf-8")
        : atob(padded);
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const p = parsed as Record<string, unknown>;
    if (typeof p.dpa !== "boolean") return null;
    if (typeof p.marketing !== "boolean") return null;
    if (p.locale !== "fr" && p.locale !== "en") return null;
    if (typeof p.dpaTextVersion !== "string") return null;
    if (typeof p.marketingTextVersion !== "string") return null;
    if (typeof p.tickedAt !== "number") return null;
    return p as unknown as SignupConsentIntent;
  } catch {
    return null;
  }
}

// ───────────────────────────────────────────────────────────────
// Cookie consent — persisted client-side in localStorage so the
// banner knows whether to appear. For authenticated users we ALSO
// post to /api/consents so the audit trail is in Postgres.
// ───────────────────────────────────────────────────────────────
export const COOKIE_PREFS_KEY = "tenu_cookie_prefs_v1";

export interface CookiePrefs {
  essential: true;           // always true — non-negotiable
  analytics: boolean;
  marketing: boolean;
  textVersion: string;
  decidedAt: number;
  locale: Locale;
}

export function defaultRejectedPrefs(locale: Locale): CookiePrefs {
  return {
    essential: true,
    analytics: false,
    marketing: false,
    textVersion: COOKIES_TEXT_VERSION,
    decidedAt: Date.now(),
    locale,
  };
}

export function allAcceptedPrefs(locale: Locale): CookiePrefs {
  return {
    essential: true,
    analytics: true,
    marketing: true,
    textVersion: COOKIES_TEXT_VERSION,
    decidedAt: Date.now(),
    locale,
  };
}

export function readCookiePrefs(): CookiePrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const p = parsed as Record<string, unknown>;
    if (p.textVersion !== COOKIES_TEXT_VERSION) {
      // Version bumped — force re-consent.
      window.localStorage.removeItem(COOKIE_PREFS_KEY);
      return null;
    }
    return p as unknown as CookiePrefs;
  } catch {
    return null;
  }
}

export function writeCookiePrefs(prefs: CookiePrefs): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(prefs));
}
