"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  DPA_COPY,
  DPA_TEXT_VERSION,
  MARKETING_COPY,
  MARKETING_TEXT_VERSION,
  SIGNUP_CONSENT_COOKIE,
  SIGNUP_CONSENT_MAX_AGE_SECONDS,
  encodeSignupConsent,
  type Locale as ConsentLocale,
} from "@/lib/legal/consents";
import { type Locale, locales } from "@/lib/i18n/config";

/**
 * Login page — Google OAuth (primary) + magic link (fallback).
 *
 * Before either auth method fires, the user MUST tick the DPA
 * checkbox. The marketing checkbox is optional and defaults to
 * unchecked (GDPR Art. 7.2 — no pre-ticked boxes, no bundling).
 *
 * Tenu hardcodes only FR and EN. All other locales fall back to FR
 * chrome. Users who need another language use the on-demand translation
 * widget in the site header — machine-translated preview, unofficial.
 * Legal copy stays FR/EN only per consents.ts (avocat-reviewed text).
 */

// Google OAuth gate (2026-06-10): the new Supabase project has no Google
// provider yet — the legacy OAuth client is a burned credential, replaced
// by the Workspace-owned client in the #T028–#T037 migration. Until that
// lands, showing the button means showing a 400 to every user. Flip
// NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=1 in Vercel the day the provider is live.
const GOOGLE_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "1";

interface LoginCopy {
  title: string;
  subtitle: string;
  subtitleMagicOnly: string;
  emailLabel: string;
  emailPlaceholder: string;
  googleBtn: string;
  googleLoading: string;
  magicBtn: string;
  magicLoading: string;
  magicSent: string;
  magicSentBody: (email: string) => string;
  useOther: string;
  or: string;
  gateHint: string;
}

const UI_COPY: Record<"fr" | "en", LoginCopy> = {
  fr: {
    title: "Connexion",
    subtitle: "Continuez avec Google ou utilisez votre e-mail.",
    subtitleMagicOnly: "Recevez un lien de connexion par e-mail. Sans mot de passe.",
    emailLabel: "Adresse e-mail",
    emailPlaceholder: "vous@exemple.com",
    googleBtn: "Continuer avec Google",
    googleLoading: "Redirection...",
    magicBtn: "Envoyer le lien magique",
    magicLoading: "Envoi...",
    magicSent: "Vérifiez votre boîte mail",
    magicSentBody: (e) => `Nous avons envoyé un lien de connexion à ${e}. Cliquez sur le lien pour continuer.`,
    useOther: "Utiliser une autre adresse",
    or: "ou",
    gateHint: "Cochez la case d'acceptation des CGU et de la Politique de confidentialité pour continuer.",
  },
  en: {
    title: "Sign in",
    subtitle: "Continue with Google or use your email.",
    subtitleMagicOnly: "Get a sign-in link by email. No password needed.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    googleBtn: "Continue with Google",
    googleLoading: "Redirecting...",
    magicBtn: "Send magic link",
    magicLoading: "Sending...",
    magicSent: "Check your inbox",
    magicSentBody: (e) => `We sent a sign-in link to ${e}. Click the link to continue.`,
    useOther: "Use a different address",
    or: "or",
    gateHint: "Tick the Terms and Privacy Policy box to continue.",
  },
};

function resolveUiCopy(locale: Locale): LoginCopy {
  return locale === "en" ? UI_COPY.en : UI_COPY.fr;
}

// Legal consent copy is locked to FR/EN — ZH/AR/UR users see EN.
function consentLocale(locale: Locale): ConsentLocale {
  return locale === "en" ? "en" : "fr";
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const rawLocale = searchParams.get("locale") ?? "";
  const locale: Locale = locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : "fr";

  const cl = consentLocale(locale);
  const ui = resolveUiCopy(locale);
  const dpaCopy = DPA_COPY[cl];
  const marketingCopy = MARKETING_COPY[cl];

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [dpaAccepted, setDpaAccepted] = useState(false);
  const [marketingOptin, setMarketingOptin] = useState(false);

  const canProceed = dpaAccepted;

  function stampConsentCookie() {
    const payload = encodeSignupConsent({
      dpa: dpaAccepted,
      marketing: marketingOptin,
      locale: cl,
      dpaTextVersion: DPA_TEXT_VERSION,
      marketingTextVersion: MARKETING_TEXT_VERSION,
      tickedAt: Date.now(),
    });
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${SIGNUP_CONSENT_COOKIE}=${payload}; Path=/; Max-Age=${SIGNUP_CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  }

  async function handleGoogleSignIn() {
    if (!canProceed) return;
    setError("");
    setGoogleLoading(true);
    stampConsentCookie();

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setGoogleLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!canProceed) return;
    setError("");
    setLoading(true);
    stampConsentCookie();

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="hig-fade-in flex min-h-[calc(100vh-56px)] items-center justify-center px-4">
        <div className="w-full max-w-sm border border-tenu-hairline bg-tenu-canvas p-8">
          <h1 className="mb-2 text-2xl font-light tracking-[-0.025em] text-tenu-ink">{ui.magicSent}</h1>
          <p className="text-sm text-tenu-ink-muted">
            {ui.magicSentBody(email)}
          </p>
          <button
            onClick={() => setSent(false)}
            className="hig-press mt-4 inline-flex min-h-11 items-center rounded-none text-sm font-medium text-tenu-ink underline decoration-1 underline-offset-4"
          >
            {ui.useOther}
          </button>
        </div>
      </div>
    );
  }

  const termsHref = cl === "fr" ? "/legal/terms/fr" : "/legal/terms/en";
  const privacyHref = cl === "fr" ? "/legal/privacy/fr" : "/legal/privacy/en";

  return (
    <div className="hig-fade-in flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm border border-tenu-hairline bg-tenu-canvas p-8">
        <h1 className="mb-1 text-2xl font-light tracking-[-0.025em] text-tenu-ink">{ui.title}</h1>
        <p className="mb-6 text-sm text-tenu-ink-muted">
          {GOOGLE_AUTH_ENABLED ? ui.subtitle : ui.subtitleMagicOnly}
        </p>

        {/* DPA acceptance — required. Blocks both buttons until ticked. */}
        <div className="mb-4 border border-tenu-hairline bg-tenu-canvas p-3 text-sm text-tenu-ink">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-tenu-ink"
              checked={dpaAccepted}
              onChange={(e) => setDpaAccepted(e.target.checked)}
              required
              data-dpa-version={DPA_TEXT_VERSION}
            />
            <span className="leading-snug">
              {dpaCopy.label
                .split(/(Conditions d'utilisation|Politique de confidentialité|Terms of Use|Privacy Policy)/)
                .map((part, i) => {
                  if (
                    part === "Conditions d'utilisation" ||
                    part === "Terms of Use"
                  ) {
                    return (
                      <Link
                        key={i}
                        href={termsHref}
                        target="_blank"
                        rel="noopener"
                        className="text-tenu-ink underline decoration-1 underline-offset-2 hover:text-tenu-accent"
                      >
                        {part}
                      </Link>
                    );
                  }
                  if (
                    part === "Politique de confidentialité" ||
                    part === "Privacy Policy"
                  ) {
                    return (
                      <Link
                        key={i}
                        href={privacyHref}
                        target="_blank"
                        rel="noopener"
                        className="text-tenu-ink underline decoration-1 underline-offset-2 hover:text-tenu-accent"
                      >
                        {part}
                      </Link>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
              <span className="mt-0.5 block text-xs text-tenu-ink-muted">
                {dpaCopy.required}
              </span>
            </span>
          </label>

          <label className="mt-3 flex cursor-pointer items-start gap-3 border-t border-tenu-hairline pt-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-tenu-ink"
              checked={marketingOptin}
              onChange={(e) => setMarketingOptin(e.target.checked)}
              data-marketing-version={MARKETING_TEXT_VERSION}
            />
            <span className="leading-snug">
              {marketingCopy.label}
              <span className="mt-0.5 block text-xs text-tenu-ink-muted">
                {marketingCopy.hint}
              </span>
            </span>
          </label>
        </div>

        {/* Google OAuth — gated until the #T028–#T037 Workspace OAuth
            client is live on the new Supabase project. */}
        {GOOGLE_AUTH_ENABLED && (
        <>
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading || !canProceed}
          aria-busy={googleLoading}
          className="hig-press mb-4 flex h-11 w-full items-center justify-center gap-3 rounded-none border border-tenu-hairline bg-tenu-canvas px-4 text-sm font-medium text-tenu-ink hover:border-tenu-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {googleLoading ? ui.googleLoading : ui.googleBtn}
        </button>

        {/* Divider */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-tenu-hairline" />
          <span className="text-xs text-tenu-ink-muted">{ui.or}</span>
          <div className="h-px flex-1 bg-tenu-hairline" />
        </div>
        </>
        )}

        {/* Magic link — primary while Google is gated, fallback after */}
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-tenu-ink">
              {ui.emailLabel}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={ui.emailPlaceholder}
              className="min-h-11 w-full rounded-[2px] border border-tenu-ink-muted bg-tenu-canvas px-3 py-2 text-sm text-tenu-ink placeholder:text-tenu-ash outline-none focus-visible:outline-none transition-colors duration-150 focus:border-tenu-ink"
            />
          </div>

          {error && (
            <p className="text-sm text-tenu-danger">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !canProceed}
            aria-busy={loading}
            className="hig-press flex h-11 w-full items-center justify-center rounded-none bg-tenu-cta px-4 text-sm font-medium text-tenu-cta-text hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? ui.magicLoading : ui.magicBtn}
          </button>

          {!canProceed && (
            <p className="text-xs text-tenu-ink-muted">
              {ui.gateHint}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
