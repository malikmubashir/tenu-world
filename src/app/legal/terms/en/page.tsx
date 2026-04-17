// Terms of Service (v1.0-draft, 2026-04-17). Source: docs/legal-drafts/terms-en.md
import LegalPage from "@/components/legal/LegalPage";
import { H2, P, UL, LI, Table, TH, TD, Callout, Placeholder } from "@/components/legal/Prose";

export const metadata = {
  title: "Terms of Service — Tenu.World",
  description: "Terms governing use of Tenu.World.",
};

export default function TermsEN() {
  return (
    <LegalPage
      meta={{
        title: "Terms of Service",
        version: "v1.0-draft",
        lastUpdated: "2026-04-17",
        statusLine: "DRAFT, pending counsel review",
        localeLabel: "English",
        otherLocaleHref: "/legal/terms/fr",
        otherLocaleLabel: "Français",
        draftBanner:
          "Working draft. Awaiting Dr Mubashir approval and legal review. Not yet binding.",
        backToIndex: "Legal documents",
      }}
    >
      <H2>1. Purpose</H2>
      <P>
        These terms govern access to and use of the Tenu.World service available at <code>tenu.world</code>, operated by Global Apex.Net, a French simplified joint-stock company (SAS) with share capital of EUR 100, registered with the Versailles Commercial Register under number 941 666 067, whose registered office is at 4 Boulevard du Château, 78280 Guyancourt, France (&quot;Tenu&quot;, &quot;we&quot;).
      </P>
      <P>You accept these terms by creating an account or using the service.</P>

      <H2>2. Service description</H2>
      <P>
        Tenu.World is a tenant-facing tool for managing rental deposit disputes in France and the United Kingdom. The service includes:
      </P>
      <UL>
        <LI>generation of a <strong>risk analysis report</strong> from photographs you provide, via artificial intelligence analysis, estimating wear and tear on observed items and indicating the portion of the deposit that can reasonably be deducted;</LI>
        <LI>optionally, generation of a <strong>template dispute letter</strong> pre-filled for your landlord, in the format customary for the chosen jurisdiction (France: recorded-delivery letter with acknowledgement of receipt; UK: formal letter to the landlord or to the TDS/DPS scheme);</LI>
        <LI>a <strong>follow-up questionnaire</strong> fourteen days after the report is issued to gather the outcome of the dispute.</LI>
      </UL>
      <P>
        <strong>The report and the letter are document templates.</strong> They do not constitute legal advice. They cannot replace consultation with a qualified solicitor. Tenu does not engage in legal representation within the meaning of Law No. 71-1130 of 31 December 1971, nor within the meaning of the Legal Services Act 2007 in the UK.
      </P>

      <H2>3. Account creation</H2>
      <P>
        Opening an account requires a valid email address. Authentication is by magic link, without a password. You undertake to provide an email address you control and to protect access to your inbox.
      </P>
      <P>
        The service is reserved for adults. You confirm that you are at least eighteen years of age.
      </P>

      <H2>4. User undertakings</H2>
      <P>When using Tenu you undertake to:</P>
      <UL>
        <LI>provide accurate information (property address, jurisdiction, landlord identity, move-in date);</LI>
        <LI>upload only photographs taken within your own tenancy that you authored or have the necessary rights to;</LI>
        <LI>not use the service to create baseless disputes, falsify an inventory, or circumvent a court decision;</LI>
        <LI>not use the service for commercial purposes other than the personal management of your own tenancy;</LI>
        <LI>not attempt to access other users&apos; data, bypass security measures, or run automated operations (scraping, bots) without our prior written consent.</LI>
      </UL>

      <H2>5. Pricing and payment</H2>
      <P>
        The service is paid. Prices in effect are displayed at checkout and may change. Payment is processed by Stripe. The invoice is issued in the name provided at checkout.
      </P>
      <P>Current pricing:</P>
      <UL>
        <LI>Risk analysis report: EUR 15 in France, GBP 15 in the United Kingdom, adjusted from month four onwards per additional room.</LI>
        <LI>Template dispute letter: EUR 25 / GBP 25 per letter generated.</LI>
      </UL>
      <P>
        Refund terms are set out in the refund policy at <code>tenu.world/legal/refund/en</code>.
      </P>

      <H2>6. Intellectual property</H2>
      <P>
        Tenu retains full ownership of the software, interfaces, analysis models, wear-and-tear grids, letter templates, educational content and any component of the service.
      </P>
      <P>
        You retain full ownership of the photographs and text observations you upload. You grant us, for the duration of the service and strictly as necessary to perform the contract, a non-exclusive licence to use them to generate the report and letter, to store them encrypted, and to make them available to you.
      </P>
      <P>
        Your data is <strong>never</strong> used to train artificial intelligence models. API calls to our AI sub-processors (including Anthropic) include the training opt-out flag.
      </P>

      <H2>7. Liability</H2>
      <P>
        Tenu provides the service as is and on a best-efforts basis. The report and the letter are produced by automated analysis and may contain errors of judgement. You remain solely responsible for how you use the report and the letter, in particular in dealings with your landlord, the deposit protection scheme, or the competent courts.
      </P>
      <P>
        Our contractual liability is limited, in all cases and save for the mandatory application of more protective mandatory provisions, to the amount you paid for the relevant service in the twelve months preceding the event giving rise to the claim.
      </P>
      <P>We are not liable for:</P>
      <UL>
        <LI>the outcome of the tenancy dispute with your landlord;</LI>
        <LI>the refusal of a deposit protection scheme (TDS, DPS, CDC) to order return of the deposit;</LI>
        <LI>errors of judgement of the AI model within reasonable limits;</LI>
        <LI>service interruptions due to force majeure or to an outage of our hosting sub-processors.</LI>
      </UL>

      <H2>8. Force majeure</H2>
      <P>
        Neither party shall be liable for a failure to perform its obligations resulting from a force majeure event within the meaning of Article 1218 of the French Civil Code, or the equivalent under English law where applicable.
      </P>

      <H2>9. Changes to these terms</H2>
      <P>
        We may amend these terms. Any material change will be notified to you by email at least thirty days before it comes into force. Continued use of the service after that date means acceptance. If you refuse the change, you may close your account before the entry into force.
      </P>

      <H2>10. Termination</H2>
      <P>
        You may close your account at any time from <code>tenu.world/en/account</code>. Closure triggers deletion of your data under the conditions set out in the privacy policy, subject to statutory retention obligations.
      </P>
      <P>
        We may suspend or close your account in the event of a serious or repeated breach of these terms, proven fraud, or an unjustified chargeback. We notify you by email stating the reason.
      </P>

      <H2>11. Governing law and dispute resolution</H2>
      <P>These terms are governed by French law.</P>
      <P>
        <strong>Prior attempt at amicable settlement.</strong> Before any court action, you are invited to submit your complaint to <code>support@tenu.world</code>. We undertake to reply within ten business days.
      </P>
      <P>
        <strong>Consumer mediation (France).</strong> Under Articles L611-1 and following of the French Consumer Code, French consumers may use a consumer mediator free of charge. The mediator appointed by Tenu will be published here before commercial launch.
      </P>
      <Callout>
        <Placeholder>[MEDIATOR PENDING]</Placeholder> mediator selection on hold. Recommendations are being gathered from our professional network before signing with MEDICYS, SMCE or AME Conso.
      </Callout>
      <P>
        <strong>European platform.</strong> EU consumers may also use the European Online Dispute Resolution platform: <code>https://ec.europa.eu/consumers/odr</code>.
      </P>
      <P>
        <strong>Competent court.</strong> Failing amicable resolution and subject to the protective rules of the French Consumer Code, any dispute falls under the jurisdiction of the Commercial Court of Paris. UK consumers retain the right to bring proceedings before English and Welsh courts for matters arising in the UK.
      </P>

      <H2>12. Contact</H2>
      <P>
        For any question about these terms, write to <code>support@tenu.world</code>. For any question about your personal data, see the privacy policy.
      </P>

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
            <TD>Initial version, 12 articles, template-not-advice clause, mandatory mediation step</TD>
          </tr>
        </tbody>
      </Table>
    </LegalPage>
  );
}
