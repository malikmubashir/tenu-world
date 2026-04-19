"use client";

/**
 * Mobile magic-link login screen.
 *
 * Apple HIG / Material 3 patterns:
 *   - Full-bleed paper background, ink chrome.
 *   - Portal mark + wordmark stacked at top, like /intro screen 1.
 *   - One single email field, large hit target (52pt height per HIG).
 *   - One emerald primary CTA, large (52pt height).
 *   - DPA + marketing checkboxes between input and CTA, never above it
 *     (avoids a "small grey thing blocks the obvious next step" UX).
 *   - Confirmation state ("Vérifiez votre e-mail") replaces the form
 *     entirely — no modal, no toast.
 *   - Light haptic on send, success haptic on confirmation.
 *
 * Auth flow:
 *   - Supabase signInWithOtp({ email, emailRedirectTo: tenu.world/auth/callback }).
 *   - Magic-link email contains an https://tenu.world link. With Universal
 *     Links configured (post Apple Developer enrolment + assetlinks.json
 *     SHA-256), tapping it opens the app and routes to /auth/callback.
 *     Until then, it opens Safari/Chrome which completes the round-trip
 *     and the user manually returns to the app.
 *
 * Consent:
 *   - DPA acceptance is required (matches web /auth/login).
 *   - Marketing opt-in is optional, defaults to off.
 *   - Both stamped to the SIGNUP_CONSENT_COOKIE so /auth/callback can
 *     persist consents rows once user_id is known.
 *
 * Brand:
 *   - Identity v1: paper #F4F1EA, ink #0B1F3A, paper-2 #EDE8DC layered
 *     surface for the consent panel, brand-rule hairline divider,
 *     brand-muted hint text. Emerald #059669 for the CTA only —
 *     brand-red is reserved for rights accents and never used as CTA.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import TenuMark from "@/components/brand/TenuMark";
import { createClient } from "@/lib/supabase/client";
import { isNative } from "@/lib/mobile/platform";
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

// Inline brand tokens — same pattern as /intro page. Self-contained so
// the screen renders correctly even if Tailwind v4 hasn't picked up
// the new --color-brand-* vars yet.
const PAPER = "#F4F1EA";
const PAPER_2 = "#EDE8DC";
const INK = "#0B1F3A";
const INK_55 = "rgba(11, 31, 58, 0.55)";
const INK_12 = "rgba(11, 31, 58, 0.12)";
const EMERALD = "#059669";
const EMERALD_PRESSED = "#047857";
const DANGER = "#DC2626";

async function lightHaptic() {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* swallow */
  }
}

async function successHaptic() {
  if (!isNative()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    /* swallow */
  }
}

export default function MobileLoginPage() {
  const router = useRouter();
  const locale: Locale = "fr"; // FR-only launch
  const dpaCopy = DPA_COPY[locale];
  const marketingCopy = MARKETING_COPY[locale];

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dpaAccepted, setDpaAccepted] = useState(false);
  const [marketingOptin, setMarketingOptin] = useState(false);

  // If a session already exists (returning user), bypass login entirely.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          router.replace("/app-home/");
        }
      } catch {
        /* missing env vars in dev — leave the form visible */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const canProceed = dpaAccepted && email.length > 3 && !loading;

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canProceed) return;
    setError("");
    setLoading(true);
    void lightHaptic();
    stampConsentCookie();

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          // Always go via tenu.world — Universal Links open the app on
          // device, Safari completes on web. Same callback either way.
          emailRedirectTo: "https://tenu.world/auth/callback",
        },
      });
      setLoading(false);
      if (authError) {
        setError(translateAuthError(authError.message));
        return;
      }
      void successHaptic();
      setSent(true);
    } catch {
      setLoading(false);
      setError(
        "Service indisponible. Vérifiez votre connexion et réessayez.",
      );
    }
  }

  // Confirmation state.
  if (sent) {
    return (
      <div
        className="flex flex-1 flex-col"
        style={{ backgroundColor: PAPER, color: INK }}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <TenuMark container="portal" size={72} />

          <div className="space-y-3">
            <h1
              className="text-[28px] font-medium leading-tight"
              style={{
                fontFamily: "var(--font-brand)",
                letterSpacing: "-0.04em",
              }}
            >
              Vérifiez votre e-mail
            </h1>
            <p className="text-[15px] leading-relaxed" style={{ color: INK_55 }}>
              Nous avons envoyé un lien de connexion à
              <br />
              <span className="font-medium" style={{ color: INK }}>
                {email.trim()}
              </span>
            </p>
            <p className="text-[13px] leading-relaxed" style={{ color: INK_55 }}>
              Ouvrez l&apos;e-mail sur cet appareil et touchez le lien. Si vous
              ne le voyez pas, vérifiez vos courriers indésirables.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
            className="rounded-xl px-4 py-2 text-[14px] font-medium underline-offset-4 hover:underline"
            style={{ color: INK }}
          >
            Utiliser une autre adresse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-1 flex-col"
      style={{ backgroundColor: PAPER, color: INK }}
    >
      {/* Top brand stack — Portal mark + wordmark, mirrors /intro screen 1. */}
      <div className="flex flex-col items-center gap-3 px-6 pt-12">
        <TenuMark container="portal" size={56} />
        <div className="flex items-baseline gap-2">
          <span
            className="text-[22px] font-medium lowercase"
            style={{
              fontFamily: "var(--font-brand)",
              letterSpacing: "-0.04em",
              color: INK,
            }}
          >
            tenu
          </span>
        </div>
      </div>

      {/* Heading + subhead. */}
      <div className="px-6 pt-10 text-center">
        <h1
          className="text-[28px] font-medium leading-tight"
          style={{
            fontFamily: "var(--font-brand)",
            letterSpacing: "-0.04em",
            color: INK,
          }}
        >
          Connexion
        </h1>
        <p
          className="mt-2 text-[15px] leading-relaxed"
          style={{ color: INK_55 }}
        >
          Recevez un lien de connexion à usage unique par e-mail. Aucun mot de
          passe à mémoriser.
        </p>
      </div>

      {/* Form — single column, 52pt input + 52pt CTA. */}
      <form
        onSubmit={handleSubmit}
        className="mt-8 flex flex-1 flex-col gap-5 px-6 pb-8"
        noValidate
      >
        <label className="block">
          <span
            className="mb-2 block text-[13px] font-medium"
            style={{ color: INK }}
          >
            Adresse e-mail
          </span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="block h-[52px] w-full rounded-2xl px-4 text-[16px] outline-none transition-colors"
            style={{
              backgroundColor: PAPER_2,
              color: INK,
              border: `1px solid ${INK_12}`,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = INK;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = INK_12;
            }}
          />
        </label>

        {/* Consent panel — required DPA + optional marketing.
            Sits between input and CTA per HIG: required attestations live
            with the form they gate, not above the heading. */}
        <div
          className="rounded-2xl p-4 text-[13px]"
          style={{
            backgroundColor: PAPER_2,
            border: `1px solid ${INK_12}`,
            color: INK,
          }}
        >
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-[3px] h-[18px] w-[18px] flex-shrink-0"
              style={{ accentColor: EMERALD }}
              checked={dpaAccepted}
              onChange={(e) => setDpaAccepted(e.target.checked)}
              required
              data-dpa-version={DPA_TEXT_VERSION}
            />
            <span className="leading-snug">
              {dpaCopy.label
                .split(
                  /(Conditions d'utilisation|Politique de confidentialité|Terms of Use|Privacy Policy)/,
                )
                .map((part, i) => {
                  if (
                    part === "Conditions d'utilisation" ||
                    part === "Terms of Use"
                  ) {
                    return (
                      <Link
                        key={i}
                        href={
                          locale === "fr" ? "/legal/terms/fr" : "/legal/terms/en"
                        }
                        target="_blank"
                        rel="noopener"
                        className="underline underline-offset-2"
                        style={{ color: INK }}
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
                        href={
                          locale === "fr"
                            ? "/legal/privacy/fr"
                            : "/legal/privacy/en"
                        }
                        target="_blank"
                        rel="noopener"
                        className="underline underline-offset-2"
                        style={{ color: INK }}
                      >
                        {part}
                      </Link>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
              <span
                className="mt-1 block text-[12px]"
                style={{ color: INK_55 }}
              >
                {dpaCopy.required}
              </span>
            </span>
          </label>

          <div
            className="my-3 h-px w-full"
            style={{ backgroundColor: INK_12 }}
          />

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-[3px] h-[18px] w-[18px] flex-shrink-0"
              style={{ accentColor: EMERALD }}
              checked={marketingOptin}
              onChange={(e) => setMarketingOptin(e.target.checked)}
              data-marketing-version={MARKETING_TEXT_VERSION}
            />
            <span className="leading-snug">
              {marketingCopy.label}
              <span
                className="mt-1 block text-[12px]"
                style={{ color: INK_55 }}
              >
                {marketingCopy.hint}
              </span>
            </span>
          </label>
        </div>

        {error && (
          <p
            className="rounded-xl px-3 py-2 text-[13px]"
            style={{
              color: DANGER,
              backgroundColor: "rgba(220, 38, 38, 0.06)",
              border: `1px solid rgba(220, 38, 38, 0.20)`,
            }}
          >
            {error}
          </p>
        )}

        {/* Spacer to push CTA toward bottom on tall devices. */}
        <div className="flex-1" />

        <button
          type="submit"
          disabled={!canProceed}
          className="flex h-[52px] w-full items-center justify-center rounded-2xl text-[16px] font-semibold transition-all"
          style={{
            backgroundColor: canProceed ? EMERALD : "rgba(5, 150, 105, 0.40)",
            color: "#FFFFFF",
            cursor: canProceed ? "pointer" : "not-allowed",
          }}
          onPointerDown={(e) => {
            if (canProceed) {
              e.currentTarget.style.backgroundColor = EMERALD_PRESSED;
            }
          }}
          onPointerUp={(e) => {
            if (canProceed) {
              e.currentTarget.style.backgroundColor = EMERALD;
            }
          }}
          onPointerLeave={(e) => {
            if (canProceed) {
              e.currentTarget.style.backgroundColor = EMERALD;
            }
          }}
        >
          {loading ? "Envoi…" : "Envoyer le lien magique"}
        </button>

        {!dpaAccepted && (
          <p
            className="text-center text-[12px] leading-snug"
            style={{ color: INK_55 }}
          >
            Cochez l&apos;acceptation des CGU et de la Politique de
            confidentialité pour continuer.
          </p>
        )}
      </form>
    </div>
  );
}

/**
 * Translate Supabase auth error messages to French. Supabase returns
 * English strings even when the API is set to FR locale, so we map the
 * common ones inline.
 */
function translateAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
  }
  if (lower.includes("invalid email") || lower.includes("email")) {
    return "Adresse e-mail invalide.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Problème de connexion. Vérifiez votre réseau et réessayez.";
  }
  return msg;
}
