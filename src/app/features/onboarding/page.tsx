// /features/onboarding — "Know your rights before you move in" / "Connaître
// vos droits avant d'emménager". Ten non-negotiable facts under Loi 89-462.
// Server component, EN + FR only. Non-FR locales fall back to EN.
import { cookies, headers } from "next/headers";
import Link from "next/link";
import Script from "next/script";
import { parseLocaleFromCookie, parseLocaleFromHeader } from "@/lib/i18n/server";

type Copy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  lede: string;
  sectionHeading: string;
  facts: { title: string; body: string }[];
  closingHeading: string;
  closingBody: string;
  cta: string;
  disclaimer: string;
  home: string;
  pricing: string;
};

const EN: Copy = {
  metaTitle: "Know your rights before you move in — Tenu.World",
  metaDescription:
    "Ten legal facts every tenant signing a French lease should know. Deposit cap, état des lieux, notice periods, refund deadlines. Grounded in Loi 89-462.",
  eyebrow: "Feature · Rights onboarding",
  title: "Know your rights before you move in",
  lede:
    "Ten facts about your French lease, written in plain language. You read them on day one, not after the dispute starts.",
  sectionHeading: "The ten facts",
  facts: [
    {
      title: "1. The deposit is capped by law.",
      body: "One month's rent excluding charges for an unfurnished lease, two months for a furnished lease. Reference: article 22 of Loi n° 89-462 of 6 July 1989. Any clause demanding more is void.",
    },
    {
      title: "2. The entry état des lieux is compulsory.",
      body: "It must be signed by both parties and attached to the lease. Reference: article 3-2 of Loi 89-462. Without it, the tenant is presumed to have received the dwelling in good condition, which is bad for you at exit.",
    },
    {
      title: "3. You have a full month to add observations.",
      body: "Heating issues noticed during the first cold spell, damp behind a wardrobe, a broken socket. Send a registered letter within thirty days and the landlord must amend the entry état des lieux.",
    },
    {
      title: "4. The deposit must be returned within one or two months.",
      body: "One month if no deduction is claimed, two months if the landlord claims any deduction. Counted from key return, not from the end of the lease. Delay costs the landlord 10 % of the monthly rent per month of delay.",
    },
    {
      title: "5. Normal wear cannot be deducted.",
      body: "A scuffed wall, a slightly worn parquet, faded paintwork after four years: these are vétusté, not dégâts. Only damage caused by the tenant, or a genuine lack of upkeep, can be deducted, and only at residual value. Reference: décret 2016-382 and arrêté du 19 mars 2020.",
    },
    {
      title: "6. Small repairs are yours, capital repairs are the landlord's.",
      body: "Décret n° 87-712 of 26 August 1987 lists the menues réparations payable by the tenant: changing light bulbs, cleaning accessible gutters, replacing a door handle. Anything structural, including failing plumbing or a dead boiler, is the landlord's cost.",
    },
    {
      title: "7. Notice periods depend on the lease and the city.",
      body: "Unfurnished in a non-strained zone: three months. Unfurnished in a zone tendue (Paris, Lyon, Bordeaux, most of Île-de-France): one month. Furnished: one month everywhere. Send notice by registered letter, by bailiff, or by hand with a signed receipt.",
    },
    {
      title: "8. The landlord cannot walk in.",
      body: "Visits for works or a sale must be agreed in advance, for a maximum of two hours a day, never on Sundays or public holidays. Reference: article 4 f) of Loi 89-462. A landlord who enters without consent commits a violation of domicile.",
    },
    {
      title: "9. Some clauses are void even if you signed.",
      body: "A clause forbidding you from hosting relatives, banning pets in an unfurnished lease, or requiring rent by automatic transfer only, has no legal effect. Article 4 of Loi 89-462 lists them.",
    },
    {
      title: "10. You have the right to a lease in French.",
      body: "The contract governing you is the French version. A translation provided by the landlord is a courtesy, never a substitute. If the French text is unclear, article 1190 of the Code civil reads it in favour of the party who did not draft it. That is usually you.",
    },
  ],
  closingHeading: "Read these before you sign, not after the dispute.",
  closingBody:
    "Tenu gives you the ten facts above on day one of your lease, with the exact statute reference for each.",
  cta: "Start my inspection",
  disclaimer:
    "These facts summarise French law as at 2026. They are not legal advice. For a binding opinion, consult a qualified avocat or the ADIL in your department.",
  home: "Home",
  pricing: "Pricing",
};

const FR: Copy = {
  metaTitle: "Connaître vos droits avant d'emménager — Tenu.World",
  metaDescription:
    "Dix faits juridiques que tout locataire signant un bail français doit connaître. Plafond du dépôt, état des lieux, préavis, délais de restitution. Fondé sur la loi du 6 juillet 1989.",
  eyebrow: "Fonctionnalité · Vos droits dès l'entrée",
  title: "Connaître vos droits avant d'emménager",
  lede:
    "Dix faits sur votre bail français, en langage clair. Vous les lisez le jour de la signature, pas lorsque le litige commence.",
  sectionHeading: "Les dix faits",
  facts: [
    {
      title: "1. Le dépôt de garantie est plafonné par la loi.",
      body: "Un mois de loyer hors charges pour un bail vide, deux mois pour un bail meublé. Référence : article 22 de la loi n° 89-462 du 6 juillet 1989. Toute clause exigeant davantage est réputée non écrite.",
    },
    {
      title: "2. L'état des lieux d'entrée est obligatoire.",
      body: "Il doit être signé contradictoirement et annexé au bail. Référence : article 3-2 de la loi du 6 juillet 1989. À défaut, le locataire est présumé avoir reçu le logement en bon état, ce qui vous dessert à la sortie.",
    },
    {
      title: "3. Vous disposez d'un mois complet pour compléter l'état des lieux.",
      body: "Problème de chauffage constaté au premier froid, traces d'humidité derrière un meuble, prise électrique défectueuse : envoyez une lettre recommandée sous trente jours et le bailleur est tenu d'amender l'état des lieux d'entrée.",
    },
    {
      title: "4. Le dépôt doit être restitué sous un ou deux mois.",
      body: "Un mois si aucune retenue n'est opposée, deux mois si le bailleur invoque une retenue. Le délai court à compter de la restitution des clés, non de la fin du bail. Tout retard produit une majoration de 10 % du loyer mensuel par mois de retard.",
    },
    {
      title: "5. L'usure normale n'est pas déductible.",
      body: "Un mur légèrement marqué, un parquet patiné, une peinture fanée après quatre ans : c'est de la vétusté, non des dégradations. Seuls les dégâts imputables au locataire ou le défaut d'entretien caractérisé peuvent être retenus, et uniquement à la valeur résiduelle. Référence : décret n° 2016-382 et arrêté du 19 mars 2020.",
    },
    {
      title: "6. Les menues réparations vous incombent, les grosses réparations relèvent du bailleur.",
      body: "Le décret n° 87-712 du 26 août 1987 énumère les menues réparations à la charge du locataire : remplacement d'ampoules, entretien des gouttières accessibles, changement d'une poignée de porte. Tout ce qui est structurel, plomberie défaillante ou chaudière hors d'usage, reste à la charge du bailleur.",
    },
    {
      title: "7. Le préavis dépend du bail et de la commune.",
      body: "Bail vide hors zone tendue : trois mois. Bail vide en zone tendue (Paris, Lyon, Bordeaux, la plus grande partie de l'Île-de-France) : un mois. Bail meublé : un mois partout. Le congé se notifie par lettre recommandée avec accusé de réception, par acte de commissaire de justice, ou remise en main propre contre émargement.",
    },
    {
      title: "8. Le bailleur ne peut pas entrer sans votre accord.",
      body: "Les visites pour travaux ou vente doivent être convenues à l'avance, dans la limite de deux heures par jour, jamais le dimanche ni les jours fériés. Référence : article 4 f) de la loi du 6 juillet 1989. Un bailleur qui entre sans votre accord commet une violation de domicile.",
    },
    {
      title: "9. Certaines clauses sont réputées non écrites, même signées.",
      body: "La clause interdisant d'héberger ses proches, prohibant la détention d'un animal dans un bail vide, ou imposant le prélèvement automatique comme seul mode de paiement n'a aucun effet juridique. L'article 4 de la loi du 6 juillet 1989 les énumère.",
    },
    {
      title: "10. Vous avez droit à un bail en français.",
      body: "Le contrat qui vous lie est la version française. Une traduction fournie par le bailleur est une commodité, jamais un substitut. En cas d'ambiguïté du texte français, l'article 1190 du Code civil l'interprète en faveur de la partie qui n'a pas rédigé le contrat. Il s'agit généralement de vous.",
    },
  ],
  closingHeading: "Lisez-les avant de signer, pas une fois le litige ouvert.",
  closingBody:
    "Tenu vous remet ces dix faits dès le premier jour de votre bail, avec la référence précise de chaque texte.",
  cta: "Commencer mon inspection",
  disclaimer:
    "Ces faits résument le droit français applicable au 18 avril 2026. Ils ne constituent pas un conseil juridique. Pour un avis opposable, consultez un avocat ou l'ADIL de votre département.",
  home: "Accueil",
  pricing: "Tarifs",
};

export async function generateMetadata() {
  const copy = await resolveCopy();
  return { title: copy.metaTitle, description: copy.metaDescription };
}

async function resolveCopy(): Promise<Copy> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLocale = cookieStore.get("locale")?.value;
  const locale = cookieLocale
    ? parseLocaleFromCookie(cookieLocale)
    : parseLocaleFromHeader(headerStore.get("accept-language") ?? undefined);
  return locale === "fr" ? FR : EN;
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the maximum deposit a French landlord can ask for?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "One month's rent excluding charges for an unfurnished lease, two months for a furnished lease. Article 22 of Loi 89-462. A demand above this cap is unlawful.",
      },
    },
    {
      "@type": "Question",
      name: "How long does a French landlord have to return the deposit?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "One month if the exit état des lieux matches the entry état des lieux, two months if any deduction is claimed. Beyond that, the sum bears interest at 10% of the monthly rent per month of delay.",
      },
    },
  ],
};

export default async function OnboardingFeature() {
  const c = await resolveCopy();
  return (
    <div className="flex min-h-screen flex-col">
      <Script
        id="ld-faq-onboarding"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

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
            <h2 className="t-section-heading mb-8">{c.sectionHeading}</h2>
            <ol className="space-y-8">
              {c.facts.map((f) => (
                <li key={f.title}>
                  <h3 className="t-h3">{f.title}</h3>
                  <p className="t-body mt-2">{f.body}</p>
                </li>
              ))}
            </ol>
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
