import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { getDictionary } from "@/lib/i18n/server";
import { parseLocaleFromCookie, parseLocaleFromHeader } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import { getFeaturedStories } from "@/lib/stories";
import SiteFooter from "@/components/web/SiteFooter";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tenu.world";

// Éditorial v2 (#T149) — photographic plates carry all the warmth and
// colour the achromatic chrome refuses. Hot-linked from the Unsplash
// CDN (whitelisted in next.config.ts). Warm-toned, high-key Parisian
// interiors: parquet, tall windows, panelled walls.
const HERO_PLATE =
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=2400&q=80";
const MID_PLATE =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=2400&q=80";

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
  const { cookies, headers } = await import("next/headers");
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLocale = cookieStore.get("locale")?.value;
  return cookieLocale
    ? parseLocaleFromCookie(cookieLocale)
    : parseLocaleFromHeader(headerStore.get("accept-language") ?? undefined);
}

// Thin-stroke circular line motif — the only decorative graphic the
// editorial system permits (spec §Key Value Cell). 1px hairline
// stroke, no fill; the cell text breaks across the circle's edge.
function BlueprintCircle() {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      className="pointer-events-none absolute start-1/2 top-1/2 h-44 w-44 -translate-y-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 md:h-52 md:w-52"
    >
      <circle
        cx="100"
        cy="100"
        r="99"
        fill="none"
        stroke="var(--color-tenu-hairline)"
        strokeWidth="1"
      />
    </svg>
  );
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

  // Éditorial v2: no icons. Features are set as a numbered hairline
  // grid — the index figure is the only ornament.
  const featureKeys = [
    "onboarding",
    "evidence",
    "rights",
    "scan",
    "dispute",
    "followup",
  ] as const;

  const trustItems = ["data", "law", "honesty"] as const;

  return (
    <div className="flex min-h-screen flex-col bg-tenu-canvas">
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
        Éditorial v2 scroll (top to bottom):
          1. Hero plate    — full-bleed photograph, no text overlay. The image leads alone.
          2. Headline      — 100px display, flush-left, short body, CTA pair.
          3. Key values    — 4-up hairline blueprint grid (trust proofs).
          4. Cases         — hairline-divided editorial rows from the story manifest.
          5. Mid plate     — second full-bleed photograph.
          6. Features      — numbered 6-up hairline grid, no icons.
          7. App band      — inverted black band (download section).
          8. Closing       — flush-left CTA, legal micro-copy.
        All visual decisions live in theme.css / globals.css. Markup uses
        .t-* / .ed-* semantic classes and logical properties (RTL-safe).
      */}
      <main className="flex flex-1 flex-col">

        {/* ---------- 1. HERO PLATE — image leads alone ---------- */}
        <section className="relative h-[48vh] min-h-[320px] w-full md:h-[70vh]">
          <Image
            src={HERO_PLATE}
            alt="Sunlit Haussmannian apartment with herringbone parquet, white panelled walls and tall windows"
            fill
            priority
            loading="eager"
            sizes="100vw"
            className="object-cover"
          />
        </section>

        {/* ---------- 2. DISPLAY HEADLINE ---------- */}
        <section className="hig-fade-in border-b t-hairline">
          <div className="ed-frame py-16 text-start md:py-24">
            {hero.eyebrow && (
              <p className="ed-label mb-8">{hero.eyebrow}</p>
            )}
            <h1 className="t-display max-w-6xl">{hero.title}</h1>
            <p className="t-body-muted mt-8 max-w-2xl text-lg">{hero.subtitle}</p>
            {hero.pricePromise && (
              <p className="t-body mt-3 max-w-2xl font-medium">
                {hero.pricePromise}
              </p>
            )}
            <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4">
              <Link href="/inspection/new" className="t-cta-primary hig-press">
                {hero.cta}
              </Link>
              <Link href="#example" className="t-cta-ghost hig-press">
                {hero.ctaSecondary} →
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- 3. KEY VALUES — 4-up blueprint grid ---------- */}
        {trust?.heading && trust?.items && (
          <section className="border-b t-hairline">
            <div className="ed-frame py-16 md:py-20">
              {/* gap-px over a hairline ground draws perfect 1px rules
                  between cells; the outer border closes the frame. */}
              <div className="grid grid-cols-1 gap-px border t-hairline bg-tenu-hairline sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative min-h-64 bg-tenu-canvas p-5 md:min-h-80">
                  <BlueprintCircle />
                  <h2 className="t-section-heading relative max-w-full">
                    {trust.heading}
                  </h2>
                </div>
                {trustItems.map((key) => {
                  const item = trust.items[key];
                  if (!item) return null;
                  return (
                    <div
                      key={key}
                      className="relative flex min-h-64 flex-col justify-between bg-tenu-canvas p-5 md:min-h-80"
                    >
                      <BlueprintCircle />
                      <h3 className="t-h3 relative text-balance text-3xl font-light tracking-tight">
                        {item.title}
                      </h3>
                      <p className="t-body-muted relative mt-6">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ---------- 4. CASES — editorial rows (manifest-driven) ---------- */}
        {/* Reads from getFeaturedStories(). Adding a new case = one append to
            src/lib/stories.ts with featured: true. Nothing else changes here. */}
        {example?.heading && featured.length > 0 && (
          <section id="example" className="border-b t-hairline">
            <div className="ed-frame py-16 md:py-20">
              {example.label && (
                <p className="ed-label mb-6">{example.label}</p>
              )}
              <h2 className="t-section-heading max-w-4xl">{example.heading}</h2>
              {example.intro && (
                <p className="t-body-muted mt-6 max-w-2xl">{example.intro}</p>
              )}

              <div className="mt-12">
                {featured.map((s) => (
                  <Link
                    key={s.slug}
                    href={s.href}
                    className="group block border-t t-hairline py-8 last:border-b"
                  >
                    <div className="grid gap-3 md:grid-cols-12 md:gap-8">
                      <p className="t-label md:col-span-3">
                        {s.eyebrow[storyLang]}
                      </p>
                      <div className="md:col-span-7">
                        <h3 className="text-2xl font-light tracking-tight text-tenu-ink md:text-3xl">
                          {s.title[storyLang]}
                        </h3>
                        <p className="t-body-muted mt-2">{s.hook[storyLang]}</p>
                      </div>
                      <p className="ed-link-strong self-start md:col-span-2 md:justify-self-end">
                        →
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {example.seeAll && (
                <div className="mt-10">
                  <Link href="/stories" className="ed-link-strong">
                    {example.seeAll} →
                  </Link>
                </div>
              )}

              {example.disclaimer && (
                <p className="t-caption mt-8 max-w-2xl">{example.disclaimer}</p>
              )}
            </div>
          </section>
        )}

        {/* ---------- 5. MID PLATE ---------- */}
        <section className="relative h-[36vh] min-h-[260px] w-full md:h-[55vh]">
          <Image
            src={MID_PLATE}
            alt="Warm-toned Parisian living room with oak parquet floor and natural light"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </section>

        {/* ---------- 6. FEATURES — numbered hairline grid, no icons ---------- */}
        <section id="features" className="border-y t-hairline">
          <div className="ed-frame py-16 md:py-20">
            {(features.eyebrow as string) && (
              <p className="ed-label mb-6">{features.eyebrow as string}</p>
            )}
            <h2 className="t-section-heading max-w-4xl">
              {features.heading as string}
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-px border t-hairline bg-tenu-hairline md:grid-cols-2 lg:grid-cols-3">
              {featureKeys.map((key, i) => {
                const feat = features[key] as Record<string, string>;
                return (
                  <Link
                    key={key}
                    href={`/features/${key}`}
                    aria-label={feat.title}
                    className="group flex min-h-56 flex-col justify-between bg-tenu-canvas p-6 transition-colors duration-150"
                  >
                    <span className="t-caption tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="mt-10">
                      <h3 className="t-h3 group-hover:text-tenu-accent">
                        {feat.title}
                      </h3>
                      <p className="t-body-muted mt-2">{feat.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------- 7. APP BAND — inverted black ---------- */}
        {app?.heading && (
          <section className="ed-band">
            <div className="ed-frame grid gap-10 md:grid-cols-2 md:gap-16">
              <div>
                <h2 className="t-section-heading">{app.heading}</h2>
                {app.subtext && (
                  <p className="t-body-muted mt-6 max-w-md">{app.subtext}</p>
                )}
              </div>
              <div className="flex flex-col items-start justify-center gap-6">
                <p className="text-lg">
                  <a href="#" className="ed-link-inverted" title={app.comingSoon}>
                    {app.appStore}
                  </a>
                  <span className="t-caption ms-3">{app.comingSoon}</span>
                </p>
                <p className="text-lg">
                  <a href="#" className="ed-link-inverted" title={app.comingSoon}>
                    {app.playStore}
                  </a>
                  <span className="t-caption ms-3">{app.comingSoon}</span>
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ---------- 8. CLOSING ---------- */}
        {closing?.heading && (
          <section>
            <div className="ed-frame py-16 text-start md:py-24">
              <h2 className="t-section-heading max-w-4xl">{closing.heading}</h2>
              {closing.body && (
                <p className="t-body-muted mt-6 max-w-2xl">{closing.body}</p>
              )}
              <div className="mt-10">
                <Link href="/inspection/new" className="t-cta-primary hig-press">
                  {closing.cta ?? hero.cta}
                </Link>
              </div>
              {closing.subnote && (
                <p className="t-caption mt-6 max-w-2xl">{closing.subnote}</p>
              )}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
