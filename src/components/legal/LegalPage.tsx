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
  draftBanner: string;
  backToIndex: string;
};

type Props = {
  meta: LegalDocMeta;
  children: ReactNode;
};

export default function LegalPage({ meta, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <Link href="/" className="text-2xl font-bold text-tenu-forest">
          tenu
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/legal" className="text-tenu-slate hover:text-tenu-forest">
            {meta.backToIndex}
          </Link>
          <Link
            href={meta.otherLocaleHref}
            className="rounded-lg border border-tenu-forest/20 px-3 py-1 text-tenu-forest hover:bg-tenu-forest/5"
          >
            {meta.otherLocaleLabel}
          </Link>
        </nav>
      </header>

      <div className="border-y border-tenu-warning/40 bg-tenu-warning/10 px-6 py-3 md:px-12">
        <p className="mx-auto max-w-3xl text-sm text-tenu-slate">
          <span className="mr-2 rounded bg-tenu-warning px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
            Draft
          </span>
          {meta.draftBanner}
        </p>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 md:px-0">
        <h1 className="text-3xl font-bold text-tenu-forest md:text-4xl">{meta.title}</h1>
        <dl className="mt-4 grid grid-cols-1 gap-1 text-sm text-tenu-slate/80 sm:grid-cols-3">
          <div>
            <dt className="font-semibold">Version</dt>
            <dd>{meta.version}</dd>
          </div>
          <div>
            <dt className="font-semibold">Last updated</dt>
            <dd>{meta.lastUpdated}</dd>
          </div>
          <div>
            <dt className="font-semibold">Status</dt>
            <dd>{meta.statusLine}</dd>
          </div>
        </dl>
        <hr className="my-8 border-tenu-cream-dark" />
        <article className="legal-prose space-y-6 text-tenu-slate">{children}</article>
      </main>

      <footer className="border-t border-tenu-cream-dark px-6 py-8 text-center text-sm text-tenu-slate/60">
        &copy; {new Date().getFullYear()} Global Apex NET (SAS, France). tenu.world ·{" "}
        <Link href="/legal" className="underline hover:text-tenu-forest">
          Legal
        </Link>
      </footer>
    </div>
  );
}
