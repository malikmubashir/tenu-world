"use client";

import { useState } from "react";
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
  type Locale,
} from "@/lib/legal/consents";

/**
 * Login page — Google OAuth (primary) + magic link (fallback).
 *
 * Before either auth method fires, the user MUST tick the DPA
 * checkbox. The marketing checkbox is optional and defaults to
 * unchecked (GDPR Art. 7.2 — no pre-ticked boxes, no bundling).
 *
 * The intent is serialised into a short-lived cookie so that after
 * the OAuth / magic-link round-trip, /auth/callback can convert it
 * into consents table rows the moment the user_id becomes known.
 */
export default function LoginPage() {
  const locale: Locale = "fr"; // FR-only launch
  const dpaCopy = DPA_COPY[locale];
  const marketingCopy = MARKETING_COPY[locale];

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [dpaAccepted, setDpaAccepted] = useState(false);
  const [marketingOptin, setMarketingOptin] = useState(false);

  // DPA is the only hard gate. Marketing is optional.
  const canProceed = dpaAccepted;

  /**
   * Persist consent intent to a short-lived cookie so the callback
   * route can record consents rows once the user_id exists.
   */
  function stampConsentCookie() {
    const payload = encodeSignupConsent({
      dpa: dpaAccepted,
      marketing: marketingOptin,
      locale,
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
    // If no error, browser redirects to Google — no need to reset loading
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
      <div className="flex min-h-screen items-center justify-center bg-tenu-cream px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-xl font-bold text-tenu-forest">Vérifiez votre boîte mail</h1>
          <p className="text-sm text-tenu-slate/70">
            Nous avons envoyé un lien de connexion à <strong>{email}</strong>. Cliquez sur le lien pour continuer.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 text-sm text-tenu-forest underline"
          >
            Utiliser une autre adresse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-tenu-cream px-4 py-10">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <Link href="/" className="mb-6 block text-2xl font-bold text-tenu-forest">
          tenu
        </Link>
        <h1 className="mb-1 text-xl font-bold text-tenu-forest">Connexion</h1>
        <p className="mb-6 text-sm text-tenu-slate/70">
          Continuez avec Google ou utilisez votre e-mail.
        </p>

        {/* DPA acceptance — required. Blocks both buttons until ticked. */}
        <div className="mb-4 rounded-lg border border-tenu-cream-dark bg-tenu-cream/40 p-3 text-sm text-tenu-slate">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-tenu-forest"
              checked={dpaAccepted}
              onChange={(e) => setDpaAccepted(e.target.checked)}
              required
              data-dpa-version={DPA_TEXT_VERSION}
            />
            <span className="leading-snug">
              {dpaCopy.label.split(/(Conditions d'utilisation|Politique de confidentialité|Terms of Use|Privacy Policy)/).map((part, i) => {
                if (part === "Conditions d'utilisation" || part === "Terms of Use") {
                  return (
                    <Link
                      key={i}
                      href={locale === "fr" ? "/legal/terms/fr" : "/legal/terms/en"}
                      target="_blank"
                      rel="noopener"
                      className="text-tenu-forest underline hover:no-underline"
                    >
                      {part}
                    </Link>
                  );
                }
                if (part === "Politique de confidentialité" || part === "Privacy Policy") {
                  return (
                    <Link
                      key={i}
                      href={locale === "fr" ? "/legal/privacy/fr" : "/legal/privacy/en"}
                      target="_blank"
                      rel="noopener"
                      className="text-tenu-forest underline hover:no-underline"
                    >
                      {part}
                    </Link>
                  );
                }
                return <span key={i}>{part}</span>;
              })}
              <span className="mt-0.5 block text-xs text-tenu-slate/60">
                {dpaCopy.required}
              </span>
            </span>
          </label>

          <label className="mt-3 flex cursor-pointer items-start gap-3 border-t border-tenu-cream-dark pt-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-tenu-forest"
              checked={marketingOptin}
              onChange={(e) => setMarketingOptin(e.target.checked)}
              data-marketing-version={MARKETING_TEXT_VERSION}
            />
            <span className="leading-snug">
              {marketingCopy.label}
              <span className="mt-0.5 block text-xs text-tenu-slate/60">
                {marketingCopy.hint}
              </span>
            </span>
          </label>
        </div>

        {/* Google OAuth — primary login method */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading || !canProceed}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg border border-tenu-cream-dark bg-white px-4 py-2.5 text-sm font-medium text-tenu-slate hover:bg-tenu-cream/50 disabled:cursor-not-allowed disabled:opacity-50"
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
          {googleLoading ? "Redirection..." : "Continuer avec Google"}
        </button>

        {/* Divider */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-tenu-cream-dark" />
          <span className="text-xs text-tenu-slate/50">ou</span>
          <div className="h-px flex-1 bg-tenu-cream-dark" />
        </div>

        {/* Magic link — fallback */}
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-tenu-slate">
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-tenu-cream-dark px-3 py-2 text-sm outline-none focus:border-tenu-forest focus:ring-1 focus:ring-tenu-forest"
            />
          </div>

          {error && (
            <p className="text-sm text-tenu-danger">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !canProceed}
            className="w-full rounded-lg bg-tenu-forest px-4 py-2.5 text-sm font-medium text-white hover:bg-tenu-forest-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Envoi..." : "Envoyer le lien magique"}
          </button>

          {!canProceed && (
            <p className="text-xs text-tenu-slate/60">
              Cochez la case d&apos;acceptation des CGU et de la Politique de confidentialité pour continuer.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
