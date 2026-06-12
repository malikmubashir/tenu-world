// Legal index page. Lists all draft legal documents (FR + EN).
// Server component, no locale cookie dependency — each doc ships both languages.
import Link from "next/link";

export const metadata = {
  title: "Legal — Tenu.World",
  description: "Legal documents of Tenu.World — legal notice, privacy, terms, refund.",
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
    slug: "mentions",
    titleFr: "Mentions légales",
    titleEn: "Legal Notice",
    descFr: "Éditeur, directeur de la publication, hébergeur.",
    descEn: "Publisher, publication director, host.",
  },
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
    <div className="flex min-h-screen flex-col bg-tenu-canvas">
      <div className="border-b t-hairline px-6 py-3 md:px-12">
        <p className="mx-auto max-w-3xl text-sm text-tenu-ink">
          <span className="me-2 border border-tenu-ink px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-tenu-ink">
            Pré-lancement
          </span>
          Documents relus et validés par le DPO (AP3R Consulting) le 12 juin 2026. La désignation du médiateur de la consommation est en cours et sera publiée avant l&apos;ouverture commerciale.
        </p>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 md:px-0 md:py-14">
        <h1 className="t-section-heading">Legal documents</h1>
        <p className="mt-4 text-sm text-tenu-ink-muted">
          Version v1.1 &middot; updated 2026-06-12 &middot; DPO-validated (AP3R Consulting).
          Each document is available in French and English. The French version governs;
          the English version is provided for convenience.
        </p>

        <div className="mt-10 divide-y divide-tenu-hairline border-y t-hairline">
          {docs.map((doc) => (
            <article key={doc.slug} className="py-6">
              <h2 className="text-xl font-normal tracking-tight text-tenu-ink">{doc.titleFr}</h2>
              <p className="mt-1 text-sm text-tenu-ink-muted">{doc.descFr}</p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <Link href={`/legal/${doc.slug}/fr`} className="ed-link-strong">
                  Lire en français
                </Link>
                <Link href={`/legal/${doc.slug}/en`} className="ed-link-strong">
                  Read in English
                </Link>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-12 border t-hairline p-6 text-sm text-tenu-ink">
          <h2 className="text-base font-medium text-tenu-ink">Outstanding placeholders</h2>
          <p className="mt-2">
            One placeholder remains visible and is expected to be resolved before commercial launch:
          </p>
          <ul className="mt-3 list-disc space-y-1 ps-5">
            <li>
              <code className="border border-tenu-hairline px-1 py-0.5">[MEDIATEUR]</code> /{" "}
              <code className="border border-tenu-hairline px-1 py-0.5">[À VÉRIFIER PAR AVOCAT]</code> &mdash; consumer mediator (pending shortlist evaluation).
            </li>
          </ul>
          <p className="mt-3 text-xs text-tenu-ink-muted">
            Resolved 2026-04-17: share capital set at <strong>EUR 100</strong> per the statuts of Global Apex.Net SAS.
          </p>
          <p className="mt-3">
            For questions on any of these documents, write to{" "}
            <a className="ed-link" href="mailto:support@tenu.world">
              support@tenu.world
            </a>{" "}
            or, for data protection,{" "}
            <a className="ed-link" href="mailto:dpo@tenu.world">
              dpo@tenu.world
            </a>
            .
          </p>
        </section>
      </main>

      <footer className="border-t t-hairline px-6 py-8 text-center text-sm text-tenu-ink-muted">
        &copy; {new Date().getFullYear()} Global Apex NET (SAS, France). tenu.world
      </footer>
    </div>
  );
}
