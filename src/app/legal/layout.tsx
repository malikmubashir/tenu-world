// Noindex guard for the entire /legal/* tree.
// Reason: current documents are DRAFT v1.0 pending counsel review.
// We do not want search engines caching content that will be revised before
// commercial launch. Flip `robots.index` to true when v1.0-final is signed.
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
