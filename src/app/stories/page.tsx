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
// Bilingual EN/FR inline. Non-en/fr locales fall back to EN.
import { cookies, headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import {
  parseLocaleFromCookie,
  parseLocaleFromHeader,
} from "@/lib/i18n/server";
import { getStoriesByCategory } from "@/lib/stories";
import SiteFooter from "@/components/web/SiteFooter";

// Éditorial v2 (#T149) — full-bleed photographic plate; the image
// carries the warmth the achromatic chrome refuses.
const INDEX_PLATE =
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=2400&q=80";

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
    <div className="flex min-h-screen flex-col bg-tenu-canvas">
      <main className="flex flex-1 flex-col">
        {/* Plate — image leads alone, no overlay */}
        <section className="relative h-[36vh] min-h-[260px] w-full md:h-[55vh]">
          <Image
            src={INDEX_PLATE}
            alt="Bright Parisian living room with tall windows and soft natural light"
            fill
            priority
            loading="eager"
            sizes="100vw"
            className="object-cover"
          />
        </section>

        {/* Lede */}
        <section className="t-section-canvas ed-frame text-start">
          <span className="ed-kicker mb-8 inline-block">{c.eyebrow}</span>
          <h1 className="t-display max-w-6xl">{c.title}</h1>
          <p className="t-body-muted mt-8 max-w-2xl">{c.lede}</p>
        </section>

        {/* Cautionary */}
        <section className="t-section-canvas border-t t-hairline px-6 md:px-12">
          <div className="t-content max-w-5xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="t-section-heading mb-4">{c.cautionaryHeading}</h2>
              <p className="t-body-muted">{c.cautionaryIntro}</p>
            </div>

            {cautionary.length > 0 && (
              <div className="grid grid-cols-1 gap-px border t-hairline bg-tenu-hairline md:grid-cols-2">
                {cautionary.map((s) => (
                  <Link
                    key={s.slug}
                    href={s.href}
                    className="hig-press group block bg-tenu-canvas p-6"
                  >
                    <div className="ed-label mb-3">{s.eyebrow[lang]}</div>
                    <h3 className="t-h3 mb-2 group-hover:text-tenu-accent">
                      {s.title[lang]}
                    </h3>
                    <p className="t-body-muted">{s.hook[lang]}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Success */}
        <section className="t-section-canvas border-t t-hairline px-6 md:px-12">
          <div className="t-content max-w-5xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="t-section-heading mb-4">{c.successHeading}</h2>
              <p className="t-body-muted">{c.successIntro}</p>
            </div>

            {success.length > 0 ? (
              <div className="grid grid-cols-1 gap-px border t-hairline bg-tenu-hairline md:grid-cols-2">
                {success.map((s) => (
                  <Link
                    key={s.slug}
                    href={s.href}
                    className="hig-press group block bg-tenu-canvas p-6"
                  >
                    <div className="ed-label mb-3">{s.eyebrow[lang]}</div>
                    <h3 className="t-h3 mb-2 group-hover:text-tenu-accent">
                      {s.title[lang]}
                    </h3>
                    <p className="t-body-muted">{s.hook[lang]}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="border t-hairline p-8">
                <p className="t-body-muted">{c.successEmpty}</p>
              </div>
            )}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="t-section-canvas border-t t-hairline px-6 md:px-12">
          <div className="t-content max-w-2xl text-start">
            <h2 className="t-section-heading mb-5">{c.closingHeading}</h2>
            <p className="t-body-muted mb-10">{c.closingBody}</p>
            <Link href="/inspection/new" className="t-cta-primary hig-press">
              {c.cta}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
