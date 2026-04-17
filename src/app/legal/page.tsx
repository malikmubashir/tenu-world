// Legal index page. Lists all draft legal documents (FR + EN).
// Server component, no locale cookie dependency — each doc ships both languages.
import Link from "next/link";

export const metadata = {
  title: "Legal — Tenu.World",
  description: "Draft legal documents of Tenu.World — privacy, terms, refund.",
};

type Doc = {
  slug: string;
  titleFr: string;
  titleEn: string;
  descFr: string;
  descEn: string;
};

const docs: Doc[] = [
  {
    slug: "privacy",
    titleFr: "Politique de confidentialité",
    titleEn: "Privacy Policy",
    descFr: "Qui traite vos données, pourquoi, combien de temps, où.",
    descEn: "Who processes your data, why, for how long, where.",
  },
  {
    slug: "terms",
    titleFr: "Conditions générales d'utilisation",
    titleEn: "Terms of Service",
    descFr: "Règles d'accès au service et obligations mutuelles.",
    descEn: "Rules for using the service and mutual obligations.",
  },
  {
    slug: "refund",
    titleFr: "Politique de remboursement",
    titleEn: "Refund Policy",
    descFr: "Droit de rétractation, cas de remboursement, modalités.",
    descEn: "Right of withdrawal, refund scenarios, procedure.",
  },
];

export default function LegalIndex() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <Link href="/" className="text-2xl font-bold text-tenu-forest">
          tenu
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-tenu-slate hover:text-tenu-forest">
            Home
          </Link>
        </nav>
      </header>

      <div className="border-y border-tenu-warning/40 bg-tenu-warning/10 px-6 py-3 md:px-12">
        <p className="mx-auto max-w-3xl text-sm text-tenu-slate">
          <span className="mr-2 rounded bg-tenu-warning px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
            Draft
          </span>
          These documents are v1.0-draft pending counsel review. They are published for transparency and review, not yet binding.
        </p>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 md:px-0">
        <h1 className="text-3xl font-bold text-tenu-forest md:text-4xl">Legal documents</h1>
        <p className="mt-4 text-sm text-tenu-slate/80">
          Version v1.0-draft &middot; dated 2026-04-17 &middot; published for legal review.
          Each document is available in French and English. The French version governs;
          the English version is provided for convenience.
        </p>

        <div className="mt-10 grid gap-6">
          {docs.map((doc) => (
            <article
              key={doc.slug}
              className="rounded-xl border border-tenu-cream-dark bg-white p-6"
            >
              <h2 className="text-xl font-semibold text-tenu-forest">{doc.titleFr}</h2>
              <p className="mt-1 text-sm text-tenu-slate/80">{doc.descFr}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link
                  href={`/legal/${doc.slug}/fr`}
                  className="rounded-lg bg-tenu-forest px-4 py-2 font-medium text-white hover:bg-tenu-forest-light"
                >
                  Lire en français
                </Link>
                <Link
                  href={`/legal/${doc.slug}/en`}
                  className="rounded-lg border border-tenu-forest/20 px-4 py-2 font-medium text-tenu-forest hover:bg-tenu-forest/5"
                >
                  Read in English
                </Link>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-12 rounded-lg border border-tenu-cream-dark bg-tenu-cream p-6 text-sm text-tenu-slate">
          <h2 className="text-base font-semibold text-tenu-forest">Outstanding placeholders</h2>
          <p className="mt-2">
            One placeholder remains visible and is expected to be resolved before commercial launch:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>
              <code className="rounded bg-white px-1 py-0.5">[MEDIATEUR]</code> /{" "}
              <code className="rounded bg-white px-1 py-0.5">[À VÉRIFIER PAR AVOCAT]</code> &mdash; consumer mediator (pending shortlist evaluation).
            </li>
          </ul>
          <p className="mt-3 text-xs text-tenu-slate/70">
            Resolved 2026-04-17: share capital set at <strong>EUR 100</strong> per the statuts of Global Apex.Net SAS.
          </p>
          <p className="mt-3">
            For questions on any of these documents, write to{" "}
            <a className="underline hover:text-tenu-forest" href="mailto:support@tenu.world">
              support@tenu.world
            </a>{" "}
            or, for data protection,{" "}
            <a className="underline hover:text-tenu-forest" href="mailto:dpo@tenu.world">
              dpo@tenu.world
            </a>
            .
          </p>
        </section>
      </main>

      <footer className="border-t border-tenu-cream-dark px-6 py-8 text-center text-sm text-tenu-slate/60">
        &copy; {new Date().getFullYear()} Global Apex NET (SAS, France). tenu.world
      </footer>
    </div>
  );
}
