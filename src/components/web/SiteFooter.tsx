// SiteFooter — typographic editorial footer shared by every public
// web surface (Éditorial v2, #T149). White ground, underlined ink
// links, ash copyright line. No fills, no icons, no chrome — the
// footer is set like a colophon.
//
// v2.1 (#T167): the top rule is the site's SIGNATURE 1px gold rule
// (.ed-rule-gold) — the single consistent gold placement in the
// chrome, like the rule above a colophon in a bound report. Do not
// repeat it elsewhere.
//
// Server component, no locale dependency: legal links carry their
// own FR/EN labels (each document ships both languages).
import Link from "next/link";

const LINKS = [
  ["/stories", "Cases"],
  ["/pricing", "Pricing"],
  ["/legal", "Legal"],
  ["/legal/privacy/fr", "Confidentialité"],
  ["/legal/privacy/en", "Privacy"],
  ["/legal/terms/fr", "CGU"],
  ["/legal/terms/en", "Terms"],
  ["/legal/refund/fr", "Remboursement"],
  ["/legal/refund/en", "Refund"],
] as const;

export default function SiteFooter() {
  return (
    <footer className="ed-rule-gold bg-tenu-canvas">
      <div className="ed-frame py-10 md:py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-baseline md:justify-between">
          <span className="t-wordmark text-2xl">tenu</span>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-base">
            {LINKS.map(([href, label]) => (
              <Link key={href} href={href} className="ed-link">
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="t-caption mt-8">
          &copy; {new Date().getFullYear()} Global Apex NET (SAS, France).
          tenu.world
        </p>
      </div>
    </footer>
  );
}
