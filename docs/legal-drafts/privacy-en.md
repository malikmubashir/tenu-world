# Privacy Policy — Tenu.World

**Version:** v1.0-draft
**Last updated:** 2026-04-17
**Status:** DRAFT awaiting Dr Mubashir approval and legal review

---

## 1. Who processes your data

The data controller is **Global Apex.Net**, a French simplified joint-stock company (SAS) with share capital of EUR 100, registered with the Versailles Commercial Register under number 941 666 067, with its registered office at 4 Boulevard du Château, 78280 Guyancourt, France. VAT number: FR89 941 666 067. NAF code 62.02A. Global Apex.Net publishes and operates the Tenu.World service accessible at `tenu.world`.

For any question about your data, please contact our GDPR point of contact at `dpo@tenu.world`. We reply within one month at the latest.

Global Apex.Net is not required to appoint a data protection officer under Article 37 of the GDPR. The address `dpo@tenu.world` is a single point of contact for data protection enquiries.

## 2. What data we collect

We process three categories of data.

**Account data.** Email address, language preference, registration date. Collected when you create an account using a magic link.

**Inspection data.** Property address, applicable jurisdiction (France or United Kingdom), landlord name where you provide it, room-by-room photographs, free-text observations you add.

**Payment data.** Name, billing address, amount paid, transaction timestamp. Card numbers are never collected or stored by Tenu.World and are processed directly by Stripe.

We do not collect any special-category data as defined in Article 9 of the GDPR or the UK GDPR.

## 3. Legal basis

We rely on two distinct legal bases depending on purpose.

**Consent (Article 6.1.a of the GDPR / UK GDPR)** for the processing of photographs and observations you entrust to us. Consent is requested explicitly before any upload. You may withdraw it at any time, which triggers deletion of the photographs in question.

**Performance of a contract (Article 6.1.b of the GDPR / UK GDPR)** for generating the deposit risk report, generating the template dispute letter, issuing invoices and processing card payments.

## 4. How long we keep your data

| Category | Retention period | Reason |
|---|---|---|
| Account data | As long as the account is active, plus 12 months after closure | Possible post-service claims |
| Inspection photographs and observations | 24 months from the inspection date | Typical duration of a tenancy dispute |
| Generated PDF reports and letters | 24 months | Evidence archive |
| Invoicing records | 10 years | Accounting obligation (Article L123-22 French Commercial Code; UK Companies Act equivalent) |
| Anonymised technical logs | 6 months | Security and fraud detection |

Beyond these periods, data is deleted automatically by our purge system. You can request early deletion at any time (see section 7).

## 5. Where your data is hosted

All data is hosted within the European Union or the United Kingdom. No transfer outside this area takes place in the normal course of the service.

- Database and authentication: Supabase, European region (Frankfurt, Germany).
- Photographs and PDF reports: Cloudflare R2, EU region.
- Web hosting platform: Vercel, CDG region (Paris).
- Transactional email delivery: Brevo (formerly Sendinblue), France.
- Payment: Stripe, PCI-DSS compliant, European entity Stripe Technology Europe Ltd., Dublin.
- AI analysis: Anthropic via API, processing in the EU regions of Anthropic infrastructure.

`[TO VERIFY WITH COUNSEL: confirm Anthropic processing region at the time the DPA is signed. Anthropic states EU-only processing but this must be audited.]`

## 6. Sub-processors

The companies below process your data on our behalf under a processing agreement compliant with Article 28 of the GDPR.

| Sub-processor | Purpose | Seat | Contract |
|---|---|---|---|
| Supabase Inc. | Database and authentication | Delaware, USA (infra in EU Frankfurt) | DPA signed |
| Cloudflare Inc. | Photograph and PDF storage | San Francisco, USA (infra in EU) | DPA signed |
| Stripe Technology Europe Ltd. | Payment | Dublin, Ireland | DPA signed |
| Anthropic PBC | AI analysis | San Francisco, USA (infra in EU) | DPA signed |
| Brevo SA | Email delivery | Paris, France | DPA signed |
| Vercel Inc. | Web hosting | San Francisco, USA (infra in EU) | DPA signed |

DPAs are available on request at `dpo@tenu.world`.

## 7. Your rights

Under the GDPR, the UK GDPR and applicable national law, you have the following rights. You can exercise them by writing to `dpo@tenu.world` from the email address associated with your account.

- **Right of access** to your data.
- **Right to rectification** if data is inaccurate.
- **Right to erasure** (right to be forgotten), subject to legal retention obligations (notably invoicing).
- **Right to data portability**: you can receive your data in a structured, machine-readable format.
- **Right to object** to processing.
- **Right to withdraw consent** at any time for processing based on consent.
- **Right to lodge directives concerning your data after death** (Article 85 French Data Protection Act; not applicable to UK users).

We reply within one month, extended by up to two additional months where the request is complex or multiple.

If we do not reply, or if our reply does not satisfy you, you may lodge a complaint with:

- For users in France: the Commission Nationale de l'Informatique et des Libertés (CNIL), 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, `cnil.fr`.
- For users in the United Kingdom: the Information Commissioner's Office (ICO), Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF, `ico.org.uk`.

## 8. Cookies

We use only strictly necessary cookies: session cookie, language preference, authentication token. No third-party analytics cookie is set without prior consent. Tenu.World does not engage in behavioural advertising.

A consent banner is shown on first visit to collect your preference on any future non-essential cookies. Until consent is granted, no non-essential cookie is set.

## 9. Security

Photographs and reports are accessible only via time-limited signed URLs (maximum seven days). Authentication uses passwordless magic links. Communications are encrypted in transit (TLS 1.3). Data at rest is encrypted by our hosting partners.

We maintain a processing register and an incident register. Any data breach is notified to the CNIL (and, for UK users, the ICO) within 72 hours in accordance with Article 33 of the GDPR, and to affected individuals directly where the risk is high.

## 10. Minors

Tenu.World is intended for adults. We do not allow accounts to be opened by anyone under the age of eighteen. If we become aware that an account has been opened by a minor, we delete it.

## 11. Changes to this policy

We may amend this policy to reflect legal or technical changes. Material changes are notified by email at least thirty days before they come into force. The latest version is always available at `tenu.world/en/privacy`.

## 12. Governing law

The governing law is French law. Any dispute relating to the processing of your data falls under the jurisdiction of the French courts, without prejudice to your right to bring proceedings in your place of habitual residence within the European Union. UK users retain the rights granted by the UK GDPR and the Data Protection Act 2018, and may seek redress through UK courts for matters arising in the UK.

---

## Version log

| Version | Date | Change |
|---|---|---|
| v1.0-draft | 2026-04-17 | Initial version, awaiting legal review |
