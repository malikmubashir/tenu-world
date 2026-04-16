export const locales = [
  "en", "fr", "ar", "zh", "ur", "hi", "ja", "es", "pt", "ko",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export const rtlLocales: Locale[] = ["ar", "ur"];

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
  zh: "中文",
  ur: "اردو",
  hi: "हिन्दी",
  ja: "日本語",
  es: "Español",
  pt: "Português",
  ko: "한국어",
};

export const priorityTiers: Record<string, Locale[]> = {
  p1: ["en", "fr", "ar", "zh", "ur"],
  p2: ["hi", "ja", "es"],
  p3: ["pt", "ko"],
};

export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return isRTL(locale) ? "rtl" : "ltr";
}
