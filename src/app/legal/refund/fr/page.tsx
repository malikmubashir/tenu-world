// Politique de remboursement (v1.0-draft, 2026-04-17). Source: docs/legal-drafts/refund-fr.md
import LegalPage from "@/components/legal/LegalPage";
import { H2, P, OL, LI, Table, TH, TD, Callout, Placeholder } from "@/components/legal/Prose";

export const metadata = {
  title: "Politique de remboursement — Tenu.World",
  description: "Conditions de remboursement du service Tenu.World.",
};

export default function RefundFR() {
  return (
    <LegalPage
      meta={{
        title: "Politique de remboursement",
        version: "v1.0-draft",
        lastUpdated: "2026-04-17",
        statusLine: "DRAFT, en attente de revue avocat",
        localeLabel: "Français",
        otherLocaleHref: "/legal/refund/en",
        otherLocaleLabel: "English",
        draftBanner:
          "Version de travail. En attente de validation par Dr Mubashir et revue avocat. Non encore opposable.",
        backToIndex: "Documents légaux",
      }}
    >
      <H2>1. Principe général</H2>
      <P>
        Les services Tenu.World (rapport d&apos;analyse de dépôt de garantie et lettre type de contestation) sont des contenus numériques fournis sans support matériel, générés à la demande à partir des informations et des photographies que vous nous fournissez.
      </P>

      <H2>2. Droit de rétractation</H2>
      <P>
        En application de l&apos;article L221-28 1° du Code de la consommation, le droit de rétractation de quatorze jours ne peut pas être exercé pour un contrat de fourniture d&apos;un contenu numérique non fourni sur un support matériel dont l&apos;exécution a commencé avec votre accord préalable exprès et pour lequel vous avez expressément renoncé à votre droit de rétractation.
      </P>
      <P>
        Pour bénéficier de votre service sans attendre la fin du délai de quatorze jours, vous devez au moment du paiement :
      </P>
      <OL>
        <LI>Cocher la case «&nbsp;Je demande l&apos;exécution immédiate du service et je reconnais perdre mon droit de rétractation dès la délivrance du rapport&nbsp;».</LI>
        <LI>Confirmer votre accord exprès à cette renonciation.</LI>
      </OL>
      <P>Sans cette double action, le service n&apos;est pas lancé et votre carte n&apos;est pas débitée.</P>

      <H2>3. Conditions de remboursement</H2>
      <P>Trois cas de figure.</P>
      <P>
        <strong>Cas A : avant la génération du rapport.</strong> Si, après paiement, vous nous contactez avant que le rapport ait été généré (typiquement dans les deux à quinze minutes suivant le paiement, en fonction de la file d&apos;attente), nous annulons la commande et vous remboursons intégralement sous dix jours ouvrés.
      </P>
      <P>
        <strong>Cas B : après la génération du rapport, en cas de défaillance de notre service.</strong> Si le rapport généré est incomplet, illisible, ou n&apos;a pas été livré par email dans un délai de deux heures après paiement, vous avez droit à un remboursement intégral. Écrivez à <code>support@tenu.world</code> avec votre numéro de commande. Nous traitons votre demande sous quarante-huit heures.
      </P>
      <P>
        <strong>Cas C : après la génération d&apos;un rapport conforme.</strong> Le service étant exécuté et les coûts d&apos;analyse IA engagés de manière irréversible, aucun remboursement n&apos;est dû. Le rapport reste accessible dans votre compte et peut être téléchargé à nouveau pendant vingt-quatre mois.
      </P>
      <P>
        Les mêmes règles s&apos;appliquent à la lettre type de contestation : remboursement possible en cas B uniquement.
      </P>

      <H2>4. Modalités pratiques</H2>
      <P>
        Les remboursements sont opérés sur le moyen de paiement utilisé lors de la transaction initiale. Le délai de traitement chez Stripe est d&apos;un à trois jours ouvrés. Le délai d&apos;apparition sur votre relevé dépend ensuite de votre banque.
      </P>
      <P>
        Pour toute demande de remboursement, écrivez à <code>support@tenu.world</code> en indiquant votre numéro de commande et le motif. Nous ne pouvons pas traiter une demande formulée par un autre canal.
      </P>

      <H2>5. Litiges de paiement</H2>
      <P>
        En cas de contestation directe auprès de votre banque (chargeback) sans passage préalable par <code>support@tenu.world</code>, nous nous réservons le droit de suspendre l&apos;accès à votre compte le temps de l&apos;instruction. Un chargeback injustifié peut conduire à la résiliation définitive du compte.
      </P>

      <H2>6. Droit applicable</H2>
      <P>
        La présente politique est régie par le droit français. Tout litige relève de la compétence du tribunal de commerce de Paris, sans préjudice des dispositions protectrices du Code de la consommation applicables aux consommateurs.
      </P>
      <P>
        Si vous êtes consommateur, vous pouvez recourir à la médiation de la consommation conformément aux articles L611-1 et suivants du Code de la consommation. Le médiateur auquel adhère Tenu.World sera communiqué ici avant l&apos;ouverture commerciale.
      </P>
      <Callout>
        <Placeholder>[MEDIATEUR PENDING]</Placeholder> adhésion non encore signée. Dr Mubashir sollicite des recommandations via HEC GEMM et le conseil MHF avant de choisir entre MEDICYS, SMCE ou AME Conso.
      </Callout>
      <P>
        Vous pouvez également utiliser la plateforme européenne de règlement en ligne des litiges de consommation à l&apos;adresse <code>https://ec.europa.eu/consumers/odr</code>.
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
            <TD>Version initiale, renonciation L221-28 explicite, trois cas de remboursement</TD>
          </tr>
        </tbody>
      </Table>
    </LegalPage>
  );
}
