"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  DPA_COPY,
  DPA_TEXT_VERSION,
  MARKETING_COPY,
  MARKETING_TEXT_VERSION,
  type Locale as ConsentLocale,
} from "@/lib/legal/consents";
import { type Locale, locales } from "@/lib/i18n/config";

/**
 * Defensive DPA gate. Reached only when the signup consent cookie
 * was lost (cross-device magic link, ad-blocker purging cookies,
 * server-side callback re-entry). The session is already valid —
 * we just cannot let the user keep using Tenu without a recorded
 * acceptance of the Terms and Privacy Policy.
 *
 * Legal consent copy is locked to FR/EN per consents.ts.
 * ZH/AR/UR users see EN legal copy; all other UI chrome is translated.
 */

interface AcceptCopy {
  heading: string;
  body: string;
  continueBtn: string;
  continuingBtn: string;
}

const UI_COPY: Record<Locale, AcceptCopy> = {
  fr: {
    heading: "Dernière étape",
    body: "Pour finaliser la création de votre compte, confirmez votre acceptation de nos conditions.",
    continueBtn: "Continuer",
    continuingBtn: "Enregistrement...",
  },
  en: {
    heading: "One last step",
    body: "To complete your account, please confirm your acceptance of our terms.",
    continueBtn: "Continue",
    continuingBtn: "Saving...",
  },
  ar: {
    heading: "خطوة أخيرة",
    body: "لإتمام إنشاء حسابك، يرجى تأكيد قبولك لشروطنا.",
    continueBtn: "متابعة",
    continuingBtn: "جارٍ الحفظ...",
  },
  zh: {
    heading: "最后一步",
    body: "为完成账户创建，请确认您接受我们的条款。",
    continueBtn: "继续",
    continuingBtn: "保存中...",
  },
  ur: {
    heading: "آخری قدم",
    body: "اپنا اکاؤنٹ مکمل کرنے کے لیے، براہ کرم ہماری شرائط کی منظوری کی تصدیق کریں۔",
    continueBtn: "جاری رکھیں",
    continuingBtn: "محفوظ ہو رہا ہے...",
  },
  hi: null as unknown as AcceptCopy,
  ja: null as unknown as AcceptCopy,
  es: null as unknown as AcceptCopy,
  pt: null as unknown as AcceptCopy,
  ko: null as unknown as AcceptCopy,
};

function resolveUiCopy(locale: Locale): AcceptCopy {
  return UI_COPY[locale] ?? UI_COPY["en"];
}

function consentLocale(locale: Locale): ConsentLocale {
  return locale === "fr" ? "fr" : "en";
}

export default function AcceptTermsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/inspection/new";

  const rawLocale = searchParams.get("locale") ?? "";
  const locale: Locale = locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : "fr";

  const cl = consentLocale(locale);
  const ui = resolveUiCopy(locale);
  const dpaCopy = DPA_COPY[cl];
  const marketingCopy = MARKETING_COPY[cl];

  const termsHref = cl === "fr" ? "/legal/terms/fr" : "/legal/terms/en";
  const privacyHref = cl === "fr" ? "/legal/privacy/fr" : "/legal/privacy/en";

  const [dpa, setDpa] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!dpa) return;
    setLoading(true);
    setError("");

    try {
      const dpaRes = await fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "dpa_acceptance",
          locale: cl,
          granted: true,
        }),
      });
      if (!dpaRes.ok) {
        const data = await dpaRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to record acceptance");
      }

      await fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "marketing_optin",
          locale: cl,
          granted: marketing,
        }),
      });

      router.replace(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-tenu-cream px-4 py-10">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-xl font-bold text-tenu-forest">
          {ui.heading}
        </h1>
        <p className="mb-6 text-sm text-tenu-slate/70">
          {ui.body}
        </p>

        <div className="mb-4 rounded-lg border border-tenu-cream-dark bg-tenu-cream/40 p-3 text-sm text-tenu-slate">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-tenu-forest"
              checked={dpa}
              onChange={(e) => setDpa(e.target.checked)}
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
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
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

        {error && <p className="mb-3 text-sm text-tenu-danger">{error}</p>}

        <button
          onClick={submit}
          disabled={!dpa || loading}
          className="w-full rounded-lg bg-tenu-forest px-4 py-2.5 text-sm font-medium text-white hover:bg-tenu-forest-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? ui.continuingBtn : ui.continueBtn}
        </button>
      </div>
    </div>
  );
}
