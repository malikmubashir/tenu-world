// Story manifest — single source of truth for /stories and the homepage
// "Cases" section. Every new case (cautionary or success) is appended here;
// the index page, the homepage cards and the cross-link strip between
// story pages all read from this file.
//
// Content rules:
//   • Cautionary tales are pre-launch. Purpose: show why the product exists.
//   • Success stories are post-launch, from real disputes that closed.
//     First batch expected once the May 2026 soft-launch cohort has closed
//     its fourteen-day follow-up window.
//   • Bilingual (EN + FR). Non-en/fr locales receive FR per launch directive.
//   • Persona strings are short tags, not sentences. One line max on a card.

export type StoryCategory = "cautionary" | "success";
export type StoryJurisdiction = "FR" | "UK";

export type Story = {
  slug: string;
  href: string;
  category: StoryCategory;
  jurisdiction: StoryJurisdiction;
  /** Short tag, e.g. "Student · Japan". Rendered as a label on cards. */
  persona: { en: string; fr: string };
  /** ISO date. Newest first on the index. */
  publishedAt: string;
  /** True = surfaces on the homepage "Cases" dual-card section. */
  featured: boolean;
  /** Card eyebrow. Do not duplicate persona; this is the story framing. */
  eyebrow: { en: string; fr: string };
  /** Card title. Keep under ~50 characters for two-line grids. */
  title: { en: string; fr: string };
  /** 1–2 sentence card hook. The actual opening, condensed. */
  hook: { en: string; fr: string };
};

export const stories: Story[] = [
  {
    slug: "suzi",
    href: "/stories/suzi",
    category: "cautionary",
    jurisdiction: "FR",
    persona: { en: "Student · Japan", fr: "Étudiante · Japon" },
    publishedAt: "2026-04-18",
    featured: true,
    eyebrow: {
      en: "Cautionary case · Japanese student",
      fr: "Cas d'école · Étudiante japonaise",
    },
    title: {
      en: "Suzi, from Tokyo to Paris",
      fr: "Suzi, de Tokyo à Paris",
    },
    hook: {
      en: "A master's student signs a lease in French she barely reads. A year later, €1,850 in exit charges against an €820 deposit. Where the position broke, and where Tenu would have held the line.",
      fr: "Une étudiante en master signe un bail en français qu'elle déchiffre à peine. Un an plus tard, 1 850 € de retenues sur une caution de 820 €. Où le dossier a basculé, et où Tenu aurait tenu la ligne.",
    },
  },
  {
    slug: "samir",
    href: "/stories/samir",
    category: "cautionary",
    jurisdiction: "FR",
    persona: {
      en: "Expatriate family · Algeria",
      fr: "Famille expatriée · Algérie",
    },
    publishedAt: "2026-04-18",
    featured: true,
    eyebrow: {
      en: "Cautionary case · Expatriate family",
      fr: "Cas d'école · Famille expatriée",
    },
    title: {
      en: "Samir, from Algiers to Toulouse",
      fr: "Samir, d'Alger à Toulouse",
    },
    hook: {
      en: "A senior banker rents a family house for three years, flies home, and receives a €4,500 exit bill one week later. No entry photos, no exit photos, no room to push back.",
      fr: "Un cadre bancaire loue une maison familiale trois ans, rentre au pays, et reçoit 4 500 € de retenues une semaine plus tard. Aucune photo d'entrée, aucune photo de sortie, aucune marge pour répondre.",
    },
  },
];

/** Newest first. Index-page order. */
export function getAllStories(): Story[] {
  return [...stories].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
}

/** Homepage "Cases" section. Editorial flag; does not respect date. */
export function getFeaturedStories(limit = 2): Story[] {
  return stories.filter((s) => s.featured).slice(0, limit);
}

/** Cross-link strip at the foot of a story page. */
export function getSiblingStories(currentSlug: string, limit = 2): Story[] {
  return getAllStories()
    .filter((s) => s.slug !== currentSlug)
    .slice(0, limit);
}

export function getStoriesByCategory(category: StoryCategory): Story[] {
  return getAllStories().filter((s) => s.category === category);
}
