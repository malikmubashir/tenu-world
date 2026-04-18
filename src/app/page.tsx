import { cookies, headers } from "next/headers";
import Link from "next/link";
import Script from "next/script";
import { Shield, Camera, BookOpen, Brain, FileText, Bell } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";
import { parseLocaleFromCookie, parseLocaleFromHeader } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

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
  areaServed: [
    { "@type": "Country", name: "France" },
    { "@type": "Country", name: "United Kingdom" },
  ],
  audience: {
    "@type": "Audience",
    audienceType: "Tenants, international students, expatriate renters",
  },
  description:
    "AI-powered analysis of rental property photographs to estimate fair deposit deductions. Optional template dispute letter formatted for the jurisdiction (France: recorded delivery; UK: TDS / DPS / MyDeposits).",
  offers: [
    {
      "@type": "Offer",
      name: "AI deposit risk scan",
      price: "15",
      priceCurrency: "EUR",
      url: `${SITE_URL}/pricing`,
    },
    {
      "@type": "Offer",
      name: "Dispute letter",
      price: "25",
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
          "Tenu.World is a tenant-facing tool that analyses photographs of a rented apartment or house and produces a risk analysis report estimating how much of the deposit a landlord could reasonably deduct based on observed wear and tear. An optional add-on generates a ready-to-send dispute letter. Tenu operates in France and the United Kingdom.",
      },
    },
    {
      "@type": "Question",
      name: "How much does Tenu cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "The risk analysis report costs EUR 15 in France or GBP 15 in the United Kingdom at launch pricing. The optional dispute letter costs EUR 25 or GBP 25. No subscription. Payment is processed by Stripe.",
      },
    },
    {
      "@type": "Question",
      name: "Is Tenu.World a law firm or legal advice?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "No. Tenu produces document templates: a risk report and a dispute letter. These are not legal advice and do not replace consultation with a qualified solicitor. Tenu does not engage in legal representation within the meaning of French Law No. 71-1130 or the UK Legal Services Act 2007.",
      },
    },
    {
      "@type": "Question",
      name: "In which countries does Tenu operate?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "France and the United Kingdom. Legal output is generated in French or English only. The user interface supports ten languages including Arabic, Urdu, Chinese and Hindi with full right-to-left layout.",
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

async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLocale = cookieStore.get("locale")?.value;
  return cookieLocale
    ? parseLocaleFromCookie(cookieLocale)
    : parseLocaleFromHeader(headerStore.get("accept-language") ?? undefined);
}

export default async function Home() {
  const locale = await getLocale();
  const t = await getDictionary(locale) as Record<string, Record<string, Record<string, string> | string>>;

  const hero = t.hero as Record<string, string>;
  const features = t.features as Record<string, Record<string, string> | string>;

  const featureList = [
    { key: "onboarding", icon: Shield },
    { key: "evidence", icon: Camera },
    { key: "rights", icon: BookOpen },
    { key: "scan", icon: Brain },
    { key: "dispute", icon: FileText },
    { key: "followup", icon: Bell },
  ];

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
      {/* Hero + features — all visual decisions live in theme.css / globals.css.
          Markup references semantic .t-* classes so a token swap repaints everything. */}
      <main className="flex flex-1 flex-col">
        <section className="hig-fade-in t-section-canvas flex flex-col items-center px-6 text-center">
          <h1 className="t-display max-w-4xl">
            {hero.title}
          </h1>
          <p className="t-body-muted mt-6 max-w-2xl">
            {hero.subtitle}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/inspection/new" className="t-cta-primary hig-press">
              {hero.cta}
            </Link>
            <Link href="#features" className="t-cta-ghost hig-press">
              {hero.ctaSecondary} →
            </Link>
          </div>
        </section>

        <section id="features" className="t-section-band px-6 md:px-12">
          <h2 className="t-section-heading mb-16 text-center">
            {features.heading as string}
          </h2>
          <div className="t-content grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureList.map(({ key, icon: Icon }) => {
              const feat = features[key] as Record<string, string>;
              return (
                <div key={key} className="t-card hig-press">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-tenu-accent/10">
                    <Icon className="h-5 w-5 text-tenu-accent" strokeWidth={2.25} />
                  </div>
                  <h3 className="t-h3 mb-1.5">
                    {feat.title}
                  </h3>
                  <p className="t-small-muted">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
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
