import { cookies, headers } from "next/headers";
import Link from "next/link";
import Script from "next/script";
import { Shield, Camera, BookOpen, Brain, FileText, Bell } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";
import { parseLocaleFromCookie, parseLocaleFromHeader } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import { getFeaturedStories } from "@/lib/stories";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tenu.world";

// Service schema — tells search and answer engines what Tenu does, for whom,
// and at what price. Feeds the "Service" card in AI overviews.
const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${SITE_URL}#service`,
  name: "Tenu deposit risk scan and dispute letter",
  serviceType: "Rental deposit dispute document generation",
  provider: { "@id": `${SITE_URL}#organization` },
  areaServed: [{ "@type": "Country", name: "France" }],
  audience: {
    "@type": "Audience",
    audienceType: "Tenants, international students, expatriate renters",
  },
  description:
    "AI-powered analysis of rental property photographs to estimate fair deposit deductions under French housing law. Optional template dispute letter formatted for the jurisdiction.",
  offers: [
    {
      "@type": "Offer",
      name: "AI deposit risk scan (Studio / T1)",
      price: "15",
      priceCurrency: "EUR",
      url: `${SITE_URL}/pricing`,
    },
    {
      "@type": "Offer",
      name: "Dispute letter (add-on)",
      price: "20",
      priceCurrency: "EUR",
      url: `${SITE_URL}/pricing`,
    },
  ],
};

// FAQ schema — short factual Q&A optimised for AEO. These answers are what
// ChatGPT, Gemini and Perplexity will quote when a user asks about Tenu.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Tenu.World?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Tenu.World is a tenant-facing tool for French rentals. It analyses move-out photos and produces a report estimating how much of the deposit a landlord can legally withhold under the official French wear-and-tear scale (arrêté du 19 mars 2020). An optional add-on generates a ready-to-send dispute letter.",
      },
    },
    {
      "@type": "Question",
      name: "How much does Tenu cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "The risk scan starts at EUR 15 for a studio or T1, scaling with dwelling size up to EUR 35 for a T5 or house. The optional dispute letter is EUR 20. No subscription. Payment upfront via Stripe.",
      },
    },
    {
      "@type": "Question",
      name: "Is Tenu.World a law firm or legal advice?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "No. Tenu produces document templates: a risk report and a dispute letter. These are not legal advice and do not replace consultation with a qualified lawyer. Tenu does not engage in legal representation within the meaning of French Law No. 71-1130.",
      },
    },
    {
      "@type": "Question",
      name: "Are my photos used to train AI models?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "No. All AI calls to Tenu's sub-processors, including Anthropic Claude, set the training opt-out flag. Uploaded photos are stored encrypted in the EU (Cloudflare R2 EU, Supabase EU) for twelve months from the inspection date and then deleted.",
      },
    },
    {
      "@type": "Question",
      name: "How fast is the risk analysis?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Typically under two minutes from photo upload to PDF report. A follow-up questionnaire is sent fourteen days later to collect the outcome of the dispute.",
      },
    },
  ],
};

// MOBILE_BUILD=1 produces a static export for the Capacitor shell.
// Dynamic APIs would prevent the root route from being exported and
// the WebView would launch to 404. Default to en; MobileGate (client)
// handles first-launch routing to /intro or /app-home.
const IS_MOBILE_EXPORT = process.env.MOBILE_BUILD === "1";

async function getLocale(): Promise<Locale> {
  if (IS_MOBILE_EXPORT) return "en";
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLocale = cookieStore.get("locale")?.value;
  return cookieLocale
    ? parseLocaleFromCookie(cookieLocale)
    : parseLocaleFromHeader(headerStore.get("accept-language") ?? undefined);
}

export default async function Home() {
  const locale = await getLocale();
  const t = (await getDictionary(locale)) as Record<
    string,
    Record<string, unknown>
  >;

  // Pull typed views over sections. Cast at the edge, keep JSX clean.
  const hero = t.hero as Record<string, string>;
  const trust = t.trust as { heading: string; items: Record<string, { title: string; desc: string }> };
  const example = t.example as Record<string, string>;
  const features = t.features as Record<string, unknown>;
  const closing = t.closing as Record<string, string>;

  // Case cards are rendered from the story manifest, not the dictionary.
  // EN + FR only per launch directive; non-en locales receive FR content.
  const featured = getFeaturedStories(2);
  const storyLang: "en" | "fr" = locale === "en" ? "en" : "fr";

  const featureList = [
    { key: "onboarding", icon: Shield },
    { key: "evidence", icon: Camera },
    { key: "rights", icon: BookOpen },
    { key: "scan", icon: Brain },
    { key: "dispute", icon: FileText },
    { key: "followup", icon: Bell },
  ];

  const trustItems = ["data", "law", "honesty"] as const;

  return (
    <div className="flex min-h-screen flex-col">
      <Script
        id="ld-service"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <Script
        id="ld-faq"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/*
        Conversion psychology sequence (top to bottom):
          1. Hero  — name the pain, mechanism, time, price. Above the fold.
          2. Trust — three proofs. Removes the "can I trust a €15 site" block.
          3. Example — one concrete scenario with numbers. Makes outcome vivid.
          4. Features — reframed process → outcome, not feature-first marketing.
          5. Closing — low-risk CTA, price repeated, legal micro-copy.
        All visual decisions live in theme.css. Markup uses .t-* semantic classes.
      */}
      <main className="flex flex-1 flex-col">

        {/* ---------- 1. HERO ---------- */}
        <section className="hig-fade-in t-section-canvas flex flex-col items-center px-6 text-center">
          {hero.eyebrow && (
            <span className="t-label mb-5 text-tenu-accent">{hero.eyebrow}</span>
          )}
          <h1 className="t-display max-w-4xl">{hero.title}</h1>
          <p className="t-body-muted mt-6 max-w-2xl">{hero.subtitle}</p>
          {hero.pricePromise && (
            <p className="mt-3 max-w-2xl text-sm font-medium text-tenu-ink">
              {hero.pricePromise}
            </p>
          )}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/inspection/new" className="t-cta-primary hig-press">
              {hero.cta}
            </Link>
            <Link href="#example" className="t-cta-ghost hig-press">
              {hero.ctaSecondary} →
            </Link>
          </div>
        </section>

        {/* ---------- 2. TRUST LADDER ---------- */}
        {trust?.heading && trust?.items && (
          <section className="t-section-band px-6 md:px-12">
            <div className="t-content">
              <h2 className="t-section-heading mb-12 text-center">{trust.heading}</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {trustItems.map((key) => {
                  const item = trust.items[key];
                  if (!item) return null;
                  return (
                    <div key={key} className="t-card hig-press">
                      <h3 className="t-h3 mb-2">{item.title}</h3>
                      <p className="t-small-muted">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ---------- 3. CASES (dual-card, manifest-driven) ---------- */}
        {/* Reads from getFeaturedStories(). Adding a new case = one append to
            src/lib/stories.ts with featured: true. Nothing else changes here.
            Success stories slot into the same grid once they land in May 2026. */}
        {example?.heading && featured.length > 0 && (
          <section id="example" className="t-section-canvas px-6 md:px-12">
            <div className="t-content max-w-5xl">
              <div className="mx-auto mb-12 max-w-2xl text-center">
                {example.label && (
                  <span className="t-label mb-4 inline-block text-tenu-accent">
                    {example.label}
                  </span>
                )}
                <h2 className="t-section-heading mb-5">{example.heading}</h2>
                {example.intro && (
                  <p className="t-body-muted">{example.intro}</p>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {featured.map((s) => (
                  <Link
                    key={s.slug}
                    href={s.href}
                    className="t-card hig-press block transition hover:-translate-y-0.5 hover:border-tenu-accent/40"
                  >
                    <div className="t-label mb-3 text-tenu-accent">
                      {s.eyebrow[storyLang]}
                    </div>
                    <h3 className="t-h3 mb-2">{s.title[storyLang]}</h3>
                    <p className="t-small-muted">{s.hook[storyLang]}</p>
                  </Link>
                ))}
              </div>

              {example.seeAll && (
                <div className="mt-10 text-center">
                  <Link href="/stories" className="t-cta-ghost hig-press">
                    {example.seeAll} →
                  </Link>
                </div>
              )}

              {example.disclaimer && (
                <p className="mt-8 text-center text-xs text-tenu-ink-muted">
                  {example.disclaimer}
                </p>
              )}
            </div>
          </section>
        )}

        {/* ---------- 4. FEATURES, REFRAMED AS OUTCOMES ---------- */}
        <section id="features" className="t-section-band px-6 md:px-12">
          <div className="t-content">
            {(features.eyebrow as string) && (
              <span className="t-label mb-3 block text-center text-tenu-accent">
                {features.eyebrow as string}
              </span>
            )}
            <h2 className="t-section-heading mb-14 text-center">
              {features.heading as string}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featureList.map(({ key, icon: Icon }) => {
                const feat = features[key] as Record<string, string>;
                return (
                  <Link
                    key={key}
                    href={`/features/${key}`}
                    aria-label={feat.title}
                    className="t-card hig-press block transition hover:-translate-y-0.5 hover:border-tenu-accent/40"
                  >
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-tenu-accent/10">
                      <Icon className="h-5 w-5 text-tenu-accent" strokeWidth={2.25} />
                    </div>
                    <h3 className="t-h3 mb-1.5">{feat.title}</h3>
                    <p className="t-small-muted">{feat.desc}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------- 5. CLOSING CTA ---------- */}
        {closing?.heading && (
          <section className="t-section-canvas px-6 md:px-12">
            <div className="t-content max-w-2xl text-center">
              <h2 className="t-section-heading mb-5">{closing.heading}</h2>
              {closing.body && <p className="t-body-muted mb-10">{closing.body}</p>}
              <Link href="/inspection/new" className="t-cta-primary hig-press">
                {closing.cta ?? hero.cta}
              </Link>
              {closing.subnote && (
                <p className="mt-6 text-xs text-tenu-ink-muted">{closing.subnote}</p>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer — separator + muted copy, accent on hover. */}
      <footer className="border-t t-hairline px-6 py-10 text-center text-sm text-tenu-ink-muted">
        <p>&copy; {new Date().getFullYear()} Global Apex NET (SAS, France). tenu.world</p>
        <nav className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
          <Link href="/legal" className="hover:text-tenu-accent">Legal</Link>
          <Link href="/legal/privacy/fr" className="hover:text-tenu-accent">Confidentialité</Link>
          <Link href="/legal/privacy/en" className="hover:text-tenu-accent">Privacy</Link>
          <Link href="/legal/terms/fr" className="hover:text-tenu-accent">CGU</Link>
          <Link href="/legal/terms/en" className="hover:text-tenu-accent">Terms</Link>
          <Link href="/legal/refund/fr" className="hover:text-tenu-accent">Remboursement</Link>
          <Link href="/legal/refund/en" className="hover:text-tenu-accent">Refund</Link>
        </nav>
      </footer>
    </div>
  );
}
