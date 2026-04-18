// /stories/samir — "Samir, from Algiers to Toulouse" / "Samir, d'Alger à
// Toulouse". Long-form use case. Composite built from expatriate bank and
// corporate postings of 2 to 3 years in Occitanie. Every failure point is
// mapped to the Tenu feature that would have caught it, with a direct
// link across. Professional services register. Not a testimonial.
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { parseLocaleFromCookie, parseLocaleFromHeader } from "@/lib/i18n/server";
import OtherCases from "@/components/stories/OtherCases";

type Mapping = { moment: string; pain: string; remedy: string; href: string; remedyLabel: string };
type Copy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  lede: string;
  disclaimer: string;
  acts: { heading: string; paragraphs: string[] }[];
  mappingHeading: string;
  mappingIntro: string;
  mappings: Mapping[];
  verdictHeading: string;
  verdictBody: string;
  closingHeading: string;
  closingBody: string;
  cta: string;
  home: string;
  pricing: string;
};

const EN: Copy = {
  metaTitle: "Samir, from Algiers to Toulouse — a Tenu.World use case",
  metaDescription:
    "A composite use case of a senior banker on a three-year expatriation in Toulouse who left France without entry or exit photos. His 2,000 EUR deposit was kept and he was billed a further 2,500 EUR. What Tenu would have done.",
  eyebrow: "Use case · Expatriate professional · Occitanie",
  title: "Samir, from Algiers to Toulouse",
  lede:
    "Samir is a composite. His name is fictitious, the facts are assembled from relocation files we have seen. The arc is typical of expatriate professionals who rent a family home in France for the length of a posting and discover, after boarding the flight home, that the deposit was never the real risk.",
  disclaimer:
    "No real tenant is depicted. Facts, dwellings and sums are illustrative. The legal references are accurate as at 18 April 2026.",
  acts: [
    {
      heading: "Act 1 — The posting, and the twenty-minute signature",
      paragraphs: [
        "Samir accepted an expatriation offer from his bank's French subsidiary: three years in Toulouse, credit risk oversight, his family following in September. Wife, two boys, one daughter. The corporate relocation consultant produced three shortlisted dwellings the week before they flew. Samir chose a pavillon of four bedrooms on the north side of the city, unfurnished, €2,000 a month, quiet street, walking distance to a bilingual school.",
        "The landlord was an elderly former accountant who owned the house outright and had rented it to one family after another for twenty years. He had a single-page handwritten entry état des lieux folded inside the bail. Twenty-five lines, all ticked «bon état». Walls: «peinture blanche, état d'usage». Floors: «parquet, état d'usage». Kitchen: «équipement en ordre de marche». Samir read it in under a minute, signed each page and transferred €2,000 as dépôt de garantie.",
        "No one photographed anything. The relocation consultant treated the EDL as a paperwork step, not a piece of evidence. Samir was in corporate handover mode, his wife was managing the school enrolment, the kids wanted the wifi password. Two hours later the movers arrived. The house was his.",
      ],
    },
    {
      heading: "Act 2 — Three years of a family of five",
      paragraphs: [
        "The family lived the house normally. Three children aged four, six and eight left the traces a family of five leaves on painted walls over three years: scuffs along the stair rail, crayon on one kitchen wall wiped with a magic eraser but still faintly visible, a dent behind the youngest's bedroom door. A single parquet board near the kitchen developed a darker patch where a radiator had occasionally leaked in winter. The bathroom tap began to drip in the second year; Samir reported it to the landlord by SMS. No reply.",
        "He never learned that French law gives a tenant thirty days after entry to file written observations on the EDL. He never learned that wall paint has a seven-year vétusté under the arrêté du 19 mars 2020, which means after five years of occupation the landlord cannot charge the tenant anything to repaint. He never learned that «état d'usage» in a handwritten document, unsupported by photographs, is a phrase that collapses the moment a tenant contests a specific line.",
        "The bank's HR pack did not include any of this. The relocation consultant had not been briefed on état des lieux law. The bailleur had no incentive to volunteer it. Samir lived his three years.",
      ],
    },
    {
      heading: "Act 3 — The exit, the flight, and the bill that arrived in Algiers",
      paragraphs: [
        "The assignment ended in late August. The family flew to Algiers on the evening of the exit. The bailleur and his adult son arrived that morning to walk the house with Samir. Twenty-five minutes, no photographs, a one-page handwritten exit EDL with four catch-all entries: «murs à rafraîchir», «parquet à poncer et revernir», «plaque de cuisson à vérifier», «ménage de fin à reprendre». Samir signed because the taxi was waiting and the boarding time was seven hours away. The keys changed hands. He left France.",
        "One week later, the bailleur's email arrived. Four attached devis. Repainting of the entire house: €3,200. Deep cleaning: €600. Replacement of the kitchen hob on grounds of «non-functional»: €450. Parquet sanding and re-varnishing of two rooms: €250. Total reclaimed: €4,500. The €2,000 deposit was retained. The balance of €2,500 was due within fifteen days, to be wired to the bailleur's IBAN, failing which a procedure would be engaged with the tribunal judiciaire de Toulouse.",
        "From Algiers, Samir had nothing. No entry photographs. No exit photographs. No serial number or date of installation for the hob. No contradictory wording in the exit EDL, because the catch-all phrases he signed gave the bailleur a free hand. The only written record, «bon état général» on entry, helped the bailleur, not him. He spent the next week emailing his former HR contact and a French housing union. Both replied with the same sentence: without photographs at entry and exit, the case is difficult.",
      ],
    },
  ],
  mappingHeading: "What Tenu would have done, moment by moment",
  mappingIntro:
    "Each failure in the story above corresponds to a feature that exists today. The product is designed around exactly these moments, and expatriate professionals are the single cohort where the bill on exit most often exceeds the deposit itself.",
  mappings: [
    {
      moment: "Day of the signature",
      pain: "Samir signed a handwritten EDL in twenty minutes, with the catch-all «bon état général», no photographs, no understanding that his thirty-day observation window had started running.",
      remedy:
        "Tenu's onboarding delivers the ten non-negotiable facts of a French lease in the tenant's own language on day one: deposit cap (one month unfurnished), thirty-day observation window, vétusté scale per material, void-clause list, return deadline and interest rate. Samir would have known the landlord carries the burden of proof on the prior state of the dwelling before the keys changed hands.",
      remedyLabel: "Read: Know your rights before you move in",
      href: "/features/onboarding",
    },
    {
      moment: "First week in the house",
      pain: "The pre-existing scuffs, the decade-old hob, the parquet board already darker near the radiator: none of it was photographed. Everything visible at entry could later be billed as if Samir had caused it.",
      remedy:
        "Tenu's guided evidence bundle asks the tenant to photograph every room, every wall and every equipment piece at entry. Each image is hashed (SHA-256), its EXIF is preserved, a server timestamp is recorded, the file is stored encrypted in the EU. Three years later at the exit, Tenu produces the bundle on demand for the conciliation commission. Anything present at entry cannot be billed as tenant damage.",
      remedyLabel: "Read: Evidence that holds up in mediation",
      href: "/features/evidence",
    },
    {
      moment: "Day of the exit état des lieux",
      pain: "The exit EDL used vague catch-all phrases: «murs à rafraîchir», «plaque à vérifier», «ménage à reprendre». Each phrase is a blank cheque. Samir signed under time pressure. He could not distinguish vétusté (uncharged by law) from dégradation imputable (charged at residual value only).",
      remedy:
        "Tenu's AI risk scan reads entry and exit photos and returns a line-by-line verdict under the arrêté du 19 mars 2020. For this case: full repaint is excluded, because paint reaches one hundred percent vétusté at seven years and the family occupied the house for three, leaving at most a fractional residual share of a single wall. The kitchen hob, if installed before the tenancy began, has near-zero residual value. Parquet sanding across two rooms for one darker board is disproportionate under the grille. Defensible retention by the landlord: around €200 to €300, not €4,500.",
      remedyLabel: "Read: Two minutes to clarity",
      href: "/features/scan",
    },
    {
      moment: "The email that arrived in Algiers",
      pain: "The bill landed one week after the flight. Samir was across the Mediterranean, outside France, with no evidence, no local counsel on retainer and a fifteen-day ultimatum. Most expatriates in that position pay the balance to avoid a French court summons at a former address.",
      remedy:
        "Tenu produces a formal dispute letter in French, CDC format, grounded on article 22 of loi 89-462, article 1353 of the Code civil (burden of proof on the party claiming damage), and the arrêté du 19 mars 2020 wear-and-tear scale. The letter challenges each devis line on its own terms: paint on vétusté, hob on residual value, parquet on proportionality, cleaning on quantified defensibility. Delivery by registered post from Algiers with international acknowledgement of receipt, ten euros, two days. Ten percent interest on the monthly rent begins accruing from the date the deposit was due.",
      remedyLabel: "Read: A letter that defends itself",
      href: "/features/dispute",
    },
    {
      moment: "Two weeks after the letter leaves",
      pain: "An expatriate, once home, tends to stop following. The case goes quiet. The landlord banks the deposit and the extra €2,500 by default.",
      remedy:
        "Tenu's fourteen-day outcome loop asks the single question: did the deposit come back. If not, Tenu provides the template to seize the Commission départementale de conciliation de la Haute-Garonne, a free written procedure accessible from abroad. The aggregate outcome data sharpens the next expatriate's file. Samir's individual record never leaves EU storage.",
      remedyLabel: "Read: Follow through to refund",
      href: "/features/followup",
    },
  ],
  verdictHeading: "The counterfactual",
  verdictBody:
    "Had Samir used Tenu at entry, the photo bundle alone would have shifted the evidentiary weight. Pre-existing wall scuffs, a ten-year-old hob, a darker parquet board near a leaking radiator: each one visible on a timestamped file from the week he moved in. At exit, the scan would have produced a written verdict of around €250 defensible retention, against which the dispute letter would have pinned every devis line. Realistic outcome: €1,700 deposit returned and the €2,500 supplementary claim withdrawn. Actual outcome, in the absence of Tenu: €4,500 out of pocket and a pointed correspondence with HR on the way out of the bank.",
  closingHeading: "Expatriate postings carry the heaviest exit bills in France. The inspection starts the day the keys change hands.",
  closingBody:
    "Thirty-five euros for a T5 or maison. No subscription. Payment upfront, consumer withdrawal right waived at checkout, refund if the service cannot be rendered. If the bank covers the scan on the mobility budget, it pays for itself against a single contested devis line.",
  cta: "Start my inspection",
  home: "Home",
  pricing: "Pricing",
};

const FR: Copy = {
  metaTitle: "Samir, d'Alger à Toulouse — un cas d'usage Tenu.World",
  metaDescription:
    "Cas d'usage composite d'un cadre bancaire en expatriation de trois ans à Toulouse, parti sans photos d'entrée ni de sortie. Sa caution de 2 000 € a été retenue et 2 500 € supplémentaires lui ont été réclamés. Ce que Tenu aurait fait.",
  eyebrow: "Cas d'usage · Cadre expatrié · Occitanie",
  title: "Samir, d'Alger à Toulouse",
  lede:
    "Samir est un personnage composite. Son prénom est fictif, les faits sont agrégés à partir de dossiers de mobilité que nous avons vus. Le parcours est typique des cadres expatriés qui louent un logement familial pour la durée d'une mission et découvrent, une fois l'avion du retour pris, que la caution n'était pas le vrai risque.",
  disclaimer:
    "Aucun locataire réel n'est représenté. Les faits, logements et montants sont illustratifs. Les références juridiques sont à jour au 18 avril 2026.",
  acts: [
    {
      heading: "Acte 1 — La mission, et la signature de vingt minutes",
      paragraphs: [
        "Samir accepte une expatriation auprès de la filiale française de sa banque : trois ans à Toulouse, supervision des risques de crédit, famille rejoignant en septembre. Épouse, deux garçons, une fille. Le consultant en mobilité présente trois biens la semaine précédant le départ. Samir choisit un pavillon de quatre chambres au nord de la ville, non meublé, 2 000 € par mois, rue calme, école bilingue à pied.",
        "Le bailleur est un ancien comptable âgé, propriétaire en pleine propriété, qui loue la maison à une famille après l'autre depuis vingt ans. Il tend un état des lieux d'entrée manuscrit, une page pliée dans le bail. Vingt-cinq lignes, toutes cochées « bon état ». Murs : « peinture blanche, état d'usage ». Sols : « parquet, état d'usage ». Cuisine : « équipement en ordre de marche ». Samir le lit en moins d'une minute, signe chaque page, et verse 2 000 € de dépôt de garantie par virement.",
        "Personne ne photographie quoi que ce soit. Le consultant traite l'EDL comme une formalité administrative, non comme une pièce probante. Samir est en phase de passation, son épouse gère l'inscription scolaire, les enfants réclament le code wifi. Deux heures plus tard, les déménageurs arrivent. La maison est à lui.",
      ],
    },
    {
      heading: "Acte 2 — Trois ans d'une famille de cinq",
      paragraphs: [
        "La famille vit la maison normalement. Trois enfants de quatre, six et huit ans laissent les traces qu'une famille de cinq laisse sur une peinture en trois ans : frottements le long de la rampe d'escalier, trait de feutre sur un mur de cuisine effacé à la gomme magique mais encore légèrement visible, un enfoncement derrière la porte de la chambre du plus jeune. Une lame de parquet près de la cuisine prend une teinte plus sombre, un radiateur ayant occasionnellement fui l'hiver. Le robinet de salle de bain se met à goutter en deuxième année ; Samir le signale au bailleur par SMS. Sans réponse.",
        "Il n'apprend jamais que la loi française ouvre au locataire un délai de trente jours après l'entrée pour formuler par écrit des observations sur l'état des lieux. Il n'apprend jamais que la peinture murale relève d'une vétusté de sept ans au sens de l'arrêté du 19 mars 2020, ce qui signifie qu'après cinq années d'occupation le bailleur ne peut rien facturer au locataire pour repeindre. Il n'apprend jamais que la mention « état d'usage » dans un document manuscrit, non étayée de photographies, est une formule qui s'effondre dès qu'un locataire conteste un poste précis.",
        "Le pack RH de la banque n'aborde rien de tout cela. Le consultant en mobilité n'a pas été formé au droit de l'état des lieux. Le bailleur n'a aucun intérêt à le signaler. Samir vit ses trois années.",
      ],
    },
    {
      heading: "Acte 3 — La sortie, l'avion, et la facture qui arrive à Alger",
      paragraphs: [
        "La mission s'achève fin août. La famille s'envole pour Alger le soir de la sortie. Le bailleur et son fils majeur arrivent le matin pour parcourir la maison avec Samir. Vingt-cinq minutes, aucune photographie, un état des lieux de sortie manuscrit d'une page, avec quatre formules catégorielles : « murs à rafraîchir », « parquet à poncer et revernir », « plaque de cuisson à vérifier », « ménage de fin à reprendre ». Samir signe, le taxi attend, l'embarquement est dans sept heures. Les clés changent de main. Il quitte la France.",
        "Une semaine plus tard, le courriel du bailleur arrive. Quatre devis en pièces jointes. Remise en peinture de l'ensemble de la maison : 3 200 €. Nettoyage approfondi : 600 €. Remplacement de la plaque de cuisson pour cause de « non-fonctionnement » : 450 €. Ponçage et vitrification du parquet de deux pièces : 250 €. Total réclamé : 4 500 €. Le dépôt de 2 000 € est retenu. Le solde de 2 500 € est exigible sous quinze jours, à virer sur l'IBAN du bailleur, faute de quoi une procédure sera engagée devant le tribunal judiciaire de Toulouse.",
        "Depuis Alger, Samir n'a rien. Aucune photographie d'entrée. Aucune photographie de sortie. Aucun justificatif de numéro de série ou de date de pose pour la plaque. Aucune formulation contradictoire dans l'état des lieux de sortie, les catégories générales qu'il a signées donnant carte blanche au bailleur. Le seul écrit qui existe, « bon état général » à l'entrée, sert le bailleur, pas lui. Il passe la semaine suivante à écrire à son ancien DRH et à une association de locataires. Les deux répondent par la même phrase : sans photos à l'entrée et à la sortie, le dossier est difficile.",
      ],
    },
  ],
  mappingHeading: "Ce que Tenu aurait fait, moment par moment",
  mappingIntro:
    "Chaque rupture du récit ci-dessus correspond à une fonctionnalité qui existe aujourd'hui. Le produit est pensé précisément autour de ces moments, et les cadres expatriés sont le segment où la facture de sortie dépasse le plus souvent le montant du dépôt.",
  mappings: [
    {
      moment: "Le jour de la signature",
      pain: "Samir signe un état des lieux manuscrit en vingt minutes, avec la formule « bon état général », sans photographies, sans savoir que son délai d'observation de trente jours commence à courir.",
      remedy:
        "L'onboarding Tenu remet les dix faits non négociables du bail français, dans la langue du locataire, dès le premier jour : plafond du dépôt (un mois en non meublé), délai de trente jours, barème de vétusté par matériau, liste des clauses réputées non écrites, délai de restitution, intérêts de retard. Samir aurait su qu'il appartient au bailleur d'établir l'état antérieur du logement avant la remise des clés.",
      remedyLabel: "Lire : Connaître vos droits avant d'emménager",
      href: "/features/onboarding",
    },
    {
      moment: "La première semaine dans la maison",
      pain: "Les frottements préexistants, la plaque de cuisson âgée de dix ans, la lame de parquet déjà plus sombre près du radiateur : rien n'a été photographié. Tout ce qui était visible à l'entrée pouvait ensuite être facturé comme si Samir en était l'origine.",
      remedy:
        "Le dossier de preuves Tenu invite le locataire à photographier chaque pièce, chaque mur et chaque équipement à l'entrée. Chaque cliché est haché en SHA-256, son EXIF est préservé, un horodatage serveur est enregistré, le fichier est stocké chiffré en région européenne. Trois ans plus tard à la sortie, Tenu reconstitue le dossier à la demande pour la commission de conciliation. Ce qui était présent à l'entrée ne peut plus être facturé comme dégradation imputable au locataire.",
      remedyLabel: "Lire : Des preuves qui tiennent devant la commission",
      href: "/features/evidence",
    },
    {
      moment: "Le jour de l'état des lieux de sortie",
      pain: "L'état des lieux de sortie comporte des formules catégorielles : « murs à rafraîchir », « plaque à vérifier », « ménage à reprendre ». Chacune est un chèque en blanc. Samir signe sous pression de temps. Il ne peut distinguer la vétusté (non facturable) de la dégradation imputable (facturable uniquement à la valeur résiduelle).",
      remedy:
        "L'analyse IA Tenu lit les photos d'entrée et de sortie et rend un verdict ligne par ligne au visa de l'arrêté du 19 mars 2020. Pour ce dossier : la remise en peinture intégrale est exclue, la peinture atteignant 100 % de vétusté à sept ans et la famille ayant occupé trois, la part résiduelle chargeable tombe au mieux à une fraction d'un seul mur. La plaque de cuisson, si elle était installée avant l'entrée, atteint une valeur résiduelle voisine de zéro. Le ponçage du parquet sur deux pièces pour une lame plus sombre est disproportionné au visa du barème. Retenue défendable par le bailleur : environ 200 à 300 €, non 4 500 €.",
      remedyLabel: "Lire : Deux minutes pour y voir clair",
      href: "/features/scan",
    },
    {
      moment: "Le courriel qui arrive à Alger",
      pain: "La facture tombe une semaine après l'avion. Samir est de l'autre côté de la Méditerranée, hors de France, sans preuve, sans avocat local sur dossier et avec un délai de quinze jours. Dans cette position, la plupart des expatriés paient le solde pour éviter une assignation à une ancienne adresse française.",
      remedy:
        "Tenu produit une lettre de contestation formelle en français, au format commission de conciliation, fondée sur l'article 22 de la loi du 6 juillet 1989, l'article 1353 du Code civil (charge de la preuve sur celui qui allègue la dégradation) et le barème de l'arrêté du 19 mars 2020. La lettre conteste chaque devis sur son propre terrain : la peinture sur la vétusté, la plaque sur la valeur résiduelle, le parquet sur la proportionnalité, le nettoyage sur sa défendabilité chiffrée. Envoi en recommandé depuis Alger avec avis de réception international, dix euros, deux jours. Les intérêts de 10 % du loyer mensuel courent à compter de la date à laquelle le dépôt aurait dû être restitué.",
      remedyLabel: "Lire : Une lettre qui se défend toute seule",
      href: "/features/dispute",
    },
    {
      moment: "Deux semaines après l'envoi de la lettre",
      pain: "Un expatrié, une fois rentré, tend à cesser de suivre. Le dossier s'éteint. Le bailleur encaisse le dépôt et les 2 500 € supplémentaires par défaut.",
      remedy:
        "La boucle de suivi Tenu à quatorze jours pose la seule question : le dépôt est-il revenu. Dans la négative, Tenu fournit la trame de saisine de la Commission départementale de conciliation de la Haute-Garonne, procédure gratuite, écrite, accessible depuis l'étranger. L'agrégat de résultats affine le dossier de l'expatrié suivant. L'enregistrement individuel de Samir ne quitte jamais le stockage européen.",
      remedyLabel: "Lire : Suivi jusqu'au remboursement",
      href: "/features/followup",
    },
  ],
  verdictHeading: "Le scénario contrefactuel",
  verdictBody:
    "Si Samir avait utilisé Tenu à l'entrée, le seul dossier de photographies aurait déplacé la charge probatoire. Frottements préexistants, plaque de dix ans, lame de parquet plus sombre près d'un radiateur qui fuit : chacun visible sur un fichier horodaté de la semaine de l'emménagement. À la sortie, l'analyse aurait rendu un verdict écrit d'environ 250 € de retenue défendable, contre lequel la lettre aurait épinglé chaque devis ligne par ligne. Issue réaliste : 1 700 € de dépôt restitués et la demande de 2 500 € retirée. Issue réelle, en l'absence de Tenu : 4 500 € de sa poche et une correspondance tendue avec la DRH au moment de quitter la banque.",
  closingHeading: "Les expatriations portent les factures de sortie les plus lourdes en France. L'inspection commence le jour de la remise des clés.",
  closingBody:
    "Trente-cinq euros pour un T5 ou une maison. Sans abonnement. Paiement d'avance. Droit de rétractation du consommateur renoncé à la commande, remboursement si le service ne peut être rendu. Si la banque prend en charge l'analyse sur le budget mobilité, elle se rentabilise sur une seule ligne de devis contestée.",
  cta: "Commencer mon inspection",
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

export default async function SamirStory() {
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
          <p className="mx-auto mt-4 max-w-2xl text-xs text-tenu-ink-muted">{c.disclaimer}</p>
        </section>

        <section className="t-section-band px-6 md:px-12">
          <div className="t-content max-w-3xl">
            {c.acts.map((act) => (
              <article key={act.heading} className="mb-12 last:mb-0">
                <h2 className="t-section-heading mb-5">{act.heading}</h2>
                <div className="space-y-4">
                  {act.paragraphs.map((p, i) => (
                    <p key={i} className="t-body">{p}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="t-section-canvas px-6 md:px-12">
          <div className="t-content max-w-3xl">
            <h2 className="t-section-heading mb-4">{c.mappingHeading}</h2>
            <p className="t-body-muted mb-10">{c.mappingIntro}</p>
            <div className="space-y-6">
              {c.mappings.map((m) => (
                <article
                  key={m.moment}
                  className="rounded-2xl border border-tenu-cream-dark bg-white p-6"
                >
                  <div className="t-label text-tenu-accent mb-2">{m.moment}</div>
                  <p className="t-body mb-3"><strong className="text-tenu-forest">What went wrong / Ce qui a basculé :</strong> {m.pain}</p>
                  <p className="t-body mb-4"><strong className="text-tenu-forest">What Tenu does :</strong> {m.remedy}</p>
                  <Link href={m.href} className="text-sm font-medium text-tenu-accent hover:underline">
                    {m.remedyLabel} →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="t-section-band px-6 md:px-12">
          <div className="t-content max-w-3xl">
            <h2 className="t-section-heading mb-4">{c.verdictHeading}</h2>
            <p className="t-body">{c.verdictBody}</p>
          </div>
        </section>

        <section className="t-section-canvas px-6 md:px-12">
          <div className="t-content max-w-2xl text-center">
            <h2 className="t-section-heading mb-5">{c.closingHeading}</h2>
            <p className="t-body-muted mb-10">{c.closingBody}</p>
            <Link href="/inspection/new" className="t-cta-primary hig-press">{c.cta}</Link>
          </div>
        </section>

        <OtherCases currentSlug="samir" />
      </main>

      <footer className="border-t t-hairline px-6 py-10 text-center text-sm text-tenu-ink-muted">
        <p>&copy; {new Date().getFullYear()} Global Apex NET (SAS, France). tenu.world</p>
      </footer>
    </div>
  );
}
