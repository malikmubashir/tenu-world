// Cross-link strip rendered at the foot of every /stories/<slug> page.
// Reads from the manifest in src/lib/stories.ts so new cases surface
// automatically once they are added — no hardcoding per story.
//
// Kept bilingual EN/FR inline. Non-en locales receive FR per launch
// directive. Matches the register of the story pages (navy eyebrow,
// ink-body card, accent link). Renders nothing if no siblings exist.
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { parseLocaleFromCookie, parseLocaleFromHeader } from "@/lib/i18n/server";
import { getSiblingStories } from "@/lib/stories";

type Props = { currentSlug: string };

type Chrome = {
  heading: string;
  intro: string;
  seeAll: string;
};

const EN: Chrome = {
  heading: "Other cases",
  intro:
    "Each case is a different tenant, a different dwelling, the same pattern: a deposit at risk, an absence of evidence, a product designed to close the gap.",
  seeAll: "See all cases",
};

const FR: Chrome = {
  heading: "Autres cas",
  intro:
    "Chaque cas est un locataire différent, un logement différent, le même schéma : une caution en jeu, une absence de preuves, un produit conçu pour combler l'écart.",
  seeAll: "Tous les cas",
};

export default async function OtherCases({ currentSlug }: Props) {
  const siblings = getSiblingStories(currentSlug, 2);
  if (siblings.length === 0) return null;

  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLocale = cookieStore.get("locale")?.value;
  const locale = cookieLocale
    ? parseLocaleFromCookie(cookieLocale)
    : parseLocaleFromHeader(headerStore.get("accept-language") ?? undefined);
  const isEn = locale === "en";
  const c = isEn ? EN : FR;
  const lang: "en" | "fr" = isEn ? "en" : "fr";

  return (
    <section className="t-section-band px-6 md:px-12">
      <div className="t-content max-w-5xl">
        <div className="mb-10 max-w-2xl">
          <h2 className="t-section-heading mb-4">{c.heading}</h2>
          <p className="t-body-muted">{c.intro}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {siblings.map((s) => (
            <Link
              key={s.slug}
              href={s.href}
              className="t-card hig-press block transition hover:-translate-y-0.5 hover:border-tenu-accent/40"
            >
              <div className="t-label mb-3 text-tenu-accent">
                {s.eyebrow[lang]}
              </div>
              <h3 className="t-h3 mb-2">{s.title[lang]}</h3>
              <p className="t-small-muted">{s.hook[lang]}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <Link href="/stories" className="t-cta-ghost hig-press">
            {c.seeAll} →
          </Link>
        </div>
      </div>
    </section>
  );
}
