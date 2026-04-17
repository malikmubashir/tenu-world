"use client";

/**
 * CookiePreferencesResetter — clears the stored cookie decision so
 * the banner reappears on the next render. Used from /legal/cookies/*
 * pages to give the user a path back to the banner without needing a
 * separate preference centre UI.
 *
 * Lives alongside the FR page and is imported by the EN page too.
 */

import { useState } from "react";
import { COOKIE_PREFS_KEY, type Locale } from "@/lib/legal/consents";

interface Props {
  locale: Locale;
}

export default function CookiePreferencesResetter({ locale }: Props) {
  const [cleared, setCleared] = useState(false);

  const label =
    locale === "fr"
      ? cleared
        ? "Préférences réinitialisées — rechargez la page pour revoir le bandeau."
        : "Réinitialiser mes préférences cookies"
      : cleared
        ? "Preferences cleared — reload the page to see the banner."
        : "Reset my cookie preferences";

  function reset() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(COOKIE_PREFS_KEY);
    setCleared(true);
  }

  return (
    <button
      type="button"
      onClick={reset}
      disabled={cleared}
      className="mt-2 rounded-lg border border-tenu-forest px-4 py-2 text-sm font-medium text-tenu-forest hover:bg-tenu-cream disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}
