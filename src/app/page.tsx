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
      {/* Hero — white canvas, near-black heading, emerald CTA.
          Tracking -0.02em matches SF Pro Display at display sizes. */}
      <main className="flex flex-1 flex-col">
        <section className="hig-fade-in flex flex-col items-center px-6 py-24 text-center md:py-36">
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight text-tenu-slate md:text-7xl" style={{ letterSpacing: "-0.03em" }}>
            {hero.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-tenu-slate/60 md:text-xl">
            {hero.subtitle}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/inspection/new"
              className="hig-press inline-flex h-12 items-center rounded-full bg-tenu-forest px-7 text-base font-semibold text-white hover:bg-tenu-forest-light"
            >
              {hero.cta}
            </Link>
            <Link
              href="#features"
              className="hig-press inline-flex h-12 items-center rounded-full px-7 text-base font-semibold text-tenu-forest hover:text-tenu-forest-light"
            >
              {hero.ctaSecondary} →
            </Link>
          </div>
        </section>

        {/* Features — cool light-gray band against white body, tiles pop as white cards. */}
        <section id="features" className="bg-tenu-cream-dark px-6 py-24 md:px-12">
          <h2 className="mb-16 text-center text-4xl font-semibold tracking-tight text-tenu-slate md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            {features.heading as string}
          </h2>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureList.map(({ key, icon: Icon }) => {
              const feat = features[key] as Record<string, string>;
              return (
                <div
                  key={key}
                  className="hig-card hig-press p-7"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-tenu-forest/10">
                    <Icon className="h-5 w-5 text-tenu-forest" strokeWidth={2.25} />
                  </div>
                  <h3 className="mb-1.5 text-base font-semibold tracking-tight text-tenu-slate">
                    {feat.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-tenu-slate/60">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer — thin ink-on-light separator, muted copy, emerald on hover. */}
      <footer className="border-t border-tenu-cream-dark px-6 py-10 text-center text-sm text-tenu-slate/50">
        <p>&copy; {new Date().getFullYear()} Global Apex NET (SAS, France). tenu.world</p>
        <nav className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
          <Link href="/legal" className="hover:text-tenu-forest">Legal</Link>
          <Link href="/legal/privacy/fr" className="hover:text-tenu-forest">Confidentialité</Link>
          <Link href="/legal/privacy/en" className="hover:text-tenu-forest">Privacy</Link>
          <Link href="/legal/terms/fr" className="hover:text-tenu-forest">CGU</Link>
          <Link href="/legal/terms/en" className="hover:text-tenu-forest">Terms</Link>
          <Link href="/legal/refund/fr" className="hover:text-tenu-forest">Remboursement</Link>
          <Link href="/legal/refund/en" className="hover:text-tenu-forest">Refund</Link>
        </nav>
      </footer>
    </div>
  );
}
