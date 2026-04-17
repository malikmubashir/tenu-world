// Refund Policy (v1.0-draft, 2026-04-17). Source: docs/legal-drafts/refund-en.md
import LegalPage from "@/components/legal/LegalPage";
import { H2, P, OL, LI, Table, TH, TD, Callout, Placeholder } from "@/components/legal/Prose";

export const metadata = {
  title: "Refund Policy — Tenu.World",
  description: "Refund conditions for Tenu.World services.",
};

export default function RefundEN() {
  return (
    <LegalPage
      meta={{
        title: "Refund Policy",
        version: "v1.0-draft",
        lastUpdated: "2026-04-17",
        statusLine: "DRAFT, pending counsel review",
        localeLabel: "English",
        otherLocaleHref: "/legal/refund/fr",
        otherLocaleLabel: "Français",
        draftBanner:
          "Working draft. Awaiting Dr Mubashir approval and legal review. Not yet binding.",
        backToIndex: "Legal documents",
      }}
    >
      <H2>1. General principle</H2>
      <P>
        Tenu.World services (deposit risk report and template dispute letter) are digital content supplied without a material medium, generated on demand from the information and photographs you provide.
      </P>

      <H2>2. Right of withdrawal</H2>
      <P>
        Under Article L221-28 1° of the French Consumer Code (applicable to contracts formed in France), the fourteen-day right of withdrawal does not apply to the supply of digital content not provided on a material medium where performance has begun with your prior express consent and you have expressly waived your right of withdrawal.
      </P>
      <P>
        For UK consumers, the equivalent waiver applies under Regulation 37(1)(a) and 37(2) of the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013.
      </P>
      <P>
        To receive your service without waiting for the end of the fourteen-day period, at checkout you must:
      </P>
      <OL>
        <LI>Tick the box &quot;I request immediate execution of the service and acknowledge that I will lose my right of withdrawal once the report is delivered&quot;.</LI>
        <LI>Expressly confirm this waiver.</LI>
      </OL>
      <P>Without this double action the service is not started and your card is not charged.</P>

      <H2>3. Refund scenarios</H2>
      <P>Three cases.</P>
      <P>
        <strong>Case A: before the report is generated.</strong> If, after paying, you contact us before the report has been generated (typically two to fifteen minutes after payment depending on queue length), we cancel the order and fully refund you within ten business days.
      </P>
      <P>
        <strong>Case B: after the report is generated, in case of a service failure on our side.</strong> If the generated report is incomplete, unreadable, or has not been delivered by email within two hours of payment, you are entitled to a full refund. Write to <code>support@tenu.world</code> with your order number. We process your request within forty-eight hours.
      </P>
      <P>
        <strong>Case C: after a compliant report has been generated.</strong> The service has been performed and AI analysis costs have been incurred irreversibly. No refund is due. The report remains available in your account and can be re-downloaded for twenty-four months.
      </P>
      <P>The same rules apply to the template dispute letter: refund possible in Case B only.</P>

      <H2>4. Practical details</H2>
      <P>
        Refunds are made to the payment method used for the original transaction. Stripe processing time is one to three business days. The time it takes to appear on your statement then depends on your bank.
      </P>
      <P>
        For any refund request, write to <code>support@tenu.world</code> stating your order number and the reason. We cannot process a request made through any other channel.
      </P>

      <H2>5. Payment disputes</H2>
      <P>
        If you initiate a chargeback with your bank without first contacting <code>support@tenu.world</code>, we reserve the right to suspend access to your account during investigation. An unjustified chargeback may lead to permanent account closure.
      </P>

      <H2>6. Governing law</H2>
      <P>
        This policy is governed by French law. Any dispute falls under the jurisdiction of the Commercial Court of Paris, without prejudice to consumer protection provisions of the French Consumer Code.
      </P>
      <P>
        UK consumers retain the protections of UK consumer law and may bring proceedings before English and Welsh courts for matters arising in the UK.
      </P>
      <P>
        Consumers in the EU may use the European Online Dispute Resolution platform at <code>https://ec.europa.eu/consumers/odr</code>.
      </P>
      <P>
        For French consumers, consumer mediation is available under Articles L611-1 and following of the Consumer Code. The appointed mediator will be disclosed here before commercial launch.
      </P>
      <Callout>
        <Placeholder>[MEDIATOR PENDING]</Placeholder> membership not yet signed. Recommendations are being gathered from our professional network before choosing between MEDICYS, SMCE or AME Conso.
      </Callout>

      <H2>Version log</H2>
      <Table>
        <thead>
          <tr>
            <TH>Version</TH>
            <TH>Date</TH>
            <TH>Change</TH>
          </tr>
        </thead>
        <tbody>
          <tr>
            <TD>v1.0-draft</TD>
            <TD>2026-04-17</TD>
            <TD>Initial version, explicit L221-28 / UK Reg 37 waiver, three refund scenarios</TD>
          </tr>
        </tbody>
      </Table>
    </LegalPage>
  );
}
