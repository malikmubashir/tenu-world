# Tenu — Legal & Compliance Checklist

**Version:** 1.0  
**Date:** 2026-04-02  
**Status:** Pre-launch — all items must be completed before accepting payment

---

## Critical — Must complete before launch

### France legal opinion
- [ ] Find avocat specialised in droit locatif (Paris or Lyon preferred)
  - Try: Barreau de Paris specialist directory → droit immobilier
  - Or: Legalstart.fr referral network
  - Budget: €500–1,000 for 2-hour review session
- [ ] Prepare for review session:
  - Claude Haiku risk scoring prompt output (3 sample reports)
  - Claude Sonnet dispute letter output (2 sample letters)
  - Full disclaimer text (draft below)
  - Product description and user flow
- [ ] Questions to ask the avocat:
  1. Does this product constitute conseil juridique under loi du 31 décembre 1971?
  2. Is our "guidance not advice" framing legally sufficient?
  3. Does the CDC letter template require any structural changes?
  4. What additional disclaimer language do you recommend?
  5. Are there any other regulatory risks we should be aware of?
- [ ] Get written legal opinion (even brief email confirmation is sufficient)
- [ ] Update Claude prompts based on feedback

### UK legal opinion
- [ ] Find solicitor with expertise in housing/tenancy law
  - Try: Law Society "Find a Solicitor" → housing law
  - Budget: £400–800 for 1-hour review
- [ ] Questions to ask:
  1. Does this product constitute reserved legal activity under Legal Services Act 2007?
  2. Is our disclaimer framing sufficient for TDS/DPS dispute letters?
  3. Any Renters' Rights Act 2025 implications for AI-generated dispute content?
  4. Recommended disclaimer language for UK?
- [ ] Get written confirmation

### EU AI Act compliance check
- [ ] Determine product risk category under EU AI Act
  - AI systems providing legal guidance may be "high risk" (Annex III)
  - If high risk: register in EU database, conformity assessment required
  - If limited risk: transparency obligations only (disclosure that output is AI-generated)
- [ ] Document: Tenu uses AI for guidance, not decision-making — user makes all decisions
- [ ] Add AI-generated disclosure to all reports: "This report was generated with AI assistance"

---

## GDPR Framework

### Data categories collected
| Data type | Legal basis | Retention |
|---|---|---|
| Email address | Contract performance | Duration of service + 1 year |
| Home interior photos | Explicit consent | 30 days then deleted |
| Property address | Contract performance | Duration of service + 1 year |
| Payment data | Contract performance | Stripe handles — not stored by Tenu |
| Language + jurisdiction | Contract performance | Duration of service |
| Dispute outcome data | Legitimate interest | Anonymised after 2 years |

### GDPR actions
- [ ] Sign Make.com EU Data Processing Addendum (DPA)
  - URL: make.com/en/privacy → Data Processing Agreement
- [ ] Configure Cloudflare R2:
  - Bucket location: EU (mandatory)
  - Public access: OFF
  - Signed URL expiry: 1 hour maximum
- [ ] Set 30-day photo deletion automation in Make.com
- [ ] Add GDPR consent checkbox to Tally form (before photo upload step)
  - Text: "I consent to my photos being stored on EU servers for 30 days to generate my report. I can request deletion at any time by emailing privacy@tenu.world"
- [ ] Generate privacy policy via Iubenda (iubenda.com)
  - Enable: FR jurisdiction + UK jurisdiction
  - Include: cookies, data processing, third-party tools list
  - Add to: Webflow footer (all language versions)
- [ ] Create privacy@tenu.world email alias (via Brevo or Namecheap forwarding)
- [ ] Document right-to-erasure procedure:
  1. User emails privacy@tenu.world
  2. Delete R2 photos manually
  3. Anonymise Airtable record (clear email, replace with DELETED)
  4. Confirm deletion to user within 30 days

### Data Processing Register (required under GDPR Art. 30)
- [ ] Create simple spreadsheet: processing activity, purpose, data categories, retention, third parties
- [ ] Third parties to document: Stripe, Make.com, Cloudflare, Tally, Placid, Brevo, Airtable, Anthropic

---

## Disclaimer Templates

### Required on every AI-generated report (EN)
> "This inspection report was generated with AI assistance based on the information and photos you provided. It is provided as guidance only and does not constitute legal advice. Tenu is not a law firm and the content of this report should not be relied upon as a substitute for advice from a qualified legal professional. You should review any dispute correspondence with a solicitor or legal adviser before submission. Tenu accepts no liability for decisions made based on this report."

### Required on every AI-generated report (FR)
> "Ce rapport d'inspection a été généré avec l'aide de l'intelligence artificielle sur la base des informations et photos que vous avez fournies. Il est fourni à titre indicatif uniquement et ne constitue pas un conseil juridique. Tenu n'est pas un cabinet d'avocats et le contenu de ce rapport ne doit pas être utilisé comme substitut à un avis d'un professionnel juridique qualifié. Tout courrier de contestation doit être relu par un avocat ou un conseiller juridique avant envoi. Tenu décline toute responsabilité pour les décisions prises sur la base de ce rapport."

---

## Business Registration

- [ ] Verify Global Apex SIRET covers digital services / conseil aux entreprises
  - Current code APE: check against Tenu's activities
  - If needed: declare complementary activity via INPI
- [ ] UK: no immediate action needed (France-based entity, UK customers = B2C exports)
- [ ] VAT: not applicable until €36,800 annual turnover (micro-entrepreneur threshold)
  - Monitor and register when approaching threshold

---

## Insurance

- [ ] Check if existing Global Apex professional liability (RC Pro) covers Tenu activities
  - Key question: does it cover AI-generated content used in legal contexts?
  - If not: add Tenu activities as extension (typical cost: €100–200/year additional)

---

*Last updated: 2026-04-02  
Owner: Global Apex / Tenu*
