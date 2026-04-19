// /features/rights — "Know what's deductible" / "Ce qui est déductible, ce
// qui ne l'est pas". Grille de vétusté explained: décret 2016-382 and arrêté
// du 19 mars 2020. Three categories that decide every deposit dispute.
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { parseLocaleFromCookie, parseLocaleFromHeader } from "@/lib/i18n/server";

type Row = { item: string; wear: string; tenant: string };
type Copy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  lede: string;
  categoriesHeading: string;
  categories: { title: string; body: string }[];
  tableHeading: string;
  tableIntro: string;
  tableHeaders: { item: string; wear: string; tenant: string };
  rows: Row[];
  residualHeading: string;
  residualBody: string;
  closingHeading: string;
  closingBody: string;
  cta: string;
  disclaimer: string;
  home: string;
  pricing: string;
};

const EN: Copy = {
  metaTitle: "Know what's deductible from your deposit — Tenu.World",
  metaDescription:
    "What a French landlord can and cannot withhold from your deposit. Wear and tear versus damage, residual value, and the texts that govern each deduction.",
  eyebrow: "Feature · Deductibility",
  title: "Know what's deductible",
  lede:
    "Most deposit arguments come down to three categories: normal wear, tenant-caused damage, and lack of upkeep. The category decides the outcome.",
  categoriesHeading: "The three categories",
  categories: [
    {
      title: "Normal wear (vétusté) — not deductible",
      body: "Time passing. A kitchen four years old will show use. Paint fades, parquet dulls, a bathroom cabinet loses its edge. Décret n° 2016-382 defines vétusté as the natural use of the dwelling for its intended purpose. It cannot fund a deduction from your deposit.",
    },
    {
      title: "Damage caused by the tenant — deductible at residual value",
      body: "A cigarette burn, a pet's scratch on the floor, a hole drilled for a shelf mount. These are imputable to you. The landlord can deduct, but only the residual value of the affected element, not the replacement cost of a new one. Arrêté du 19 mars 2020 sets the lifespan of each component.",
    },
    {
      title: "Lack of upkeep — deductible if the duty was yours",
      body: "Décret n° 87-712 of 26 August 1987 lists the maintenance tasks that fall on the tenant: minor plumbing, replacing light bulbs, cleaning accessible gutters, maintaining working parts of the boiler. If the lease ends and one of these is conspicuously neglected, the landlord can deduct the cost of making good.",
    },
  ],
  tableHeading: "Common examples, three categories side by side",
  tableIntro:
    "Rules of thumb only. The exact answer depends on the age of the component, the entry état des lieux, and the arrêté du 19 mars 2020 scale.",
  tableHeaders: {
    item: "Item",
    wear: "Normal wear",
    tenant: "Tenant damage",
  },
  rows: [
    {
      item: "Wall paint, 4 years old",
      wear: "Fading, light marks. Not deductible.",
      tenant: "Deep scratches, unauthorised colour. Deductible, residual value only.",
    },
    {
      item: "Parquet",
      wear: "Loss of shine, fine scratches. Not deductible.",
      tenant: "Dents from dropped weights, stains from liquid. Deductible.",
    },
    {
      item: "Kitchen worktop",
      wear: "Minor scratches from daily use. Not deductible.",
      tenant: "Burn marks from a hot pan, knife cuts. Deductible.",
    },
    {
      item: "Bathroom seals",
      wear: "Natural yellowing. Not deductible.",
      tenant: "Mould from unventilated bathing. Deductible under upkeep duty.",
    },
    {
      item: "Interior door",
      wear: "Usage marks around the handle. Not deductible.",
      tenant: "Holes, broken panels. Deductible.",
    },
    {
      item: "Electrical sockets",
      wear: "Discolouration. Not deductible.",
      tenant: "Cracked plate, missing screws. Deductible.",
    },
    {
      item: "White goods provided with furnished lease",
      wear: "Normal end-of-life after service duration. Not deductible.",
      tenant: "Damage from misuse. Deductible.",
    },
  ],
  residualHeading: "Residual value, not replacement cost",
  residualBody:
    "A repainted wall has a lifespan of around seven years. If the tenant damages it after four, the residual value is roughly three sevenths of the repainting cost, not the full quote. The same proportion applies to most fixtures. A landlord who invoices the full replacement cost is overclaiming, and the conciliation commission will say so.",
  closingHeading: "Read the invoice before you pay.",
  closingBody:
    "Tenu applies the arrêté du 19 mars 2020 scale automatically, line by line, so you know which items the landlord can legitimately deduct and which cannot.",
  cta: "Scan my photos",
  disclaimer:
    "The arrêté du 19 mars 2020 provides a reference framework, not an automatic right. Each claim still depends on the facts and on the contradictoire état des lieux.",
  home: "Home",
  pricing: "Pricing",
};

const FR: Copy = {
  metaTitle: "Ce qui est déductible de votre dépôt de garantie — Tenu.World",
  metaDescription:
    "Ce qu'un bailleur français peut et ne peut pas retenir sur votre dépôt. Vétusté, dégradations imputables, défaut d'entretien, valeur résiduelle et textes applicables.",
  eyebrow: "Fonctionnalité · Ce qui est déductible",
  title: "Ce qui est déductible, ce qui ne l'est pas",
  lede:
    "La plupart des litiges sur dépôt de garantie tiennent à trois catégories : usure normale, dégradation imputable, défaut d'entretien. La catégorie détermine l'issue.",
  categoriesHeading: "Les trois catégories",
  categories: [
    {
      title: "Usure normale (vétusté) — non déductible",
      body: "Le temps qui passe. Une cuisine de quatre ans portera les traces d'un usage conforme. La peinture s'éclaircit, le parquet se patine, un meuble de salle de bain perd son tranchant. Le décret n° 2016-382 définit la vétusté comme l'usage normal du logement selon sa destination. Elle ne peut pas justifier une retenue sur le dépôt.",
    },
    {
      title: "Dégradation imputable — déductible à la valeur résiduelle",
      body: "Une brûlure de cigarette, une griffure d'animal sur le parquet, un trou percé pour une étagère : ce sont des dégradations imputables. Le bailleur peut retenir, mais uniquement la valeur résiduelle de l'élément, non le coût d'un remplacement à neuf. L'arrêté du 19 mars 2020 fixe la durée de vie de chaque composant.",
    },
    {
      title: "Défaut d'entretien — déductible si l'entretien vous incombait",
      body: "Le décret n° 87-712 du 26 août 1987 énumère les tâches d'entretien à la charge du locataire : petite plomberie, changement d'ampoules, entretien des gouttières accessibles, maintien en état des parties accessibles de la chaudière. Si l'un de ces éléments est manifestement négligé en fin de bail, le bailleur peut retenir le coût de remise en état.",
    },
  ],
  tableHeading: "Exemples courants, trois colonnes",
  tableIntro:
    "Règles indicatives. La réponse précise dépend de l'âge du composant, de l'état des lieux d'entrée et du barème de l'arrêté du 19 mars 2020.",
  tableHeaders: {
    item: "Élément",
    wear: "Usure normale",
    tenant: "Dégradation imputable",
  },
  rows: [
    {
      item: "Peinture murale, 4 ans",
      wear: "Jaunissement, marques légères. Non déductible.",
      tenant: "Rayures profondes, couleur non autorisée. Déductible, à la valeur résiduelle.",
    },
    {
      item: "Parquet",
      wear: "Perte de brillant, micro-rayures. Non déductible.",
      tenant: "Impacts de chute, taches de liquide. Déductible.",
    },
    {
      item: "Plan de travail cuisine",
      wear: "Micro-rayures d'usage quotidien. Non déductible.",
      tenant: "Brûlures par plat chaud, entailles de couteau. Déductible.",
    },
    {
      item: "Joints de salle de bain",
      wear: "Jaunissement naturel. Non déductible.",
      tenant: "Moisissures liées à l'absence d'aération. Déductible au titre de l'entretien.",
    },
    {
      item: "Porte intérieure",
      wear: "Traces d'usage autour de la poignée. Non déductible.",
      tenant: "Trous, panneaux brisés. Déductible.",
    },
    {
      item: "Prises électriques",
      wear: "Décoloration. Non déductible.",
      tenant: "Plaque fissurée, visserie manquante. Déductible.",
    },
    {
      item: "Électroménager fourni en meublé",
      wear: "Fin de vie normale au terme de la durée de service. Non déductible.",
      tenant: "Dégât lié à un usage abusif. Déductible.",
    },
  ],
  residualHeading: "Valeur résiduelle, jamais coût de remplacement à neuf",
  residualBody:
    "Une peinture murale a une durée de vie d'environ sept ans. Si le locataire la dégrade après quatre ans, la valeur résiduelle représente trois septièmes du coût de remise en peinture, non la facture complète. La même logique s'applique à la plupart des équipements. Un bailleur qui facture le remplacement à neuf surfacture, et la commission de conciliation le relèvera.",
  closingHeading: "Vérifiez la facture avant de régler.",
  closingBody:
    "Tenu applique automatiquement le barème de l'arrêté du 19 mars 2020, poste par poste, afin d'identifier ce que le bailleur peut légitimement retenir et ce qui doit vous revenir.",
  cta: "Analyser mes photos",
  disclaimer:
    "L'arrêté du 19 mars 2020 fournit un cadre de référence, non un droit automatique. Chaque retenue reste tributaire des faits et de l'état des lieux contradictoire.",
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

export default async function RightsFeature() {
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
            <h2 className="t-section-heading mb-8">{c.categoriesHeading}</h2>
            <div className="grid gap-6">
              {c.categories.map((cat) => (
                <div key={cat.title} className="t-card">
                  <h3 className="t-h3 mb-2">{cat.title}</h3>
                  <p className="t-body">{cat.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="t-section-canvas px-6 md:px-12">
          <div className="t-content max-w-4xl">
            <h2 className="t-section-heading mb-3">{c.tableHeading}</h2>
            <p className="t-body-muted mb-8">{c.tableIntro}</p>
            <div className="overflow-x-auto rounded-xl border border-tenu-cream-dark bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-tenu-cream/60 text-tenu-forest">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{c.tableHeaders.item}</th>
                    <th className="px-4 py-3 font-semibold">{c.tableHeaders.wear}</th>
                    <th className="px-4 py-3 font-semibold">{c.tableHeaders.tenant}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.rows.map((r) => (
                    <tr key={r.item} className="border-t border-tenu-cream-dark align-top">
                      <td className="px-4 py-3 font-medium">{r.item}</td>
                      <td className="px-4 py-3 text-tenu-slate">{r.wear}</td>
                      <td className="px-4 py-3 text-tenu-slate">{r.tenant}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="t-section-band px-6 md:px-12">
          <div className="t-content max-w-3xl">
            <h2 className="t-section-heading mb-4">{c.residualHeading}</h2>
            <p className="t-body">{c.residualBody}</p>
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
