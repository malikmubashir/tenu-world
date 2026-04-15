import "server-only";
import type { Locale } from "./config";
import { defaultLocale, locales } from "./config";

type Dictionary = Record<string, unknown>;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  fr: () => import("./dictionaries/fr.json").then((m) => m.default),
  ar: () => import("./dictionaries/ar.json").then((m) => m.default),
  zh: () => import("./dictionaries/zh.json").then((m) => m.default),
  ur: () => import("./dictionaries/ur.json").then((m) => m.default),
  // P2 and P3 languages fall back to English until translated
  hi: () => import("./dictionaries/en.json").then((m) => m.default),
  ja: () => import("./dictionaries/en.json").then((m) => m.default),
  es: () => import("./dictionaries/en.json").then((m) => m.default),
  pt: () => import("./dictionaries/en.json").then((m) => m.default),
  ko: () => import("./dictionaries/en.json").then((m) => m.default),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const loader = dictionaries[locale] ?? dictionaries[defaultLocale];
  return loader();
}

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function parseLocaleFromCookie(cookieValue?: string): Locale {
  if (cookieValue && isValidLocale(cookieValue)) {
    return cookieValue;
  }
  return defaultLocale;
}

export function parseLocaleFromHeader(acceptLanguage?: string): Locale {
  if (!acceptLanguage) return defaultLocale;

  const preferred = acceptLanguage
    .split(",")
    .map((part) => {
      const [lang, q] = part.trim().split(";q=");
      return { lang: lang.split("-")[0].toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of preferred) {
    if (isValidLocale(lang)) return lang;
  }

  return defaultLocale;
}
