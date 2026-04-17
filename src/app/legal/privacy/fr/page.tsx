// Politique de confidentialité (v1.0-draft, 2026-04-17). Source: docs/legal-drafts/privacy-fr.md
import LegalPage from "@/components/legal/LegalPage";
import { H2, P, UL, LI, Table, TH, TD, Callout, Placeholder } from "@/components/legal/Prose";

export const metadata = {
  title: "Politique de confidentialité — Tenu.World",
  description: "Comment Tenu.World traite vos données personnelles.",
};

export default function PrivacyFR() {
  return (
    <LegalPage
      meta={{
        title: "Politique de confidentialité",
        version: "v1.0-draft",
        lastUpdated: "2026-04-17",
        statusLine: "DRAFT, en attente de revue avocat",
        localeLabel: "Français",
        otherLocaleHref: "/legal/privacy/en",
        otherLocaleLabel: "English",
        draftBanner:
          "Version de travail. En attente de validation par Dr Mubashir et revue avocat. Non encore opposable.",
        backToIndex: "Documents légaux",
      }}
    >
      <H2>1. Qui traite vos données</H2>
      <P>
        Le responsable du traitement est <strong>Global Apex.Net</strong>, société par actions simplifiée au capital de <Placeholder>[CAPITAL EUR]</Placeholder> euros, immatriculée au Registre du commerce et des sociétés de Versailles sous le numéro 941 666 067, dont le siège social est situé 4 Boulevard du Château, 78280 Guyancourt, France. Numéro de TVA intracommunautaire : FR89 941 666 067. Code APE 62.02A. Global Apex.Net édite et exploite le service Tenu.World accessible depuis le domaine <code>tenu.world</code>.
      </P>
      <P>
        Pour toute question relative à vos données, vous pouvez écrire à notre point de contact RGPD à l&apos;adresse <code>dpo@tenu.world</code>. Nous répondons dans un délai maximum d&apos;un mois.
      </P>
      <P>
        Global Apex.Net n&apos;est pas soumise à l&apos;obligation de désignation d&apos;un délégué à la protection des données au sens de l&apos;article 37 du RGPD. L&apos;adresse <code>dpo@tenu.world</code> constitue un point de contact unique pour toute question relative à la protection des données.
      </P>

      <H2>2. Quelles données nous collectons</H2>
      <P>Nous traitons trois catégories de données.</P>
      <P>
        <strong>Données de compte.</strong> Adresse électronique, préférence de langue, date d&apos;inscription. Collectées lorsque vous créez un compte via un lien magique.
      </P>
      <P>
        <strong>Données d&apos;inspection.</strong> Adresse du logement loué, juridiction applicable (France ou Royaume-Uni), nom du bailleur si vous le saisissez, photographies pièce par pièce, observations textuelles libres que vous ajoutez.
      </P>
      <P>
        <strong>Données de paiement.</strong> Nom, adresse de facturation, montant versé, horodatage de la transaction. Le numéro de carte n&apos;est jamais collecté ni stocké par Tenu.World : il est traité directement par Stripe.
      </P>
      <P>
        Nous ne collectons aucune donnée dite sensible au sens de l&apos;article 9 du RGPD.
      </P>

      <H2>3. Sur quelle base juridique</H2>
      <P>Nous nous appuyons sur deux bases juridiques distinctes selon la finalité.</P>
      <P>
        <strong>Consentement (article 6.1.a du RGPD)</strong> pour le traitement des photographies et des observations que vous nous confiez. Le consentement est demandé explicitement avant tout téléversement. Vous pouvez le retirer à tout moment, ce qui entraîne la suppression des photographies concernées.
      </P>
      <P>
        <strong>Exécution d&apos;un contrat (article 6.1.b du RGPD)</strong> pour la génération du rapport d&apos;analyse de dépôt de garantie, la génération de la lettre type en cas de litige, l&apos;émission de la facture et le paiement par carte bancaire.
      </P>

      <H2>4. Combien de temps nous conservons vos données</H2>
      <Table>
        <thead>
          <tr>
            <TH>Catégorie</TH>
            <TH>Durée de conservation</TH>
            <TH>Motif</TH>
          </tr>
        </thead>
        <tbody>
          <tr>
            <TD>Données de compte</TD>
            <TD>Tant que le compte reste actif, puis 12 mois après clôture</TD>
            <TD>Contentieux possible sur la prestation</TD>
          </tr>
          <tr>
            <TD>Photographies et observations d&apos;inspection</TD>
            <TD>24 mois à compter de la date d&apos;inspection</TD>
            <TD>Durée typique d&apos;un litige locatif en France</TD>
          </tr>
          <tr>
            <TD>Rapports et lettres générés (PDF)</TD>
            <TD>24 mois</TD>
            <TD>Archivage pour preuve</TD>
          </tr>
          <tr>
            <TD>Facturation</TD>
            <TD>10 ans</TD>
            <TD>Obligation comptable, article L123-22 Code de commerce</TD>
          </tr>
          <tr>
            <TD>Journaux techniques anonymisés</TD>
            <TD>6 mois</TD>
            <TD>Sécurité et détection de fraude</TD>
          </tr>
        </tbody>
      </Table>
      <P>
        Au-delà de ces durées, les données sont supprimées automatiquement par notre système de purge. Vous pouvez demander la suppression anticipée à tout moment (voir section 7).
      </P>

      <H2>5. Où vos données sont hébergées</H2>
      <P>
        Toutes les données sont hébergées au sein de l&apos;Union européenne ou du Royaume-Uni. Aucun transfert hors de cet espace n&apos;a lieu dans le cadre normal du service.
      </P>
      <UL>
        <LI>Base de données et authentification : Supabase, région Europe (Francfort, Allemagne).</LI>
        <LI>Photographies et rapports PDF : Cloudflare R2, région EU.</LI>
        <LI>Plateforme d&apos;hébergement web : Vercel, région CDG (Paris).</LI>
        <LI>Envoi d&apos;emails transactionnels : Brevo (anciennement Sendinblue), France.</LI>
        <LI>Paiement : Stripe, traitement conforme à la norme PCI-DSS, entité européenne Stripe Technology Europe Ltd., Dublin.</LI>
        <LI>Analyse IA : Anthropic via API, traitement dans les régions EU de l&apos;infrastructure Anthropic.</LI>
      </UL>
      <Callout>
        <Placeholder>[À VÉRIFIER PAR AVOCAT]</Placeholder> confirmer la région de traitement d&apos;Anthropic au moment de la signature du DPA. L&apos;entreprise revendique un traitement EU sans transfert, mais cela doit être audité.
      </Callout>

      <H2>6. Sous-traitants</H2>
      <P>
        Les entreprises suivantes traitent vos données en notre nom, au titre d&apos;un contrat de sous-traitance conforme à l&apos;article 28 du RGPD.
      </P>
      <Table>
        <thead>
          <tr>
            <TH>Sous-traitant</TH>
            <TH>Finalité</TH>
            <TH>Siège</TH>
            <TH>Type</TH>
          </tr>
        </thead>
        <tbody>
          <tr>
            <TD>Supabase Inc.</TD>
            <TD>Base de données et authentification</TD>
            <TD>Delaware, USA (infra EU Francfort)</TD>
            <TD>DPA signé</TD>
          </tr>
          <tr>
            <TD>Cloudflare Inc.</TD>
            <TD>Stockage des photographies et PDF</TD>
            <TD>San Francisco, USA (infra EU)</TD>
            <TD>DPA signé</TD>
          </tr>
          <tr>
            <TD>Stripe Technology Europe Ltd.</TD>
            <TD>Paiement</TD>
            <TD>Dublin, Irlande</TD>
            <TD>DPA signé</TD>
          </tr>
          <tr>
            <TD>Anthropic PBC</TD>
            <TD>Analyse IA</TD>
            <TD>San Francisco, USA (infra EU)</TD>
            <TD>DPA signé</TD>
          </tr>
          <tr>
            <TD>Brevo SA</TD>
            <TD>Envoi d&apos;emails</TD>
            <TD>Paris, France</TD>
            <TD>DPA signé</TD>
          </tr>
          <tr>
            <TD>Vercel Inc.</TD>
            <TD>Hébergement web</TD>
            <TD>San Francisco, USA (infra EU)</TD>
            <TD>DPA signé</TD>
          </tr>
        </tbody>
      </Table>
      <P>
        Les DPA sont disponibles sur demande à <code>dpo@tenu.world</code>.
      </P>

      <H2>7. Vos droits</H2>
      <P>
        Conformément au RGPD et à la loi Informatique et Libertés modifiée, vous disposez des droits suivants, que vous pouvez exercer en écrivant à <code>dpo@tenu.world</code> depuis l&apos;adresse email associée à votre compte.
      </P>
      <UL>
        <LI><strong>Droit d&apos;accès</strong> à vos données.</LI>
        <LI><strong>Droit de rectification</strong> en cas d&apos;erreur.</LI>
        <LI><strong>Droit à l&apos;effacement</strong> (droit à l&apos;oubli), sous réserve des obligations légales de conservation (notamment la facturation).</LI>
        <LI><strong>Droit à la portabilité</strong> : vous pouvez recevoir vos données dans un format structuré lisible par machine.</LI>
        <LI><strong>Droit d&apos;opposition</strong> au traitement.</LI>
        <LI><strong>Droit de retirer votre consentement</strong> à tout moment pour les traitements fondés sur le consentement.</LI>
        <LI><strong>Droit de définir des directives post-mortem</strong> pour le sort de vos données après votre décès (article 85 loi Informatique et Libertés).</LI>
      </UL>
      <P>
        Nous vous répondons dans un délai d&apos;un mois, éventuellement prolongé de deux mois en cas de complexité ou de multiplicité des demandes.
      </P>
      <P>
        Si nous ne vous répondons pas, ou si notre réponse ne vous satisfait pas, vous pouvez adresser une réclamation à la Commission Nationale de l&apos;Informatique et des Libertés (CNIL), 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, <code>cnil.fr</code>. Les utilisateurs britanniques peuvent saisir l&apos;Information Commissioner&apos;s Office (ICO), <code>ico.org.uk</code>.
      </P>

      <H2>8. Cookies</H2>
      <P>
        Nous utilisons uniquement les cookies strictement nécessaires au fonctionnement du service : cookie de session, préférence de langue, jeton d&apos;authentification. Aucun cookie de mesure d&apos;audience tiers n&apos;est déposé sans consentement préalable. Tenu.World ne pratique pas la publicité comportementale.
      </P>
      <P>
        Un outil de gestion du consentement est affiché à la première visite pour recueillir votre avis sur l&apos;éventuel ajout futur de cookies non essentiels. Tant que le consentement n&apos;est pas donné, aucun cookie non essentiel n&apos;est déposé.
      </P>

      <H2>9. Sécurité</H2>
      <P>
        Les photographies et les rapports sont accessibles uniquement via des URL signées à durée limitée (maximum sept jours). L&apos;authentification utilise un lien magique sans mot de passe. Les communications sont chiffrées en transit (TLS 1.3). Les données au repos sont chiffrées côté hébergeur.
      </P>
      <P>
        Nous tenons un registre des traitements et un registre des incidents. Toute violation de données entraîne une notification à la CNIL dans les 72 heures conformément à l&apos;article 33 du RGPD, et une information directe des personnes concernées si le risque est élevé.
      </P>

      <H2>10. Mineurs</H2>
      <P>
        Le service Tenu.World s&apos;adresse à des adultes. Nous n&apos;autorisons pas la création de compte par une personne de moins de dix-huit ans. Si nous découvrons qu&apos;un compte a été ouvert par un mineur, nous le supprimons.
      </P>

      <H2>11. Modification de la présente politique</H2>
      <P>
        Nous pouvons modifier cette politique pour refléter une évolution légale ou technique. Toute modification substantielle fait l&apos;objet d&apos;une notification par email au minimum trente jours avant son entrée en vigueur. La version la plus récente est toujours consultable sur <code>tenu.world/legal/privacy/fr</code>.
      </P>

      <H2>12. Droit applicable</H2>
      <P>
        Le droit applicable est le droit français. Tout litige relatif au traitement de vos données relève de la compétence des tribunaux français, sans préjudice de votre droit de saisir votre juridiction de résidence habituelle au sein de l&apos;Union européenne.
      </P>

      <H2>Journal des versions</H2>
      <Table>
        <thead>
          <tr>
            <TH>Version</TH>
            <TH>Date</TH>
            <TH>Modification</TH>
          </tr>
        </thead>
        <tbody>
          <tr>
            <TD>v1.0-draft</TD>
            <TD>2026-04-17</TD>
            <TD>Version initiale, en attente de revue avocat</TD>
          </tr>
        </tbody>
      </Table>
    </LegalPage>
  );
}
