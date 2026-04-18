// /stories — index page for all Tenu use cases. Two editorial sections:
//
//   1. Cautionary cases  ("Why Tenu exists")   — pre-launch composite files.
//   2. Success stories   ("How it went")        — post-launch, real disputes
//                                                 that closed. First batch
//                                                 lands once the 11 May 2026
//                                                 soft-launch cohort has
//                                                 cleared its 14-day outcome
//                                                 window.
//
// Both sections read from src/lib/stories.ts. Adding a story = one append
// to the manifest + one new /stories/<slug>/page.tsx. Nothing here changes.
//
// Bilingual EN/FR inline. Non-en/fr locales receive FR per launch directive.
import { cookies, headers } from "next/headers";
import Link from "next/link";
import {
  parseLocaleFromCookie,
  parseLocaleFromHeader,
} from "@/lib/i18n/server";
import { getStoriesByCategory } from "@/lib/stories";

type Chrome = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  lede: string;
  cautionaryHeading: string;
  cautionaryIntro: string;
  successHeading: string;
  successIntro: string;
  successEmpty: string;
  home: string;
  pricing: string;
  closingHeading: string;
  closingBody: string;
  cta: string;
};

const EN: Chrome = {
  metaTitle: "Use cases — Tenu.World",
  metaDescription:
    "Why Tenu exists, told through real scenarios. Cautionary cases from tenants we have seen, and, from May 2026 onward, success stories from disputes that closed.",
  eyebrow: "Use cases",
  title: "Two sets of stories. One product.",
  lede:
    "The cases below are the shape of the problem. Each one is a composite drawn from tenant files we have seen. From May 2026 we publish outcome data from real disputes that closed — anonymised, with the tenant's consent.",
  cautionaryHeading: "Why Tenu exists",
  cautionaryIntro:
    "These are the stories that made us build the product. Each tenant lost part or all of a deposit, or received a bill in excess of it, for reasons a structured evidence chain would have neutralised.",
  successHeading: "How it went",
  successIntro:
    "Outcomes from the first cohort. Deposits returned, bills withdrawn, amounts recovered. Published only with the tenant's written consent, with names and addresses removed.",
  successEmpty:
    "No success cases published yet. First batch expected after the 11 May 2026 cohort closes its 14-day outcome window. Check back in late May.",
  home: "Home",
  pricing: "Pricing",
  closingHeading: "Your story does not have to look like theirs.",
  closingBody:
    "Fifteen euros for a studio or T1. No subscription. Refund if the service cannot be rendered.",
  cta: "Start my inspection",
};

const FR: Chrome = {
  metaTitle: "Cas d'usage — Tenu.World",
  metaDescription:
    "Pourquoi Tenu existe, raconté par des scénarios concrets. Des cas d'école tirés de dossiers que nous avons vus et, à partir de mai 2026, des récits de contestations menées à leur terme.",
  eyebrow: "Cas d'usage",
  title: "Deux séries d'histoires. Un seul produit.",
  lede:
    "Les cas ci-dessous dessinent la forme du problème. Chaque dossier est un composite assemblé à partir de situations que nous avons vues. À partir de mai 2026, nous publierons les résultats de contestations réelles menées à leur terme, anonymisées avec l'accord du locataire.",
  cautionaryHeading: "Pourquoi Tenu existe",
  cautionaryIntro:
    "Voici les récits qui nous ont poussés à construire le produit. Chaque locataire a perdu tout ou partie de sa caution, ou a reçu une facture supplémentaire, pour des raisons qu'une chaîne de preuves structurée aurait neutralisées.",
  successHeading: "Comment cela s'est passé",
  successIntro:
    "Résultats des premières contestations. Cautions restituées, factures retirées, montants récupérés. Publiés uniquement avec l'accord écrit du locataire, noms et adresses supprimés.",
  successEmpty:
    "Aucun cas de réussite publié à ce stade. Premier lot attendu après la fenêtre de suivi à quatorze jours de la cohorte du 11 mai 2026. À revoir fin mai.",
  home: "Accueil",
  pricing: "Tarifs",
  closingHeading: "Votre dossier n'est pas condamné à leur ressembler.",
  closingBody:
    "Quinze euros pour un studio ou un T1. Sans abonnement. Remboursement si le service ne peut être rendu.",
  cta: "Commencer mon inspection",
};

async function resolveChrome(): Promise<{ c: Chrome; lang: "en" | "fr" }> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLocale = cookieStore.get("locale")?.value;
  const locale = cookieLocale
    ? parseLocaleFromCookie(cookieLocale)
    : parseLocaleFromHeader(headerStore.get("accept-language") ?? undefined);
  const isEn = locale === "en";
  return { c: isEn ? EN : FR, lang: isEn ? "en" : "fr" };
}

export async function generateMetadata() {
  const { c } = await resolveChrome();
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function StoriesIndex() {
  const { c, lang } = await resolveChrome();
  const cautionary = getStoriesByCategory("cautionary");
  const success = getStoriesByCategory("success");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <Link href="/" className="text-2xl font-bold text-tenu-forest">
          tenu
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-tenu-slate hover:text-tenu-forest">
            {c.home}
          </Link>
          <Link
            href="/pricing"
            className="text-tenu-slate hover:text-tenu-forest"
          >
            {c.pricing}
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Lede */}
        <section className="t-section-canvas px-6 text-center">
          <span className="t-label mb-5 inline-block text-tenu-accent">
            {c.eyebrow}
          </span>
          <h1 className="t-display mx-auto max-w-4xl">{c.title}</h1>
          <p className="t-body-muted mx-auto mt-6 max-w-2xl">{c.lede}</p>
        </section>

        {/* Cautionary */}
        <section className="t-section-band px-6 md:px-12">
          <div className="t-content max-w-5xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="t-section-heading mb-4">{c.cautionaryHeading}</h2>
              <p className="t-body-muted">{c.cautionaryIntro}</p>
            </div>

            {cautionary.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                {cautionary.map((s) => (
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
            )}
          </div>
        </section>

        {/* Success */}
        <section className="t-section-canvas px-6 md:px-12">
          <div className="t-content max-w-5xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="t-section-heading mb-4">{c.successHeading}</h2>
              <p className="t-body-muted">{c.successIntro}</p>
            </div>

            {success.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {success.map((s) => (
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
            ) : (
              <div className="rounded-2xl border border-dashed border-tenu-cream-dark bg-transparent p-8 text-center">
                <p className="t-small-muted">{c.successEmpty}</p>
              </div>
            )}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="t-section-band px-6 md:px-12">
          <div className="t-content max-w-2xl text-center">
            <h2 className="t-section-heading mb-5">{c.closingHeading}</h2>
            <p className="t-body-muted mb-10">{c.closingBody}</p>
            <Link href="/inspection/new" className="t-cta-primary hig-press">
              {c.cta}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t t-hairline px-6 py-10 text-center text-sm text-tenu-ink-muted">
        <p>
          &copy; {new Date().getFullYear()} Global Apex NET (SAS, France).
          tenu.world
        </p>
      </footer>
    </div>
  );
}
