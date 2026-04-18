// /features/followup — "Follow through to refund" / "Suivi jusqu'au
// remboursement". The fourteen-day outcome loop: one email, one question,
// aggregated outcomes that make the next tenant's report sharper.
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { parseLocaleFromCookie, parseLocaleFromHeader } from "@/lib/i18n/server";

type Copy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  lede: string;
  howHeading: string;
  howSteps: { title: string; body: string }[];
  whyHeading: string;
  whyBody: string;
  dataHeading: string;
  dataItems: string[];
  closingHeading: string;
  closingBody: string;
  cta: string;
  disclaimer: string;
  home: string;
  pricing: string;
};

const EN: Copy = {
  metaTitle: "Follow through to refund — Tenu.World outcome loop",
  metaDescription:
    "Fourteen days after the letter leaves, one short email asks whether the deposit came back. Aggregated outcomes make the next tenant's analysis sharper.",
  eyebrow: "Feature · Outcome loop",
  title: "Follow through to refund",
  lede:
    "Fourteen days after your dispute letter is sent, we ask one question: did your deposit come back. Your answer stays private, the aggregate makes the next tenant's report better.",
  howHeading: "How the loop works",
  howSteps: [
    {
      title: "Day 0 — letter sent",
      body: "You mark the letter as sent from your Tenu dashboard. The system records the date and schedules a follow-up fourteen days later.",
    },
    {
      title: "Day 14 — one email",
      body: "One short email with three buttons: deposit fully returned, partially returned, nothing returned. No survey, no questionnaire, no upsell.",
    },
    {
      title: "Follow-up filed",
      body: "Your answer is stored against the original risk scan and letter. The detail is visible in your dashboard; the individual record is never shared.",
    },
    {
      title: "Aggregate feeds the model",
      body: "Outcomes are aggregated across tenants and used to tune which arguments the Sonnet prompt should lead with. The next tenant benefits; your individual file does not leave our EU storage.",
    },
  ],
  whyHeading: "Why the loop matters",
  whyBody:
    "A risk-scoring engine without outcome data is a guess. The 14-day follow-up closes the loop: it tells us which lines in the report correlated with a refund, which with a partial settlement, which with nothing. Over time, the model learns which arguments carry weight with French landlords and which do not. Without this loop, every inspection is the first one.",
  dataHeading: "What is collected, what is not",
  dataItems: [
    "Collected: date the letter was sent, outcome (full / partial / none), amount recovered if partial.",
    "Not collected: identity of the landlord, free-text narrative, a second round of photos.",
    "Retention: outcome data is kept for three years for product improvement, then anonymised.",
    "Opt-out: the follow-up email carries a one-click unsubscribe. The risk scan you paid for is not affected.",
  ],
  closingHeading: "One email. One answer. A sharper report for the next tenant.",
  closingBody:
    "The follow-up is included with every scan. No extra fee, no extra step, one click fourteen days later.",
  cta: "Start my inspection",
  disclaimer:
    "Outcome data is used solely to improve the risk scan and dispute letter. It is not sold, not shared with landlords, never surfaced in a way that identifies a specific tenant.",
  home: "Home",
  pricing: "Pricing",
};

const FR: Copy = {
  metaTitle: "Suivi jusqu'au remboursement — Boucle de suivi Tenu.World",
  metaDescription:
    "Quatorze jours après l'envoi de la lettre, un courriel court demande si le dépôt a été restitué. Les données agrégées affinent l'analyse du locataire suivant.",
  eyebrow: "Fonctionnalité · Boucle de suivi",
  title: "Suivi jusqu'au remboursement",
  lede:
    "Quatorze jours après l'envoi de votre lettre, nous posons une question : votre dépôt vous est-il revenu. Votre réponse reste privée, l'agrégat rend le rapport du locataire suivant plus pointu.",
  howHeading: "Comment la boucle fonctionne",
  howSteps: [
    {
      title: "Jour 0 — lettre envoyée",
      body: "Vous marquez la lettre comme envoyée depuis votre tableau de bord Tenu. Le système enregistre la date et programme un suivi à quatorze jours.",
    },
    {
      title: "Jour 14 — un courriel",
      body: "Un courriel court avec trois boutons : dépôt intégralement restitué, partiellement restitué, rien restitué. Pas d'enquête, pas de questionnaire, pas de vente annexe.",
    },
    {
      title: "Réponse consignée",
      body: "Votre réponse est rattachée à l'analyse et à la lettre d'origine. Le détail est consultable dans votre tableau de bord ; l'enregistrement individuel n'est jamais partagé.",
    },
    {
      title: "L'agrégat nourrit le modèle",
      body: "Les résultats sont agrégés à travers l'ensemble des locataires et servent à ajuster les arguments que Claude Sonnet doit mettre en avant. Le locataire suivant en bénéficie ; votre dossier individuel ne quitte pas notre stockage européen.",
    },
  ],
  whyHeading: "Pourquoi cette boucle compte",
  whyBody:
    "Un moteur de scoring sans donnée de résultat est une estimation. Le suivi à quatorze jours ferme la boucle : il nous indique quelles lignes du rapport ont accompagné un remboursement, lesquelles un règlement partiel, lesquelles un refus. Au fil du temps, le modèle apprend quels arguments portent devant un bailleur français et lesquels glissent. Sans cette boucle, chaque inspection serait toujours la première.",
  dataHeading: "Ce qui est collecté, ce qui ne l'est pas",
  dataItems: [
    "Collecté : date d'envoi de la lettre, résultat (intégral / partiel / nul), montant recouvré si partiel.",
    "Non collecté : identité du bailleur, commentaire libre, seconde série de photos.",
    "Conservation : les données de résultat sont conservées trois ans pour amélioration produit, puis anonymisées.",
    "Désinscription : le courriel de suivi inclut un lien de désinscription en un clic. L'analyse déjà payée n'est pas affectée.",
  ],
  closingHeading: "Un courriel. Une réponse. Un rapport plus pointu pour le locataire suivant.",
  closingBody:
    "Le suivi est inclus dans chaque analyse. Aucun coût supplémentaire, aucune étape en plus, un clic quatorze jours plus tard.",
  cta: "Commencer mon inspection",
  disclaimer:
    "Les données de résultat servent uniquement à améliorer l'analyse et la lettre. Elles ne sont pas cédées, jamais partagées avec les bailleurs, jamais présentées d'une manière permettant d'identifier un locataire précis.",
  home: "Accueil",
  pricing: "Tarifs",
};

async function resolveCopy(): Promise<Copy> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLocale = cookieStore.get("locale")?.value;
  const locale = cookieLocale
    ? parseLocaleFromCookie(cookieLocale)
    : parseLocaleFromHeader(headerStore.get("accept-language") ?? undefined);
  return locale === "en" ? EN : FR;
}

export async function generateMetadata() {
  const c = await resolveCopy();
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function FollowupFeature() {
  const c = await resolveCopy();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <Link href="/" className="text-2xl font-bold text-tenu-forest">tenu</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-tenu-slate hover:text-tenu-forest">{c.home}</Link>
          <Link href="/pricing" className="text-tenu-slate hover:text-tenu-forest">{c.pricing}</Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="t-section-canvas px-6 text-center">
          <span className="t-label mb-5 inline-block text-tenu-accent">{c.eyebrow}</span>
          <h1 className="t-display mx-auto max-w-4xl">{c.title}</h1>
          <p className="t-body-muted mx-auto mt-6 max-w-2xl">{c.lede}</p>
        </section>

        <section className="t-section-band px-6 md:px-12">
          <div className="t-content max-w-3xl">
            <h2 className="t-section-heading mb-10">{c.howHeading}</h2>
            <ol className="space-y-8">
              {c.howSteps.map((s) => (
                <li key={s.title}>
                  <h3 className="t-h3">{s.title}</h3>
                  <p className="t-body mt-2">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="t-section-canvas px-6 md:px-12">
          <div className="t-content max-w-3xl">
            <h2 className="t-section-heading mb-4">{c.whyHeading}</h2>
            <p className="t-body">{c.whyBody}</p>
          </div>
        </section>

        <section className="t-section-band px-6 md:px-12">
          <div className="t-content max-w-3xl">
            <h2 className="t-section-heading mb-6">{c.dataHeading}</h2>
            <ul className="space-y-3 list-disc pl-6">
              {c.dataItems.map((d) => (
                <li key={d} className="t-body">{d}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="t-section-canvas px-6 md:px-12">
          <div className="t-content max-w-2xl text-center">
            <h2 className="t-section-heading mb-5">{c.closingHeading}</h2>
            <p className="t-body-muted mb-10">{c.closingBody}</p>
            <Link href="/inspection/new" className="t-cta-primary hig-press">{c.cta}</Link>
            <p className="mt-6 text-xs text-tenu-ink-muted">{c.disclaimer}</p>
          </div>
        </section>
      </main>

      <footer className="border-t t-hairline px-6 py-10 text-center text-sm text-tenu-ink-muted">
        <p>&copy; {new Date().getFullYear()} Global Apex NET (SAS, France). tenu.world</p>
      </footer>
    </div>
  );
}
