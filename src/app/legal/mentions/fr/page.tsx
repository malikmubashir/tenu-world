// Mentions légales (v1.0, 2026-06-12). Source : document RGPD V6 validé par le DPO (AP3R Consulting).
// LCEN art. 6-III : identification de l'éditeur, du directeur de la publication et de l'hébergeur.
// Pas de numéro de téléphone : arbitrage DPO V3 (joignabilité par deux voies électroniques).
import LegalPage from "@/components/legal/LegalPage";
import { H2, P } from "@/components/legal/Prose";

export const metadata = {
  title: "Mentions légales — Tenu.World",
  description: "Identification de l'éditeur, du directeur de la publication et de l'hébergeur de Tenu.World.",
};

export default function MentionsFR() {
  return (
    <LegalPage
      meta={{
        title: "Mentions légales",
        version: "v1.0",
        lastUpdated: "2026-06-12",
        statusLine: "v1.0 — validée DPO (AP3R Consulting, 12 juin 2026)",
        localeLabel: "Français",
        otherLocaleHref: "/legal/mentions/en",
        otherLocaleLabel: "English",
        backToIndex: "Documents légaux",
      }}
    >
      <H2>Éditeur du site</H2>
      <P>
        <strong>Global Apex.Net</strong>, société par actions simplifiée au capital de 100 euros, immatriculée au Registre du commerce et des sociétés de Versailles sous le numéro 941 666 067, dont le siège social est situé 4 Boulevard du Château, 78280 Guyancourt, France. Numéro de TVA intracommunautaire : FR89 941 666 067. Code APE 62.02A. Global Apex.Net édite et exploite le service Tenu.World accessible depuis le domaine <code>tenu.world</code>.
      </P>
      <P>
        Contact éditeur : <code>contact@tenu.world</code> et <code>dpo@tenu.world</code>.
      </P>

      <H2>Directeur de la publication</H2>
      <P>
        Malik Mubashir Hassan, Président de Global Apex.Net.
      </P>

      <H2>Hébergeur du site</H2>
      <P>
        Vercel Inc., 340 S Lemon Avenue #4133, Walnut, CA 91789, États-Unis. L&apos;infrastructure d&apos;hébergement utilisée pour les utilisateurs européens est localisée dans la région CDG (Paris). Contact : <code>privacy@vercel.com</code>. Site web : <code>https://vercel.com</code>.
      </P>

      <H2>Données personnelles</H2>
      <P>
        Le traitement des données à caractère personnel est décrit dans la politique de confidentialité publiée sur <code>tenu.world/legal/privacy/fr</code>. Pour toute question ou exercice de droits : <code>dpo@tenu.world</code>.
      </P>
    </LegalPage>
  );
}
