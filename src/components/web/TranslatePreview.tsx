"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { localeNames } from "@/lib/i18n/config";

/**
 * Machine-translation preview banner.
 *
 * Tenu ships hand-written FR/EN only. When a user picks any other
 * language via LanguageToggle, the site falls back to French and this
 * banner offers an on-demand, Google-Translate-powered preview.
 *
 * Per BRAND-GUIDELINES §14.5, machine output is never shipped as
 * canonical copy — the banner labels it as an "unofficial preview".
 * Legal pages (/legal/*) are hard-pinned to FR/EN and are excluded
 * from this widget via the pathname check.
 */

const TRANSLATE_COOKIE = "translate_preview";

// Google Translate language codes. Maps our app locales → GT codes.
const GT_CODE: Record<Locale, string> = {
  en: "en",
  fr: "fr",
  ar: "ar",
  zh: "zh-CN",
  ur: "ur",
  hi: "hi",
  ja: "ja",
  es: "es",
  pt: "pt",
  ko: "ko",
};

function readLocaleCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  return m ? (decodeURIComponent(m[1]) as Locale) : null;
}

function setTranslatePref(target: string | null) {
  const max = 60 * 60 * 24 * 30;
  if (target) {
    document.cookie = `${TRANSLATE_COOKIE}=${target};path=/;max-age=${max};SameSite=Lax`;
  } else {
    document.cookie = `${TRANSLATE_COOKIE}=;path=/;max-age=0;SameSite=Lax`;
  }
}

function readTranslatePref(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)translate_preview=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function injectGoogleTranslate(targetCode: string) {
  if (document.getElementById("google-translate-script")) return;

  // Mount point for the Element widget. Hidden — we only want the
  // translation engine, not Google's UI.
  if (!document.getElementById("google_translate_element")) {
    const el = document.createElement("div");
    el.id = "google_translate_element";
    el.style.display = "none";
    document.body.appendChild(el);
  }

  (window as unknown as { googleTranslateElementInit: () => void }).googleTranslateElementInit = () => {
    const W = window as unknown as {
      google?: {
        translate?: {
          TranslateElement?: new (
            opts: Record<string, unknown>,
            id: string,
          ) => unknown;
        };
      };
    };
    if (!W.google?.translate?.TranslateElement) return;
    new W.google.translate.TranslateElement(
      {
        pageLanguage: "fr",
        includedLanguages: Object.values(GT_CODE).join(","),
        autoDisplay: false,
      },
      "google_translate_element",
    );

    // Nudge the hidden <select> to the target language so the page
    // auto-translates without Google's floating banner.
    setTimeout(() => {
      const select = document.querySelector<HTMLSelectElement>(
        "select.goog-te-combo",
      );
      if (select) {
        select.value = targetCode;
        select.dispatchEvent(new Event("change"));
      }
    }, 400);
  };

  const script = document.createElement("script");
  script.id = "google-translate-script";
  script.src =
    "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}

export default function TranslatePreview() {
  const [locale, setLocale] = useState<Locale | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [pathname, setPathname] = useState<string>("");

  useEffect(() => {
    setLocale(readLocaleCookie());
    setActive(readTranslatePref());
    setPathname(window.location.pathname);
  }, []);

  // Hide on legal pages — those are locked to hand-reviewed FR/EN.
  if (pathname.startsWith("/legal")) return null;

  // Hide when user picked a supported hand-written locale.
  if (!locale || locale === "fr" || locale === "en") {
    // If a stale preview cookie exists, clear it.
    if (active) setTranslatePref(null);
    return null;
  }

  const target = GT_CODE[locale];
  const langLabel = localeNames[locale];

  // Already translating — render a thin dismiss bar.
  if (active === target) {
    return (
      <div className="border-b border-tenu-cream-dark bg-tenu-cream/70 px-4 py-1.5 text-center text-xs text-tenu-slate/80">
        <span translate="no">
          Preview machine translation ({langLabel}) — unofficial.{" "}
        </span>
        <button
          onClick={() => {
            setTranslatePref(null);
            window.location.reload();
          }}
          className="underline hover:no-underline"
          translate="no"
        >
          Show original (Français)
        </button>
      </div>
    );
  }

  return (
    <div
      className="border-b border-tenu-cream-dark bg-tenu-cream/70 px-4 py-2 text-center text-xs text-tenu-slate/80"
      translate="no"
    >
      <span className="mr-2">
        Showing original Français. Preview in {langLabel}?
      </span>
      <button
        onClick={() => {
          setTranslatePref(target);
          injectGoogleTranslate(target);
        }}
        className="inline-flex items-center rounded-md bg-tenu-forest px-2.5 py-1 text-xs font-medium text-white hover:bg-tenu-forest-light"
      >
        Translate (preview)
      </button>
      <span className="ml-2 text-tenu-slate/60">
        Machine output — legal pages excluded.
      </span>
    </div>
  );
}
