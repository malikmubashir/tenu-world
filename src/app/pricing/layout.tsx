// Server-side layout for /pricing. pricing/page.tsx is a client component,
// so metadata + JSON-LD must live here in its server parent.
import type { Metadata } from "next";
import Script from "next/script";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tenu.world";

const TITLE = "Pricing — flat-rate deposit risk scan and dispute letters";
const DESCRIPTION =
  "Tenu pricing: EUR 15 / GBP 15 for the AI deposit risk scan, EUR 25 / GBP 25 for a ready-to-send dispute letter. No subscription. No hidden fees.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/pricing`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

// Two Offer entries, one per product. Schema.org Offer is the right primitive
// for flat-rate digital services — keeps Google Merchant and AI search happy.
const offersJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Tenu.World services",
  itemListElement: [
    {
      "@type": "Offer",
      "@id": `${SITE_URL}/pricing#scan`,
      name: "AI deposit risk scan",
      description:
        "AI photo analysis of every room. Risk score, estimated deduction amounts, downloadable PDF report in under two minutes.",
      url: `${SITE_URL}/pricing`,
      priceCurrency: "EUR",
      price: "15.00",
      availability: "https://schema.org/InStock",
      areaServed: [
        { "@type": "Country", name: "France" },
        { "@type": "Country", name: "United Kingdom" },
      ],
      seller: { "@id": `${SITE_URL}#organization` },
    },
    {
      "@type": "Offer",
      "@id": `${SITE_URL}/pricing#dispute`,
      name: "Dispute letter",
      description:
        "Ready-to-send dispute letter formatted for the jurisdiction: lettre recommandee avec accuse de reception in France, TDS/DPS/MyDeposits claim in the UK.",
      url: `${SITE_URL}/pricing`,
      priceCurrency: "EUR",
      price: "25.00",
      availability: "https://schema.org/InStock",
      areaServed: [
        { "@type": "Country", name: "France" },
        { "@type": "Country", name: "United Kingdom" },
      ],
      seller: { "@id": `${SITE_URL}#organization` },
    },
  ],
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="ld-offers"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offersJsonLd) }}
      />
      {children}
    </>
  );
}
