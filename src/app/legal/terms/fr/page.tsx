// Conditions générales d'utilisation (v1.0-draft, 2026-04-17). Source: docs/legal-drafts/terms-fr.md
import LegalPage from "@/components/legal/LegalPage";
import { H2, P, UL, LI, Table, TH, TD, Callout, Placeholder } from "@/components/legal/Prose";

export const metadata = {
  title: "Conditions générales d'utilisation — Tenu.World",
  description: "CGU du service Tenu.World.",
};

export default function TermsFR() {
  return (
    <LegalPage
      meta={{
        title: "Conditions générales d'utilisation",
        version: "v1.0-draft",
        lastUpdated: "2026-04-17",
        statusLine: "DRAFT, en attente de revue avocat",
        localeLabel: "Français",
        otherLocaleHref: "/legal/terms/en",
        otherLocaleLabel: "English",
        draftBanner:
          "Version de travail. En attente de validation par Dr Mubashir et revue avocat. Non encore opposable.",
        backToIndex: "Documents légaux",
      }}
    >
      <H2>1. Objet</H2>
      <P>
        Les présentes conditions générales régissent l&apos;accès et l&apos;utilisation du service Tenu.World accessible à l&apos;adresse <code>tenu.world</code>, édité par Global Apex.Net, société par actions simplifiée au capital de 100 euros, immatriculée au RCS de Versailles sous le numéro 941 666 067, dont le siège social est situé 4 Boulevard du Château, 78280 Guyancourt, France (ci-après «&nbsp;Tenu&nbsp;», «&nbsp;nous&nbsp;»).
      </P>
      <P>
        L&apos;utilisateur final (ci-après «&nbsp;vous&nbsp;») accepte ces conditions en créant un compte ou en utilisant le service.
      </P>

      <H2>2. Description du service</H2>
      <P>
        Tenu.World est un outil d&apos;assistance à la gestion du dépôt de garantie locatif à destination des locataires en France et au Royaume-Uni. Le service comprend :
      </P>
      <UL>
        <LI>la génération d&apos;un <strong>rapport d&apos;analyse</strong> à partir des photographies que vous fournissez, via une analyse par intelligence artificielle, qui estime la vétusté des éléments observés et indique la part raisonnablement déductible du dépôt de garantie ;</LI>
        <LI>en option, la génération d&apos;une <strong>lettre type de contestation</strong> préremplie à destination de votre bailleur, dans le format d&apos;usage pour la juridiction choisie (France : lettre recommandée avec accusé de réception ; Royaume-Uni : lettre formelle au bailleur ou au dispositif TDS/DPS) ;</LI>
        <LI>l&apos;envoi d&apos;un <strong>questionnaire de suivi</strong> quatorze jours après émission du rapport pour recueillir l&apos;issue du litige.</LI>
      </UL>
      <P>
        <strong>Le rapport et la lettre constituent des modèles documentaires.</strong> Ils ne constituent pas un avis juridique. Ils ne sauraient se substituer à la consultation d&apos;un professionnel du droit. Tenu n&apos;exerce aucune activité de représentation juridique au sens de la loi n° 71-1130 du 31 décembre 1971.
      </P>

      <H2>3. Création de compte</H2>
      <P>
        L&apos;ouverture d&apos;un compte nécessite une adresse email valide. L&apos;authentification s&apos;effectue par lien magique, sans mot de passe. Vous vous engagez à fournir une adresse email que vous contrôlez et à protéger l&apos;accès à votre boîte de réception.
      </P>
      <P>
        Le service est réservé aux personnes majeures. Vous déclarez avoir au moins dix-huit ans.
      </P>

      <H2>4. Engagements de l&apos;utilisateur</H2>
      <P>En utilisant Tenu, vous vous engagez à :</P>
      <UL>
        <LI>fournir des informations exactes (adresse du logement, juridiction, identité du bailleur, date d&apos;entrée dans les lieux) ;</LI>
        <LI>ne téléverser que des photographies prises dans le cadre de votre location, dont vous êtes l&apos;auteur ou pour lesquelles vous disposez des droits nécessaires ;</LI>
        <LI>ne pas utiliser le service pour créer des litiges infondés, falsifier un état des lieux ou contourner une décision de justice ;</LI>
        <LI>ne pas utiliser le service à des fins commerciales autres que la gestion personnelle de votre propre location ;</LI>
        <LI>ne pas tenter d&apos;accéder aux données d&apos;autres utilisateurs, de contourner les mesures de sécurité, ou de mener des opérations automatisées (scraping, bot) sans notre accord écrit préalable.</LI>
      </UL>

      <H2>5. Tarification et paiement</H2>
      <P>
        Le service est payant. Les prix en vigueur sont affichés au moment du paiement et peuvent évoluer. Le paiement est traité par Stripe. La facture est émise au nom indiqué à la commande.
      </P>
      <P>Aux conditions actuelles :</P>
      <UL>
        <LI>Rapport d&apos;analyse : 15 euros forfaitaires en France, 15 livres sterling au Royaume-Uni, ajustés à partir du quatrième mois par pièce supplémentaire.</LI>
        <LI>Lettre type de contestation : 25 euros / 25 livres sterling par lettre générée.</LI>
      </UL>
      <P>
        Les conditions de remboursement sont détaillées dans la politique de remboursement, consultable à <code>tenu.world/legal/refund/fr</code>.
      </P>

      <H2>6. Propriété intellectuelle</H2>
      <P>
        Tenu conserve la pleine propriété du logiciel, des interfaces, des modèles d&apos;analyse, des grilles de vétusté, des gabarits de lettre, des contenus pédagogiques et de tout élément constitutif du service.
      </P>
      <P>
        Vous conservez la pleine propriété des photographies et des observations textuelles que vous téléversez. Vous nous accordez, pour la durée du service et dans la stricte mesure nécessaire à l&apos;exécution du contrat, une licence non exclusive d&apos;utilisation pour générer le rapport et la lettre, les stocker de manière chiffrée et les mettre à votre disposition.
      </P>
      <P>
        Vos données ne sont <strong>jamais</strong> utilisées pour entraîner des modèles d&apos;intelligence artificielle. Les instructions API envoyées à nos sous-traitants IA (notamment Anthropic) incluent l&apos;option de non-réutilisation pour l&apos;entraînement.
      </P>

      <H2>7. Responsabilité</H2>
      <P>
        Tenu fournit le service en l&apos;état et met en œuvre une obligation de moyens. Le rapport et la lettre sont produits par analyse automatisée et peuvent comporter des erreurs d&apos;appréciation. Vous restez seul responsable de l&apos;usage que vous faites du rapport et de la lettre, notamment dans vos échanges avec votre bailleur, le dispositif de cautionnement ou les juridictions compétentes.
      </P>
      <P>
        Notre responsabilité contractuelle est limitée, en toute hypothèse et à l&apos;exception des cas d&apos;application obligatoire de dispositions impératives plus protectrices, au montant payé par vous au titre du service concerné lors des douze mois précédant le fait générateur de la réclamation.
      </P>
      <P>Nous ne sommes pas responsables :</P>
      <UL>
        <LI>de l&apos;issue du litige locatif avec votre bailleur ;</LI>
        <LI>du refus d&apos;un dispositif de cautionnement (TDS, DPS, CDC) d&apos;ordonner la restitution ;</LI>
        <LI>des erreurs d&apos;appréciation du modèle d&apos;intelligence artificielle dans des limites raisonnables ;</LI>
        <LI>des interruptions de service dues à un cas de force majeure ou à une panne de nos sous-traitants d&apos;hébergement.</LI>
      </UL>

      <H2>8. Force majeure</H2>
      <P>
        Aucune des parties ne sera tenue responsable d&apos;un manquement à ses obligations résultant d&apos;un cas de force majeure au sens de l&apos;article 1218 du Code civil.
      </P>

      <H2>9. Modification des présentes conditions</H2>
      <P>
        Nous pouvons modifier les présentes conditions. Toute modification substantielle vous est notifiée par email au minimum trente jours avant son entrée en vigueur. La poursuite de votre utilisation du service après cette date vaut acceptation. Si vous refusez la modification, vous pouvez clôturer votre compte avant l&apos;entrée en vigueur.
      </P>

      <H2>10. Résiliation</H2>
      <P>
        Vous pouvez clôturer votre compte à tout moment depuis <code>tenu.world/fr/compte</code>. La clôture entraîne la suppression de vos données dans les conditions définies par la politique de confidentialité, sous réserve des obligations légales de conservation.
      </P>
      <P>
        Nous pouvons suspendre ou clôturer votre compte en cas de manquement grave ou répété aux présentes conditions, de fraude avérée, ou de chargeback injustifié. Nous vous informons par email en précisant le motif.
      </P>

      <H2>11. Droit applicable et résolution des litiges</H2>
      <P>Les présentes conditions sont régies par le droit français.</P>
      <P>
        <strong>Tentative préalable de règlement amiable.</strong> Avant toute saisine judiciaire, vous êtes invité à adresser votre réclamation à <code>support@tenu.world</code>. Nous nous engageons à vous répondre sous dix jours ouvrés.
      </P>
      <P>
        <strong>Médiation de la consommation.</strong> Conformément aux articles L611-1 et suivants du Code de la consommation, vous pouvez recourir gratuitement à un médiateur de la consommation. Le médiateur désigné par Tenu sera publié ici avant l&apos;ouverture commerciale.
      </P>
      <Callout>
        <Placeholder>[MEDIATEUR PENDING]</Placeholder> choix du médiateur en attente. Dr Mubashir consulte les recommandations du réseau HEC GEMM et du conseil MHF avant de signer avec MEDICYS, SMCE ou AME Conso.
      </Callout>
      <P>
        <strong>Plateforme européenne.</strong> Vous pouvez également utiliser la plateforme européenne de règlement en ligne des litiges de consommation : <code>https://ec.europa.eu/consumers/odr</code>.
      </P>
      <P>
        <strong>Tribunal compétent.</strong> À défaut de résolution amiable et sous réserve des règles protectrices du Code de la consommation, tout litige relève du tribunal de commerce de Paris.
      </P>

      <H2>12. Contact</H2>
      <P>
        Pour toute question relative aux présentes conditions, écrivez à <code>support@tenu.world</code>. Pour toute question relative à vos données personnelles, voir la politique de confidentialité.
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
            <TD>Version initiale, 12 articles, lettre type non juridique, médiation obligatoire préalable</TD>
          </tr>
        </tbody>
      </Table>
    </LegalPage>
  );
}
