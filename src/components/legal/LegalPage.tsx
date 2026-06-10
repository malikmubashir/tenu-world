// Shared chrome for every legal page (privacy, terms, refund — FR + EN).
// Renders a DRAFT banner, header metadata, and the document content.
// Content lives in each route file; this component only dresses the page.
import Link from "next/link";
import type { ReactNode } from "react";

export type LegalDocMeta = {
  title: string;
  version: string;
  lastUpdated: string;
  statusLine: string;
  localeLabel: string;
  otherLocaleHref: string;
  otherLocaleLabel: string;
  backToIndex: string;
};

type Props = {
  meta: LegalDocMeta;
  children: ReactNode;
};

export default function LegalPage({ meta, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-tenu-canvas">
      {/* Local nav strip (GlobalHeader carries the brand chrome):
          back-link + locale switch as typographic links. */}
      <div className="border-b t-hairline">
        <nav className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-3 text-sm md:px-0">
          <Link href="/legal" className="ed-link">
            {meta.backToIndex}
          </Link>
          <Link href={meta.otherLocaleHref} className="ed-link">
            {meta.otherLocaleLabel}
          </Link>
        </nav>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 md:px-0 md:py-14">
        <h1 className="t-section-heading">{meta.title}</h1>
        <dl className="mt-6 grid grid-cols-1 gap-1 text-sm text-tenu-ink-muted sm:grid-cols-3">
          <div>
            <dt className="font-medium text-tenu-ink">Version</dt>
            <dd>{meta.version}</dd>
          </div>
          <div>
            <dt className="font-medium text-tenu-ink">Last updated</dt>
            <dd>{meta.lastUpdated}</dd>
          </div>
          <div>
            <dt className="font-medium text-tenu-ink">Status</dt>
            <dd>{meta.statusLine}</dd>
          </div>
        </dl>
        <hr className="my-8 border-tenu-hairline" />
        <article className="legal-prose space-y-6 text-tenu-ink">{children}</article>
      </main>

      <footer className="border-t t-hairline px-6 py-8 text-center text-sm text-tenu-ink-muted">
        &copy; {new Date().getFullYear()} Global Apex NET (SAS, France). tenu.world ·{" "}
        <Link href="/legal" className="ed-link">
          Legal
        </Link>
      </footer>
    </div>
  );
}
