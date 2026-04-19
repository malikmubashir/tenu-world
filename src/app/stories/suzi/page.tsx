// /stories/suzi — "Suzi, from Tokyo to Paris" / "Suzi, de Tokyo à Paris".
// Long-form use case. Composite built from real cases of Japanese students
// exiting CROUS housing into the private market. Every failure point is
// mapped to the Tenu feature that would have caught it, with a direct
// link across. Professional-services register. Not a testimonial.
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { parseLocaleFromCookie, parseLocaleFromHeader } from "@/lib/i18n/server";
import OtherCases from "@/components/stories/OtherCases";

type Act = { heading: string; body: string };
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
  metaTitle: "Suzi, from Tokyo to Paris — a Tenu.World use case",
  metaDescription:
    "A composite use case of a Japanese master's student moving out of CROUS housing into the private Paris rental market. Where each decision went wrong, and what Tenu would have done.",
  eyebrow: "Use case · Japanese student · Île-de-France",
  title: "Suzi, from Tokyo to Paris",
  lede:
    "Suzi is a composite. Her name is fictitious, the facts are assembled from tenant files we have seen. The arc is typical of international students exiting university housing into a private French lease.",
  disclaimer:
    "No real tenant is depicted. Facts, dwellings and sums are illustrative. The legal references are accurate as at 18 April 2026.",
  acts: [
    {
      heading: "Act 1 — The arrival, and the three-month wall",
      paragraphs: [
        "Suzi arrived in Paris on a master's programme. The university welcomed her into a CROUS studio for twelve months. A single room, utilities included, rent direct-debited from her student account. One year later the degree ended, the CROUS contract ended, she was out.",
        "She looked for a replacement from August. Agencies quoted €950 a month for a small studio in the 15th arrondissement. The entry cost was the wall she could not climb: one month advance rent, one month dépôt de garantie, one month honoraires d'agence. Around €2,850, payable within ten days of signing. Her savings were €1,800.",
        "She turned to a classified ad. A private landlord, a retired man in the 13th arrondissement, no English, no Japanese. Her French was A2 at best. The rent was €820 all-in, no agency fee. Entry cost shrank to €1,640.",
        "The visit went well. The landlord handed her a stack of documents: the bail, an état des lieux d'entrée, a réglement de copropriété extract, an acte de cautionnement signed by her parents in Tokyo, an RIB mandate. Everything in French. She signed on every page marked with a small pencil cross, as instructed. She was told the keys would be released once the deposit and first rent cleared.",
      ],
    },
    {
      heading: "Act 2 — The year that passed, and the month she did not use",
      paragraphs: [
        "French law gave Suzi a thirty-day window, after moving in, to return to the landlord with written observations on the entry état des lieux. A heating radiator that did not reach full temperature in October. A crack along the kitchen worktop she had not noticed under the previous tenant's placemat. A bathroom extractor fan that did not turn on. Any registered letter within thirty days, and the entry document would have been amended.",
        "Nobody told her this. The landlord had no reason to. Her French did not reach the operative verbs. The window closed on day thirty-one.",
        "She lived her year. A faint stain appeared on the living-room parquet when a guest spilled tea. The kitchen worktop developed a second small chip from a dropped bowl. The wall behind her desk picked up the expected greyish cast from a year of a laptop fan pointing at it. Nothing she would have flagged as unusual.",
      ],
    },
    {
      heading: "Act 3 — The exit, the verdict, the silence",
      paragraphs: [
        "The lease ended in July. Suzi notified the landlord by SMS, received no written reply, sent her préavis by registered letter one month before. She scrubbed the flat with her flatmate over the weekend before departure. The landlord arrived for the état des lieux de sortie at the appointed time with a clipboard and a pen.",
        "He wrote for forty minutes. The parquet: to be sanded and revarnished, estimated €900. The worktop: to be replaced, estimated €450. The desk-wall: to be repainted, estimated €380. A small crack in the bathroom tile, which Suzi did not remember causing: €120. Total: €1,850. The dépôt de garantie was €820. He would retain it and invoice her for the balance of €1,030.",
        "She signed the exit document because the landlord pressed her to. She did not understand that she could have refused. She flew home to Tokyo seven days later. Two months passed. The dépôt did not come back. A letter in French arrived at her parents' address via the cautionnement chain, demanding €1,030.",
      ],
    },
  ],
  mappingHeading: "What Tenu would have done, moment by moment",
  mappingIntro:
    "Each failure in the story above corresponds to a feature that exists today. None of this is retrospective imagination; the product is designed around exactly these five moments.",
  mappings: [
    {
      moment: "Day of the signature",
      pain: "Suzi signed documents in French she could not read. She did not know the dépôt was capped, that her thirty-day observation window was running, that several clauses in the bail were void by law.",
      remedy:
        "Tenu's rights onboarding delivers the ten non-negotiable facts of a French lease in the tenant's own language on day one, with statute references. She would have known the deposit cap, the 30-day observation window, the void-clause list and the deduction rules before the ink dried.",
      remedyLabel: "Read: Know your rights before you move in",
      href: "/features/onboarding",
    },
    {
      moment: "First week in the flat",
      pain: "The radiator underperformed, the worktop had a crack, the bathroom fan did not turn on. These would be charged to Suzi at exit as if she had caused them.",
      remedy:
        "Tenu's evidence bundle asks the tenant to photograph every room on move-in. Each photo is hashed (SHA-256), its EXIF is preserved, a server timestamp is recorded. Anything visible on day one cannot be charged as tenant damage on day three hundred and sixty.",
      remedyLabel: "Read: Evidence that holds up in mediation",
      href: "/features/evidence",
    },
    {
      moment: "Day of the exit état des lieux",
      pain: "The landlord itemised €1,850 of charges. Suzi could not distinguish between vétusté (uncharged by law) and dégradation (chargeable at residual value only). She did not know a worktop of five years cannot be billed at the price of a new one.",
      remedy:
        "Tenu's AI risk scan reads the entry and exit photos, applies the arrêté du 19 mars 2020 wear-and-tear scale, and returns a line-by-line verdict. For Suzi's case: the parquet tea stain is chargeable but only at residual value; the worktop chip is a minor repair at residual value; the desk wall is presumed vétusté after twelve months; the bathroom tile crack, absent on entry photos, is contestable on the burden of proof. Working estimate: the landlord could legitimately retain around €180, not €1,850.",
      remedyLabel: "Read: Two minutes to clarity",
      href: "/features/scan",
    },
    {
      moment: "The week after the exit",
      pain: "Suzi signed the exit document under pressure. She did not understand she could refuse, and she had no written position of her own to place beside the landlord's.",
      remedy:
        "Tenu produces a formal dispute letter in French, CDC format, grounded in article 22 of Loi 89-462 and the arrêté du 19 mars 2020 scale. The letter is delivered alongside a plain explanation in Japanese so Suzi can sign knowing exactly what the French says. Eight-day deadline, registered post, 10 % interest accruing per month of delay.",
      remedyLabel: "Read: A letter that defends itself",
      href: "/features/dispute",
    },
    {
      moment: "Two weeks after the letter leaves",
      pain: "Without follow-up, Suzi has no data, and the next Japanese student arrives in August blind.",
      remedy:
        "Tenu's 14-day outcome loop asks a single question: did the deposit come back, fully, partially, or not at all. The aggregate sharpens the model for the next tenant. Suzi's individual record never leaves EU storage.",
      remedyLabel: "Read: Follow through to refund",
      href: "/features/followup",
    },
  ],
  verdictHeading: "The counterfactual",
  verdictBody:
    "Had Suzi used Tenu at move-in and at move-out, the evidence bundle alone would have reduced the defensible charge from €1,850 to roughly €180. With the dispute letter sent by registered post within the month, and interest running at 10 % of monthly rent per month of delay, a negotiated settlement of €640 returned is the realistic expectation. The difference is €1,460 and a demand letter at her parents' address in Tokyo that never arrives.",
  closingHeading: "The product is built for Suzi. Start with the inspection.",
  closingBody:
    "Fifteen euros for a studio or T1. No subscription. Payment upfront, consumer withdrawal right waived at checkout. Refund if the service cannot be rendered.",
  cta: "Start my inspection",
  home: "Home",
  pricing: "Pricing",
};

const FR: Copy = {
  metaTitle: "Suzi, de Tokyo à Paris — un cas d'usage Tenu.World",
  metaDescription:
    "Cas d'usage composite d'une étudiante japonaise en master quittant un logement CROUS pour un bail privé en Île-de-France. Où chaque décision a basculé, et ce que Tenu aurait fait.",
  eyebrow: "Cas d'usage · Étudiante japonaise · Île-de-France",
  title: "Suzi, de Tokyo à Paris",
  lede:
    "Suzi est un personnage composite. Son prénom est fictif, les faits sont agrégés à partir de dossiers que nous avons vus. Le parcours est typique des étudiants internationaux qui sortent du logement universitaire pour entrer sur le marché privé français.",
  disclaimer:
    "Aucun locataire réel n'est représenté. Les faits, logements et montants sont illustratifs. Les références juridiques sont à jour au 18 avril 2026.",
  acts: [
    {
      heading: "Acte 1 — L'arrivée, et le mur des trois mois",
      paragraphs: [
        "Suzi arrive à Paris en master. L'université l'accueille dans un studio du CROUS pour douze mois. Une chambre unique, charges comprises, loyer prélevé directement sur son compte étudiant. Un an plus tard, le diplôme s'achève, le contrat CROUS s'achève, elle doit partir.",
        "Elle cherche un remplacement dès le mois d'août. Les agences annoncent 950 € par mois pour un studio dans le 15ᵉ. Le coût d'entrée est le mur qu'elle ne peut pas franchir : un mois de loyer d'avance, un mois de dépôt de garantie, un mois d'honoraires d'agence. Environ 2 850 €, payables dans les dix jours suivant la signature. Ses économies s'élèvent à 1 800 €.",
        "Elle se tourne vers une petite annonce. Un bailleur particulier, un retraité du 13ᵉ arrondissement, sans anglais ni japonais. Son français plafonne au niveau A2. Le loyer est de 820 € toutes charges comprises, sans frais d'agence. Le coût d'entrée tombe à 1 640 €.",
        "La visite se passe bien. Le bailleur lui remet une liasse de documents : le bail, un état des lieux d'entrée, un extrait du règlement de copropriété, un acte de cautionnement signé par ses parents à Tokyo, un mandat SEPA. Le tout en français. Elle signe chaque page marquée d'une petite croix au crayon, comme on le lui demande. Les clés seront remises après réception du dépôt et du premier loyer.",
      ],
    },
    {
      heading: "Acte 2 — L'année qui passe, et le mois qu'elle n'utilise pas",
      paragraphs: [
        "Le droit français ouvre à Suzi une fenêtre de trente jours après l'emménagement pour revenir vers le bailleur par écrit avec des observations sur l'état des lieux d'entrée. Un radiateur qui ne monte pas en température en octobre. Une fissure le long du plan de travail qu'elle n'a pas vue sous le set de table du précédent locataire. Un extracteur de salle de bain qui ne démarre pas. Une lettre recommandée sous trente jours et l'état des lieux d'entrée aurait été modifié en conséquence.",
        "Personne ne le lui dit. Le bailleur n'a aucune raison de le faire. Son français ne couvre pas les verbes opératoires. La fenêtre se referme au trente-et-unième jour.",
        "Elle vit son année. Une légère tache apparaît sur le parquet du salon lorsqu'un invité renverse du thé. Le plan de travail gagne un second éclat, une assiette lâchée. Le mur derrière son bureau prend la teinte grisâtre attendue après une année de ventilateur d'ordinateur portable. Rien qu'elle aurait qualifié d'inhabituel.",
      ],
    },
    {
      heading: "Acte 3 — La sortie, le verdict, le silence",
      paragraphs: [
        "Le bail s'achève en juillet. Suzi informe le bailleur par SMS, ne reçoit aucune réponse écrite, envoie son préavis par lettre recommandée un mois avant la date. Elle nettoie l'appartement avec sa colocataire le week-end précédant le départ. Le bailleur arrive pour l'état des lieux de sortie à l'heure convenue, un porte-bloc et un stylo en main.",
        "Il écrit pendant quarante minutes. Le parquet : à poncer et revernir, devis 900 €. Le plan de travail : à remplacer, devis 450 €. Le mur du bureau : à repeindre, devis 380 €. Une petite fissure sur un carrelage de salle de bain, que Suzi ne se souvient pas avoir causée : 120 €. Total : 1 850 €. Le dépôt de garantie est de 820 €. Il le retient et lui facture le solde de 1 030 €.",
        "Elle signe le document de sortie parce que le bailleur insiste. Elle n'a pas compris qu'elle pouvait refuser. Elle repart pour Tokyo sept jours plus tard. Deux mois passent. Le dépôt ne revient pas. Un courrier en français arrive à l'adresse de ses parents via la chaîne de cautionnement, réclamant 1 030 €.",
      ],
    },
  ],
  mappingHeading: "Ce que Tenu aurait fait, moment par moment",
  mappingIntro:
    "Chaque rupture du récit ci-dessus correspond à une fonctionnalité qui existe aujourd'hui. Ce n'est pas une reconstruction a posteriori ; le produit est conçu autour de ces cinq moments.",
  mappings: [
    {
      moment: "Le jour de la signature",
      pain: "Suzi signe en français des documents qu'elle ne peut pas lire. Elle ignore que le dépôt est plafonné, que sa fenêtre d'observation de trente jours court, que plusieurs clauses du bail sont réputées non écrites.",
      remedy:
        "L'onboarding rights de Tenu remet les dix faits non négociables du bail français dans la langue du locataire dès le premier jour, avec les références de texte. Suzi aurait connu le plafond du dépôt, le délai de trente jours, la liste des clauses non écrites et les règles de retenue avant que l'encre ne sèche.",
      remedyLabel: "Lire : Connaître vos droits avant d'emménager",
      href: "/features/onboarding",
    },
    {
      moment: "La première semaine dans le logement",
      pain: "Le radiateur sous-chauffait, le plan de travail portait une fissure, l'extracteur ne fonctionnait pas. Ces éléments lui seront facturés à la sortie comme s'ils étaient de son fait.",
      remedy:
        "Le dossier de preuves Tenu invite le locataire à photographier chaque pièce à l'entrée. Chaque photo est hachée en SHA-256, son EXIF est préservé, un horodatage serveur est enregistré. Tout ce qui est visible au jour un ne peut plus être facturé comme dégradation au jour trois-cent-soixante.",
      remedyLabel: "Lire : Des preuves qui tiennent devant la commission",
      href: "/features/evidence",
    },
    {
      moment: "Le jour de l'état des lieux de sortie",
      pain: "Le bailleur inventorie 1 850 € de retenues. Suzi ne peut pas distinguer la vétusté (non facturable) de la dégradation imputable (facturable uniquement à la valeur résiduelle). Elle ignore qu'un plan de travail de cinq ans ne peut pas être facturé au prix du neuf.",
      remedy:
        "L'analyse IA Tenu lit les photos d'entrée et de sortie, applique le barème de l'arrêté du 19 mars 2020, et rend un verdict ligne par ligne. Pour Suzi : la tache de thé sur le parquet est facturable mais uniquement à la valeur résiduelle ; l'éclat du plan de travail est une menue réparation en valeur résiduelle ; le mur derrière le bureau relève de la vétusté après douze mois ; la fissure du carrelage, absente des photos d'entrée, est contestable sur la charge de la preuve. Estimation de travail : le bailleur pouvait légitimement retenir environ 180 €, non 1 850 €.",
      remedyLabel: "Lire : Deux minutes pour y voir clair",
      href: "/features/scan",
    },
    {
      moment: "La semaine qui suit la sortie",
      pain: "Suzi signe le document de sortie sous pression. Elle ne sait pas qu'elle peut refuser, et elle n'a aucune position écrite à opposer à celle du bailleur.",
      remedy:
        "Tenu produit une lettre de contestation formelle en français, au format commission de conciliation, fondée sur l'article 22 de la loi du 6 juillet 1989 et le barème de l'arrêté du 19 mars 2020. La lettre est livrée avec une explication claire en japonais, afin que Suzi signe en sachant exactement ce que dit le texte français. Délai de huit jours, lettre recommandée, intérêts de 10 % du loyer mensuel par mois de retard.",
      remedyLabel: "Lire : Une lettre qui se défend toute seule",
      href: "/features/dispute",
    },
    {
      moment: "Deux semaines après l'envoi de la lettre",
      pain: "Sans suivi, Suzi n'a aucune donnée, et l'étudiante japonaise suivante arrive en août aveugle.",
      remedy:
        "La boucle de suivi Tenu à quatorze jours pose une seule question : le dépôt est-il revenu, intégralement, partiellement, pas du tout. L'agrégat affine le modèle pour le locataire suivant. L'enregistrement individuel de Suzi ne quitte jamais le stockage européen.",
      remedyLabel: "Lire : Suivi jusqu'au remboursement",
      href: "/features/followup",
    },
  ],
  verdictHeading: "Le scénario contrefactuel",
  verdictBody:
    "Si Suzi avait utilisé Tenu à l'entrée et à la sortie, le seul dossier de preuves aurait ramené la retenue défendable de 1 850 € à environ 180 €. Avec la lettre de contestation envoyée en recommandé dans le mois, et les intérêts courant au taux de 10 % du loyer mensuel par mois de retard, un règlement négocié de 640 € restitués est l'issue réaliste. L'écart est de 1 460 € et une lettre de mise en demeure à Tokyo qui ne part jamais.",
  closingHeading: "Le produit est conçu pour Suzi. Commencez par l'inspection.",
  closingBody:
    "Quinze euros pour un studio ou un T1. Sans abonnement. Paiement d'avance, droit de rétractation du consommateur renoncé à la commande. Remboursement si le service ne peut être rendu.",
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
  return locale === "fr" ? FR : EN;
}

export async function generateMetadata() {
  const c = await resolveCopy();
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function SuziStory() {
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

        <OtherCases currentSlug="suzi" />
      </main>

      <footer className="border-t t-hairline px-6 py-10 text-center text-sm text-tenu-ink-muted">
        <p>&copy; {new Date().getFullYear()} Global Apex NET (SAS, France). tenu.world</p>
      </footer>
    </div>
  );
}
