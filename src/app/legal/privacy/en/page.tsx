// Privacy Policy (v1.0-draft, 2026-04-17). Source: docs/legal-drafts/privacy-en.md
import LegalPage from "@/components/legal/LegalPage";
import { H2, P, UL, LI, Table, TH, TD, Callout, Placeholder } from "@/components/legal/Prose";

export const metadata = {
  title: "Privacy Policy — Tenu.World",
  description: "How Tenu.World handles your personal data.",
};

export default function PrivacyEN() {
  return (
    <LegalPage
      meta={{
        title: "Privacy Policy",
        version: "v1.0-draft",
        lastUpdated: "2026-04-17",
        statusLine: "DRAFT, pending counsel review",
        localeLabel: "English",
        otherLocaleHref: "/legal/privacy/fr",
        otherLocaleLabel: "Français",
        draftBanner:
          "Working draft. Awaiting Dr Mubashir approval and legal review. Not yet binding.",
        backToIndex: "Legal documents",
      }}
    >
      <H2>1. Who processes your data</H2>
      <P>
        The data controller is <strong>Global Apex.Net</strong>, a French simplified joint-stock company (SAS) with share capital of EUR 100, registered with the Versailles Commercial Register under number 941 666 067, with its registered office at 4 Boulevard du Château, 78280 Guyancourt, France. VAT number: FR89 941 666 067. NAF code 62.02A. Global Apex.Net publishes and operates the Tenu.World service accessible at <code>tenu.world</code>.
      </P>
      <P>
        For any question about your data, please contact our GDPR point of contact at <code>dpo@tenu.world</code>. We reply within one month at the latest.
      </P>
      <P>
        Global Apex.Net is not required to appoint a data protection officer under Article 37 of the GDPR. The address <code>dpo@tenu.world</code> is a single point of contact for data protection enquiries.
      </P>

      <H2>2. What data we collect</H2>
      <P>We process three categories of data.</P>
      <P>
        <strong>Account data.</strong> Email address, language preference, registration date. Collected when you create an account using a magic link.
      </P>
      <P>
        <strong>Inspection data.</strong> Property address, applicable jurisdiction (France or United Kingdom), landlord name where you provide it, room-by-room photographs, free-text observations you add.
      </P>
      <P>
        <strong>Payment data.</strong> Name, billing address, amount paid, transaction timestamp. Card numbers are never collected or stored by Tenu.World and are processed directly by Stripe.
      </P>
      <P>
        We do not collect any special-category data as defined in Article 9 of the GDPR or the UK GDPR.
      </P>

      <H2>3. Legal basis</H2>
      <P>We rely on two distinct legal bases depending on purpose.</P>
      <P>
        <strong>Consent (Article 6.1.a of the GDPR / UK GDPR)</strong> for the processing of photographs and observations you entrust to us. Consent is requested explicitly before any upload. You may withdraw it at any time, which triggers deletion of the photographs in question.
      </P>
      <P>
        <strong>Performance of a contract (Article 6.1.b of the GDPR / UK GDPR)</strong> for generating the deposit risk report, generating the template dispute letter, issuing invoices and processing card payments.
      </P>

      <H2>4. How long we keep your data</H2>
      <Table>
        <thead>
          <tr>
            <TH>Category</TH>
            <TH>Retention period</TH>
            <TH>Reason</TH>
          </tr>
        </thead>
        <tbody>
          <tr>
            <TD>Account data</TD>
            <TD>As long as the account is active, plus 12 months after closure</TD>
            <TD>Possible post-service claims</TD>
          </tr>
          <tr>
            <TD>Inspection photographs and observations</TD>
            <TD>24 months from the inspection date</TD>
            <TD>Typical duration of a tenancy dispute</TD>
          </tr>
          <tr>
            <TD>Generated PDF reports and letters</TD>
            <TD>24 months</TD>
            <TD>Evidence archive</TD>
          </tr>
          <tr>
            <TD>Invoicing records</TD>
            <TD>10 years</TD>
            <TD>Accounting obligation (Article L123-22 French Commercial Code; UK Companies Act equivalent)</TD>
          </tr>
          <tr>
            <TD>Anonymised technical logs</TD>
            <TD>6 months</TD>
            <TD>Security and fraud detection</TD>
          </tr>
        </tbody>
      </Table>
      <P>
        Beyond these periods, data is deleted automatically by our purge system. You can request early deletion at any time (see section 7).
      </P>

      <H2>5. Where your data is hosted</H2>
      <P>
        All data is hosted within the European Union or the United Kingdom. No transfer outside this area takes place in the normal course of the service.
      </P>
      <UL>
        <LI>Database and authentication: Supabase, European region (Frankfurt, Germany).</LI>
        <LI>Photographs and PDF reports: Cloudflare R2, EU region.</LI>
        <LI>Web hosting platform: Vercel, CDG region (Paris).</LI>
        <LI>Transactional email delivery: Brevo (formerly Sendinblue), France.</LI>
        <LI>Payment: Stripe, PCI-DSS compliant, European entity Stripe Technology Europe Ltd., Dublin.</LI>
        <LI>AI analysis: Anthropic via API, processing in the EU regions of Anthropic infrastructure.</LI>
      </UL>
      <Callout>
        <Placeholder>[TO VERIFY WITH COUNSEL]</Placeholder> confirm Anthropic processing region at the time the DPA is signed. Anthropic states EU-only processing but this must be audited.
      </Callout>

      <H2>6. Sub-processors</H2>
      <P>
        The companies below process your data on our behalf under a processing agreement compliant with Article 28 of the GDPR.
      </P>
      <Table>
        <thead>
          <tr>
            <TH>Sub-processor</TH>
            <TH>Purpose</TH>
            <TH>Seat</TH>
            <TH>Contract</TH>
          </tr>
        </thead>
        <tbody>
          <tr>
            <TD>Supabase Inc.</TD>
            <TD>Database and authentication</TD>
            <TD>Delaware, USA (infra in EU Frankfurt)</TD>
            <TD>DPA signed</TD>
          </tr>
          <tr>
            <TD>Cloudflare Inc.</TD>
            <TD>Photograph and PDF storage</TD>
            <TD>San Francisco, USA (infra in EU)</TD>
            <TD>DPA signed</TD>
          </tr>
          <tr>
            <TD>Stripe Technology Europe Ltd.</TD>
            <TD>Payment</TD>
            <TD>Dublin, Ireland</TD>
            <TD>DPA signed</TD>
          </tr>
          <tr>
            <TD>Anthropic PBC</TD>
            <TD>AI analysis</TD>
            <TD>San Francisco, USA (infra in EU)</TD>
            <TD>DPA signed</TD>
          </tr>
          <tr>
            <TD>Brevo SA</TD>
            <TD>Email delivery</TD>
            <TD>Paris, France</TD>
            <TD>DPA signed</TD>
          </tr>
          <tr>
            <TD>Vercel Inc.</TD>
            <TD>Web hosting</TD>
            <TD>San Francisco, USA (infra in EU)</TD>
            <TD>DPA signed</TD>
          </tr>
        </tbody>
      </Table>
      <P>
        DPAs are available on request at <code>dpo@tenu.world</code>.
      </P>

      <H2>7. Your rights</H2>
      <P>
        Under the GDPR, the UK GDPR and applicable national law, you have the following rights. You can exercise them by writing to <code>dpo@tenu.world</code> from the email address associated with your account.
      </P>
      <UL>
        <LI><strong>Right of access</strong> to your data.</LI>
        <LI><strong>Right to rectification</strong> if data is inaccurate.</LI>
        <LI><strong>Right to erasure</strong> (right to be forgotten), subject to legal retention obligations (notably invoicing).</LI>
        <LI><strong>Right to data portability</strong>: you can receive your data in a structured, machine-readable format.</LI>
        <LI><strong>Right to object</strong> to processing.</LI>
        <LI><strong>Right to withdraw consent</strong> at any time for processing based on consent.</LI>
        <LI><strong>Right to lodge directives concerning your data after death</strong> (Article 85 French Data Protection Act; not applicable to UK users).</LI>
      </UL>
      <P>
        We reply within one month, extended by up to two additional months where the request is complex or multiple.
      </P>
      <P>
        If we do not reply, or if our reply does not satisfy you, you may lodge a complaint with:
      </P>
      <UL>
        <LI>For users in France: the Commission Nationale de l&apos;Informatique et des Libertés (CNIL), 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, <code>cnil.fr</code>.</LI>
        <LI>For users in the United Kingdom: the Information Commissioner&apos;s Office (ICO), Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF, <code>ico.org.uk</code>.</LI>
      </UL>

      <H2>8. Cookies</H2>
      <P>
        We use only strictly necessary cookies: session cookie, language preference, authentication token. No third-party analytics cookie is set without prior consent. Tenu.World does not engage in behavioural advertising.
      </P>
      <P>
        A consent banner is shown on first visit to collect your preference on any future non-essential cookies. Until consent is granted, no non-essential cookie is set.
      </P>

      <H2>9. Security</H2>
      <P>
        Photographs and reports are accessible only via time-limited signed URLs (maximum seven days). Authentication uses passwordless magic links. Communications are encrypted in transit (TLS 1.3). Data at rest is encrypted by our hosting partners.
      </P>
      <P>
        We maintain a processing register and an incident register. Any data breach is notified to the CNIL (and, for UK users, the ICO) within 72 hours in accordance with Article 33 of the GDPR, and to affected individuals directly where the risk is high.
      </P>

      <H2>10. Minors</H2>
      <P>
        Tenu.World is intended for adults. We do not allow accounts to be opened by anyone under the age of eighteen. If we become aware that an account has been opened by a minor, we delete it.
      </P>

      <H2>11. Changes to this policy</H2>
      <P>
        We may amend this policy to reflect legal or technical changes. Material changes are notified by email at least thirty days before they come into force. The latest version is always available at <code>tenu.world/legal/privacy/en</code>.
      </P>

      <H2>12. Governing law</H2>
      <P>
        The governing law is French law. Any dispute relating to the processing of your data falls under the jurisdiction of the French courts, without prejudice to your right to bring proceedings in your place of habitual residence within the European Union. UK users retain the rights granted by the UK GDPR and the Data Protection Act 2018, and may seek redress through UK courts for matters arising in the UK.
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
            <TD>Initial version, awaiting legal review</TD>
          </tr>
        </tbody>
      </Table>
    </LegalPage>
  );
}
