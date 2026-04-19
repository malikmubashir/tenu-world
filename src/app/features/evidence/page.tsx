// /features/evidence — "Evidence that holds up in mediation" / "Des preuves
// qui tiennent devant la commission". Chain-of-custody on every photo: SHA-256,
// EXIF preserved, server-side timestamp. Acknowledges what the bundle is NOT
// (a certified état des lieux requires contradictoire or a commissaire de justice).
import { cookies, headers } from "next/headers";
import Link from "next/link";
import Script from "next/script";
import { parseLocaleFromCookie, parseLocaleFromHeader } from "@/lib/i18n/server";

type Section = { heading: string; body: string };
type Copy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  lede: string;
  chainHeading: string;
  chainItems: { title: string; body: string }[];
  sections: Section[];
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
  metaTitle: "Evidence that holds up in mediation — Tenu.World",
  metaDescription:
    "Timestamped, hashed, room-by-room photo evidence with verifiable chain of custody. Built to be accepted by the French commission de conciliation and the juge des contentieux de la protection.",
  eyebrow: "Feature · Evidence bundle",
  title: "Evidence that holds up in mediation",
  lede:
    "Photos alone are contestable. Photos with a cryptographic fingerprint, preserved EXIF metadata and a server-side timestamp are harder to dismiss.",
  chainHeading: "What we capture on every photo",
  chainItems: [
    {
      title: "SHA-256 fingerprint",
      body: "Each photo is hashed client-side at upload. The 64-character hexadecimal digest is stored with the file. If a single pixel is altered after upload, the hash no longer matches. Anyone can verify this without access to your account.",
    },
    {
      title: "EXIF metadata preserved",
      body: "Capture time, camera model, focal length and orientation are kept intact. Geolocation is deliberately stripped (GDPR data minimisation). The server does not re-encode the image.",
    },
    {
      title: "Server-side timestamp",
      body: "An independent upload timestamp is stored alongside the EXIF capture time. The pair detects the rare case where a device clock was set wrong or the image was sourced from elsewhere.",
    },
    {
      title: "Room and position label",
      body: "Each photo is tagged with the room it documents and the order of capture. The room-by-room guide prevents a landlord arguing that a given surface was never photographed.",
    },
    {
      title: "EU-only storage",
      body: "Files live in Cloudflare R2 EU region, encrypted at rest, with signed download URLs. No data crosses the Atlantic. Retention: twelve months from the inspection date, then automatic deletion.",
    },
  ],
  sections: [
    {
      heading: "Why chain of custody matters",
      body: "A picture shown to a landlord has no legal weight on its own. The same picture, bundled with a hash, an EXIF trail, and a server timestamp, shifts the question from \"is this real?\" to \"prove it was altered.\" That is the threshold the commission départementale de conciliation applies when it reviews a file.",
    },
    {
      heading: "How it is used",
      body: "In 80 % of French deposit disputes, the commission de conciliation is the first stop. It reads documents, not people. A complete evidence bundle, delivered as a single PDF with per-photo hashes, gives the commissioner everything they need to find in your favour.",
    },
  ],
  limitsHeading: "What this is not",
  limits: [
    "This is not a certified état des lieux. A legally-contradictory état des lieux requires signature by both parties, or, if one side refuses, an act by a commissaire de justice.",
    "This is not a forensic expert's report. Tenu documents the scene; it does not adjudicate the cause of damage.",
    "This is not a guarantee of outcome. It is evidence, which is necessary but not sufficient.",
  ],
  closingHeading: "Turn photos into a file that survives scrutiny.",
  closingBody:
    "Room by room, timestamped, hashed, stored in the EU. Delivered as a single PDF you attach to your letter.",
  cta: "Start my inspection",
  disclaimer:
    "Tenu produces document templates. Acceptance by any commission or court depends on the full dossier and the governing texts. This is not legal advice.",
  home: "Home",
  pricing: "Pricing",
};

const FR: Copy = {
  metaTitle: "Des preuves qui tiennent devant la commission — Tenu.World",
  metaDescription:
    "Preuves photographiques horodatées, empreintes SHA-256, métadonnées EXIF préservées. Conçues pour être recevables par la commission départementale de conciliation et le juge des contentieux de la protection.",
  eyebrow: "Fonctionnalité · Dossier de preuves",
  title: "Des preuves qui tiennent devant la commission",
  lede:
    "Des photos seules sont contestables. Des photos accompagnées d'une empreinte cryptographique, des métadonnées EXIF préservées et d'un horodatage serveur sont nettement plus difficiles à écarter.",
  chainHeading: "Ce que nous capturons pour chaque photo",
  chainItems: [
    {
      title: "Empreinte SHA-256",
      body: "Chaque photo est hachée côté client au téléversement. L'empreinte hexadécimale de 64 caractères est stockée avec le fichier. La modification d'un seul pixel après téléversement rend l'empreinte invalide. N'importe qui peut vérifier ce contrôle sans accéder à votre compte.",
    },
    {
      title: "Métadonnées EXIF préservées",
      body: "Date de prise de vue, modèle d'appareil, focale et orientation sont conservés intacts. La géolocalisation est délibérément supprimée (minimisation RGPD). Le serveur ne réencode pas l'image.",
    },
    {
      title: "Horodatage serveur",
      body: "Un horodatage indépendant de téléversement est stocké à côté de la date EXIF. Le recoupement détecte les cas, rares, où l'horloge de l'appareil était mal réglée ou l'image provenait d'une autre source.",
    },
    {
      title: "Étiquetage pièce par pièce",
      body: "Chaque photo est rattachée à la pièce documentée et à son ordre de capture. Le parcours guidé par pièce empêche le bailleur d'invoquer qu'une surface n'a jamais été photographiée.",
    },
    {
      title: "Stockage strictement européen",
      body: "Les fichiers résident chez Cloudflare R2 région UE, chiffrés au repos, accessibles via des URL signées. Aucune donnée ne traverse l'Atlantique. Conservation : douze mois à compter de l'inspection, puis suppression automatique.",
    },
  ],
  sections: [
    {
      heading: "Pourquoi la chaîne de custody compte",
      body: "Une photo présentée seule au bailleur n'a aucune force probante. La même photo, accompagnée d'une empreinte, d'une trace EXIF et d'un horodatage serveur, déplace la discussion : il ne s'agit plus de savoir si elle est authentique, mais de démontrer qu'elle aurait été falsifiée. C'est le seuil de vraisemblance que la commission départementale de conciliation applique lorsqu'elle instruit un dossier.",
    },
    {
      heading: "À quoi elle sert",
      body: "Dans 80 % des litiges français sur dépôt de garantie, la commission de conciliation est le premier recours. Elle statue sur pièces, non sur témoignages. Un dossier de preuves complet, rendu sous forme de PDF unique avec empreintes par photo, met le conciliateur en mesure de trancher en votre faveur sans audience prolongée.",
    },
  ],
  limitsHeading: "Ce que ce dossier n'est pas",
  limits: [
    "Ce n'est pas un état des lieux contradictoire. Un état des lieux opposable exige la signature des deux parties ou, en cas de refus, un acte de commissaire de justice.",
    "Ce n'est pas un rapport d'expertise judiciaire. Tenu documente la scène, il ne tranche pas la cause des désordres.",
    "Ce n'est pas une garantie de résultat. C'est une preuve, nécessaire mais non suffisante.",
  ],
  closingHeading: "Transformez vos photos en un dossier qui résiste à l'examen.",
  closingBody:
    "Pièce par pièce, horodaté, haché, stocké en Europe. Remis sous forme d'un PDF unique à joindre à votre courrier.",
  cta: "Commencer mon inspection",
  disclaimer:
    "Tenu fournit des modèles de documents. Leur recevabilité par une commission ou une juridiction dépend du dossier complet et des textes applicables. Ce contenu ne constitue pas un conseil juridique.",
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

export default async function EvidenceFeature() {
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
            <h2 className="t-section-heading mb-10">{c.chainHeading}</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {c.chainItems.map((it) => (
                <div key={it.title} className="t-card">
                  <h3 className="t-h3 mb-2">{it.title}</h3>
                  <p className="t-small-muted">{it.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="t-section-canvas px-6 md:px-12">
          <div className="t-content max-w-3xl">
            {c.sections.map((s) => (
              <div key={s.heading} className="mb-10">
                <h2 className="t-section-heading mb-4">{s.heading}</h2>
                <p className="t-body">{s.body}</p>
              </div>
            ))}
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
