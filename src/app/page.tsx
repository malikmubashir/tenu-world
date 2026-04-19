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
  const app = t.app as Record<string, string>;

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

          {/* App Store + Play Store badges — coming soon */}
          {app?.heading && (
            <div className="mt-12 flex flex-col items-center gap-4">
              <p className="t-label text-tenu-ink-muted">{app.heading}</p>
              <div className="flex flex-wrap justify-center gap-3">
                {/* Apple App Store badge */}
                <a
                  href="#"
                  aria-label={app.appStore}
                  className="hig-press group relative inline-flex h-12 items-center gap-3 rounded-xl border border-tenu-hairline bg-tenu-ink px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2c2c2e] focus-visible:ring-2 focus-visible:ring-tenu-accent"
                  title={app.comingSoon}
                >
                  {/* Apple logo SVG */}
                  <svg viewBox="0 0 814 1000" className="h-5 w-4 shrink-0 fill-white" aria-hidden="true">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-43.1-150.3-110.2c-52.1-76.3-93.1-193.9-93.1-307.5 0-177.3 115.6-271.2 229.6-271.2 58 0 106.2 40.2 142.2 40.2 34 0 87.2-42.6 152.7-42.6 24.8 0 108.2 2.6 168.6 81.3zm-119.2-146.8c-28.2 35-74.2 62.8-116.2 62.8-5.2 0-10.5-.6-15.8-1.9C540.8 206 606.4 113 606.4 33c0-4.5-.3-9.1-.7-13.6-58.6 2.3-131.9 40.2-170.6 88.5-35.1 43.3-67.5 111.2-67.5 183.7 0 6.5.7 13 1.3 15.2 4.5.7 9.1 1 13.7 1 56.8 0 124.2-37.7 159.5-85.1 18.8-25.6 37.1-67.1 37.1-109.1 0-5.2-.3-10.3-.7-15.4z"/>
                  </svg>
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] font-normal opacity-80">{app.comingSoon}</span>
                    <span>{app.appStore}</span>
                  </span>
                </a>

                {/* Google Play badge */}
                <a
                  href="#"
                  aria-label={app.playStore}
                  className="hig-press group relative inline-flex h-12 items-center gap-3 rounded-xl border border-tenu-hairline bg-tenu-ink px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2c2c2e] focus-visible:ring-2 focus-visible:ring-tenu-accent"
                  title={app.comingSoon}
                >
                  {/* Google Play logo SVG */}
                  <svg viewBox="0 0 512 512" className="h-5 w-5 shrink-0" aria-hidden="true">
                    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zm-116.6 217L325.3 277.7l60.1 60.1L104.6 499l104.1-47.7zM7.2 44.6C4.1 47.5 2 52 2 57.4V454.7c0 5.3 2.1 9.7 5.2 12.7l.7.6 226.5-226.5v-3.4L7.9 44.1l-.7.5zm466.5 161.5l-54.4-31.4-60.5 60.5 60.5 60.5 54.8-31.6c15.7-9.1 15.7-23.8 0-32.8l-.4-.2z" fill="#fff"/>
                  </svg>
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] font-normal opacity-80">{app.comingSoon}</span>
                    <span>{app.playStore}</span>
                  </span>
                </a>
              </div>
            </div>
          )}
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
