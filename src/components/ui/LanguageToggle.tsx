"use client";

import { useState, useRef, useEffect } from "react";
import type { Locale } from "@/lib/i18n/config";
import { localeNames, locales } from "@/lib/i18n/config";

/**
 * Language toggle for the header.
 * Shows FR/EN flags as primary toggle + globe icon for other languages.
 * Sets a cookie so server components pick up the locale on next request.
 */

/** Flag emoji by locale — simple, no image assets needed */
const FLAGS: Record<Locale, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
  ar: "🇸🇦",
  zh: "🇨🇳",
  ur: "🇵🇰",
  hi: "🇮🇳",
  ja: "🇯🇵",
  es: "🇪🇸",
  pt: "🇧🇷",
  ko: "🇰🇷",
};

/** Primary languages shown as direct toggle buttons */
const PRIMARY: Locale[] = ["fr", "en"];

/** Other languages shown in dropdown */
const OTHER: Locale[] = locales.filter((l) => !PRIMARY.includes(l));

function setLocaleCookie(locale: Locale) {
  document.cookie = `locale=${locale};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
}

export default function LanguageToggle({ currentLocale }: { currentLocale: Locale }) {
  const [locale, setLocale] = useState<Locale>(currentLocale);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function switchTo(newLocale: Locale) {
    setLocale(newLocale);
    setLocaleCookie(newLocale);
    setDropdownOpen(false);
    window.location.reload();
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const inactiveLocale = locale === "fr" ? "en" : "fr";

  return (
    <div className="flex items-center gap-1" ref={dropdownRef}>
      {/* Inactive primary language — click to switch */}
      <button
        onClick={() => switchTo(inactiveLocale)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-tenu-cream/60"
        title={`Switch to ${localeNames[inactiveLocale]}`}
      >
        <span className="text-base leading-none">{FLAGS[inactiveLocale]}</span>
        <span className="text-xs font-medium text-tenu-slate/70 uppercase">
          {inactiveLocale}
        </span>
      </button>

      {/* Globe icon for other languages */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center rounded-md px-1.5 py-1 text-sm hover:bg-tenu-cream/60"
          title="More languages"
        >
          <svg className="h-4 w-4 text-tenu-slate/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-tenu-cream-dark bg-white py-1 shadow-lg">
            {OTHER.map((l) => (
              <button
                key={l}
                onClick={() => switchTo(l)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-tenu-cream/40 ${
                  locale === l ? "font-medium text-tenu-forest" : "text-tenu-slate"
                }`}
              >
                <span className="text-base leading-none">{FLAGS[l]}</span>
                <span>{localeNames[l]}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
