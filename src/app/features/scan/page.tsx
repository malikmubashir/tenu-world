// /features/scan — "Two minutes to clarity" / "Deux minutes pour y voir clair".
// The AI pipeline explained without the hype: Haiku vision + grille de vétusté
// + €0.12 call cap + zod-validated JSON. What the output contains, what it
// does not do.
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { parseLocaleFromCookie, parseLocaleFromHeader } from "@/lib/i18n/server";

type Copy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineHeading: string;
  steps: { title: string; body: string }[];
  outputHeading: string;
  outputBody: string;
  outputFields: string[];
  limitsHeading: string;
  limits: string[];
  closingHeading: string;
  closingBody: string;
  cta: string;
  disclaimer: string;
  home: string;
  pricing: string;
};

const EN: Copy = {
  metaTitle: "Two minutes to clarity — Tenu.World AI risk scan",
  metaDescription:
    "How the Tenu AI risk scan works. Claude Haiku reads your photos, applies the French wear-and-tear scale, returns a structured JSON report in under two minutes.",
  eyebrow: "Feature · AI risk scan",
  title: "Two minutes to clarity",
  lede:
    "Upload your photos. An AI model reads them room by room, applies the French wear-and-tear scale, and tells you what a landlord can legitimately deduct and what falls outside the scope.",
  pipelineHeading: "How it works",
  steps: [
    {
      title: "1. Upload",
      body: "Photos are hashed client-side and uploaded to Cloudflare R2 in the EU. No image is resized or re-encoded during upload; the original file reaches storage intact.",
    },
    {
      title: "2. Model call",
      body: "Claude Haiku reads each photo with a French-language prompt that references the arrêté du 19 mars 2020. The call is server-side only; the API key never touches your browser. Typical cost: €0.12 per inspection, hard-capped by the server.",
    },
    {
      title: "3. Structured output",
      body: "The model returns JSON, not prose. Each room gets a risk score, a list of observed elements, and a reference to the relevant component in the wear-and-tear scale. A zod schema validates the output; malformed responses trigger a silent retry, then a fallback to a larger model.",
    },
    {
      title: "4. Report",
      body: "The JSON is rendered as a branded PDF, generated in-code with @react-pdf/renderer. Each room has its own page, each photo is embedded with its hash and timestamp. Total latency: under two minutes on a standard connection.",
    },
  ],
  outputHeading: "What the report contains",
  outputBody:
    "The report is structured so you can read it in three minutes and a conciliator can read it in ten. Each line item carries the underlying reasoning.",
  outputFields: [
    "Per-room risk score (0 to 100), with the single most relevant observation.",
    "Per-item classification: normal wear, tenant damage, upkeep duty, inconclusive.",
    "Residual-value estimate for items the model flags as deductible.",
    "Reference to the component's entry in the arrêté du 19 mars 2020 scale.",
    "List of photos the model relied on, with their SHA-256 fingerprints.",
    "Overall verdict: likely refund, partial, or high-risk.",
  ],
  limitsHeading: "What the scan does not do",
  limits: [
    "It does not replace a human expert. It surfaces what a trained reader would see in a photo; it does not visit the dwelling.",
    "It cannot score what it cannot see. Blurry photos, missing rooms, or shots taken in the dark lead to inconclusive entries. The report flags them explicitly.",
    "It is not a legal opinion. The verdict orients the decision, it does not prejudge it.",
  ],
  closingHeading: "Two minutes, one clear answer.",
  closingBody:
    "Upload your photos. Read the preview. Decide whether the full scan is worth running. Payment is upfront on the tier of your dwelling.",
  cta: "Start my inspection",
  disclaimer:
    "AI output is probabilistic by nature. Tenu uses a validated schema and a retry chain to reduce error, but no model is infallible. Always read the report critically before acting on it.",
  home: "Home",
  pricing: "Pricing",
};

const FR: Copy = {
  metaTitle: "Deux minutes pour y voir clair — Analyse IA Tenu.World",
  metaDescription:
    "Comment fonctionne l'analyse IA Tenu. Claude Haiku lit vos photos, applique le barème de vétusté français et renvoie un rapport structuré en moins de deux minutes.",
  eyebrow: "Fonctionnalité · Analyse IA",
  title: "Deux minutes pour y voir clair",
  lede:
    "Vous téléversez vos photos. Un modèle d'IA les lit pièce par pièce, applique le barème français de vétusté, et vous indique ce que le bailleur peut légitimement retenir et ce qui sort du champ.",
  pipelineHeading: "Comment ça fonctionne",
  steps: [
    {
      title: "1. Téléversement",
      body: "Les photos sont hachées côté client puis transférées chez Cloudflare R2 en région UE. Aucune image n'est redimensionnée ni réencodée lors du téléversement ; le fichier original parvient au stockage intact.",
    },
    {
      title: "2. Appel au modèle",
      body: "Claude Haiku lit chaque photo avec un prompt en français qui fait référence à l'arrêté du 19 mars 2020. L'appel est strictement côté serveur ; la clé d'API ne transite jamais par le navigateur. Coût typique : 0,12 € par inspection, plafonné durement côté serveur.",
    },
    {
      title: "3. Sortie structurée",
      body: "Le modèle renvoie du JSON, jamais de la prose. Chaque pièce reçoit un score de risque, la liste des éléments observés, et la référence du poste concerné au barème de vétusté. Un schéma zod valide la sortie ; un format incorrect déclenche un rejeu silencieux, puis un repli sur un modèle supérieur.",
    },
    {
      title: "4. Rapport",
      body: "Le JSON est rendu sous forme de PDF à l'identité Tenu, généré dans l'application avec @react-pdf/renderer. Chaque pièce dispose de sa page, chaque photo est intégrée avec son empreinte et son horodatage. Latence totale : moins de deux minutes sur une connexion standard.",
    },
  ],
  outputHeading: "Ce que contient le rapport",
  outputBody:
    "Le rapport est conçu pour être lu en trois minutes par vous et en dix minutes par un conciliateur. Chaque ligne porte le raisonnement sous-jacent.",
  outputFields: [
    "Score de risque par pièce (0 à 100), accompagné de l'observation la plus déterminante.",
    "Classification par élément : usure normale, dégradation imputable, défaut d'entretien, non conclusif.",
    "Estimation de valeur résiduelle pour les éléments retenus comme déductibles.",
    "Référence du poste concerné au barème de l'arrêté du 19 mars 2020.",
    "Liste des photos exploitées, avec leurs empreintes SHA-256.",
    "Verdict global : remboursement probable, partiel, ou à risque élevé.",
  ],
  limitsHeading: "Ce que l'analyse ne fait pas",
  limits: [
    "Elle ne remplace pas un expert humain. Elle fait ressortir ce qu'un lecteur entraîné observerait sur une photo ; elle ne se déplace pas dans le logement.",
    "Elle ne peut évaluer ce qu'elle ne voit pas. Photos floues, pièces manquantes, prises de vue dans l'obscurité donnent des lignes non conclusives. Le rapport les signale explicitement.",
    "Elle n'est pas un avis juridique. Le verdict oriente la décision, il ne la préjuge pas.",
  ],
  closingHeading: "Deux minutes, une réponse claire.",
  closingBody:
    "Téléversez vos photos. Lisez l'aperçu. Décidez si l'analyse complète vaut la peine. Le paiement se fait d'avance, au tarif correspondant à votre logement.",
  cta: "Commencer mon inspection",
  disclaimer:
    "La sortie d'une IA est par nature probabiliste. Tenu utilise un schéma validé et une chaîne de rejeu pour limiter l'erreur, mais aucun modèle n'est infaillible. Lisez toujours le rapport avec discernement avant d'agir.",
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

export default async function ScanFeature() {
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
            <h2 className="t-section-heading mb-10">{c.pipelineHeading}</h2>
            <ol className="space-y-8">
              {c.steps.map((s) => (
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
            <h2 className="t-section-heading mb-4">{c.outputHeading}</h2>
            <p className="t-body mb-6">{c.outputBody}</p>
            <ul className="space-y-3 list-disc pl-6">
              {c.outputFields.map((f) => (
                <li key={f} className="t-body">{f}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="t-section-band px-6 md:px-12">
          <div className="t-content max-w-3xl">
            <h2 className="t-section-heading mb-6">{c.limitsHeading}</h2>
            <ul className="space-y-3 list-disc pl-6">
              {c.limits.map((l) => (
                <li key={l} className="t-body">{l}</li>
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
