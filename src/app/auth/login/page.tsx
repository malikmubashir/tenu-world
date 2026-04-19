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
 * Legal consent copy (DPA / marketing) is locked to FR/EN per
 * consents.ts — "DO NOT translate through LLM. Requires avocat review."
 * ZH/AR/UR users see the EN legal copy. All other UI chrome is
 * translated into the user's chosen locale.
 */

interface LoginCopy {
  title: string;
  subtitle: string;
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

const UI_COPY: Record<Locale, LoginCopy> = {
  fr: {
    title: "Connexion",
    subtitle: "Continuez avec Google ou utilisez votre e-mail.",
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
  ar: {
    title: "تسجيل الدخول",
    subtitle: "تابع مع Google أو استخدم بريدك الإلكتروني.",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "you@example.com",
    googleBtn: "المتابعة مع Google",
    googleLoading: "جارٍ التحويل...",
    magicBtn: "إرسال رابط الدخول",
    magicLoading: "جارٍ الإرسال...",
    magicSent: "تحقق من بريدك الوارد",
    magicSentBody: (e) => `أرسلنا رابط تسجيل الدخول إلى ${e}. انقر على الرابط للمتابعة.`,
    useOther: "استخدام عنوان آخر",
    or: "أو",
    gateHint: "ضع علامة في خانة قبول الشروط وسياسة الخصوصية للمتابعة.",
  },
  zh: {
    title: "登录",
    subtitle: "使用 Google 继续，或输入您的电子邮件。",
    emailLabel: "电子邮件地址",
    emailPlaceholder: "you@example.com",
    googleBtn: "使用 Google 继续",
    googleLoading: "跳转中...",
    magicBtn: "发送魔法链接",
    magicLoading: "发送中...",
    magicSent: "请查看您的收件箱",
    magicSentBody: (e) => `我们已向 ${e} 发送了登录链接，点击链接继续。`,
    useOther: "使用其他地址",
    or: "或",
    gateHint: "请勾选服务条款和隐私政策复选框以继续。",
  },
  ur: {
    title: "سائن ان",
    subtitle: "Google کے ساتھ جاری رکھیں یا اپنا ای میل استعمال کریں۔",
    emailLabel: "ای میل پتہ",
    emailPlaceholder: "you@example.com",
    googleBtn: "Google کے ساتھ جاری رکھیں",
    googleLoading: "منتقل ہو رہا ہے...",
    magicBtn: "میجک لنک بھیجیں",
    magicLoading: "بھیج رہا ہے...",
    magicSent: "اپنا ان باکس چیک کریں",
    magicSentBody: (e) => `ہم نے ${e} پر سائن ان لنک بھیجا ہے۔ جاری رکھنے کے لیے لنک پر کلک کریں۔`,
    useOther: "مختلف پتہ استعمال کریں",
    or: "یا",
    gateHint: "جاری رکھنے کے لیے شرائط اور رازداری پالیسی کا خانہ نشان زد کریں۔",
  },
  hi: null as unknown as LoginCopy,
  ja: null as unknown as LoginCopy,
  es: null as unknown as LoginCopy,
  pt: null as unknown as LoginCopy,
  ko: null as unknown as LoginCopy,
};

function resolveUiCopy(locale: Locale): LoginCopy {
  return UI_COPY[locale] ?? UI_COPY["en"];
}

// Legal consent copy is locked to FR/EN — ZH/AR/UR users see EN.
function consentLocale(locale: Locale): ConsentLocale {
  return locale === "fr" ? "fr" : "en";
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
        <div className="hig-card w-full max-w-sm p-8">
          <h1 className="mb-2 text-xl font-semibold text-tenu-forest">{ui.magicSent}</h1>
          <p className="text-sm text-tenu-slate/70">
            {ui.magicSentBody(email)}
          </p>
          <button
            onClick={() => setSent(false)}
            className="hig-press mt-6 rounded-lg text-sm text-tenu-forest underline"
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
      <div className="hig-card w-full max-w-sm p-8">
        <h1 className="mb-1 text-xl font-semibold text-tenu-forest">{ui.title}</h1>
        <p className="mb-6 text-sm text-tenu-slate/70">{ui.subtitle}</p>

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
                        className="text-tenu-forest underline hover:no-underline"
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
          className="hig-press mb-4 flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-tenu-cream-dark bg-white px-4 text-sm font-semibold text-tenu-slate hover:bg-tenu-cream/60 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="h-px flex-1 bg-tenu-cream-dark" />
          <span className="text-xs text-tenu-slate/50">{ui.or}</span>
          <div className="h-px flex-1 bg-tenu-cream-dark" />
        </div>

        {/* Magic link — fallback */}
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-tenu-slate">
              {ui.emailLabel}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={ui.emailPlaceholder}
              className="w-full rounded-lg border border-tenu-cream-dark px-3 py-2 text-sm outline-none focus:border-tenu-forest focus:ring-1 focus:ring-tenu-forest"
            />
          </div>

          {error && (
            <p className="text-sm text-tenu-danger">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !canProceed}
            className="hig-press flex h-11 w-full items-center justify-center rounded-xl bg-tenu-forest px-4 text-sm font-semibold text-white hover:bg-tenu-forest-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? ui.magicLoading : ui.magicBtn}
          </button>

          {!canProceed && (
            <p className="text-xs text-tenu-slate/60">
              {ui.gateHint}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
