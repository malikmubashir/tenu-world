// Noindex guard for /inspection/*. Inspection routes are user-specific
// and carry session data — they must never appear in search results.
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function InspectionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
