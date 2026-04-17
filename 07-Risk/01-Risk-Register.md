# Tenu — Risk Register

**Version:** 1.0  
**Date:** 2026-04-02  
**Review schedule:** Monthly

---

## Summary

| Severity | Count | Action |
|---|---|---|
| Critical | 3 | Resolve before accepting any payment |
| High | 5 | Resolve within 60 days of launch |
| Medium | 6 | Monitor monthly, mitigate progressively |
| Low | 4 | Accept with standard controls |

---

## Critical Risks

### C1 — Legal liability: AI generates incorrect legal advice
**Probability:** High | **Impact:** Fatal  
**Category:** Legal / Regulatory

The dispute letters cite French rental law and UK deposit scheme rules. If Claude produces an incorrect legal argument and a tenant relies on it and loses their case, Tenu faces civil liability in France (monopole des avocats, loi du 31 décembre 1971) and potential violation of the Legal Services Act 2007 in the UK. A single viral negative post in a Chinese or Arabic student community is reputationally fatal and irreversible.

**Mitigations:**
- [ ] Engage FR avocat (droit locatif) before launch — budget €500–1,000
- [ ] Engage UK solicitor before launch — budget £400–800
- [ ] Add legally reviewed disclaimer to every report output
- [ ] Remove all success rate / outcome claims from product copy
- [ ] Add mandatory "I understand this is guidance not legal advice" checkbox pre-delivery
- [ ] Pre-write static rights content — never AI-generate the 10 core rights facts

**Owner:** Founder | **Deadline:** Before first payment

---

### C2 — GDPR breach: tenant home photos exposed
**Probability:** Medium | **Impact:** Fatal  
**Category:** Data Protection

Home interior photos are sensitive personal data under GDPR Art. 4. A breach would be reportable to CNIL (France) and ICO (UK). Fines: up to 4% of turnover or €20M. Make.com is a US company — data transfer compliance must be verified explicitly.

**Mitigations:**
- [ ] Cloudflare R2: EU region, never public, signed URLs 1-hour expiry
- [ ] Sign Make.com EU Data Processing Addendum before go-live
- [ ] No photo URLs stored in Airtable — metadata only
- [ ] 30-day photo deletion after PDF generation
- [ ] GDPR consent checkbox in Tally form before any photo upload
- [ ] Iubenda privacy policy covering FR + UK

**Owner:** Founder | **Deadline:** Before first payment

---

### C3 — No product-market fit: users do not pay €15
**Probability:** Medium | **Impact:** Fatal  
**Category:** Business / Commercial

Every financial projection rests on an unvalidated hypothesis. The waitlist test (Week 1) is the primary validation action.

**Mitigations:**
- [ ] Waitlist test in Chinese student group before building (target 20 signups / 48h)
- [ ] Offer first 5 users free report in exchange for recorded feedback call
- [ ] Consider no-photo checklist-only plan at lower price to reduce trust barrier

**Owner:** Founder | **Deadline:** Week 1

---

## High Risks

### H1 — Competitor copies multilingual model
**Probability:** High | **Impact:** High | **Timeline:** 12–18 months

Deposit Guard or BailFacile adds multilingual + AI features.

**Mitigations:** Move fast. Build outcome data. Community distribution relationships. Approach TDS/mydeposits as white-label partner.

---

### H2 — AI translation errors in non-Latin scripts
**Probability:** High | **Impact:** High | **Timeline:** Ongoing

Claude Haiku more prone to hallucination in AR, ZH, JA, HI, UR.

**Mitigations:** Use Sonnet for all user-facing language output. Native speaker review of 4 P1 languages before launch (€200–400). Pre-write static rights content. "Report error" button in every report.

---

### H3 — Make.com failure during user's critical move-out
**Probability:** Medium | **Impact:** High | **Timeline:** Ongoing

Silent failure → user receives nothing → day-of-inspection emergency → viral negative review.

**Mitigations:** Email alert on every failed scenario run. Manual monitoring for first 50 users. Immediate acknowledgement email on form submission. Weekly Monday pipeline test.

---

### H4 — Regulatory ban on AI legal tools in FR or UK
**Probability:** Low | **Impact:** High | **Timeline:** 12–24 months

EU AI Act, CNB (France), SRA (UK) could restrict AI-generated legal guidance.

**Mitigations:** Pre-launch legal opinion as documented compliance evidence. "Evidence preparation" not "legal advice" framing. Quarterly regulatory scan. Consider licensed legal partner co-signing the framework.

---

### H5 — Founder single point of failure
**Probability:** Medium | **Impact:** High | **Timeline:** Ongoing

Concurrent commitments: Global Apex O365 mission, other external obligations.

**Mitigations:** No-code architecture runs autonomously. Trusted backup for Make.com monitoring. Minimum 2 hours/week hard rule. Product stable before July–September peak window.

---

## Medium Risks

| ID | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| M1 | Seasonal cashflow Jan–Feb | Medium | Medium | 3-month cash reserve; use Jan–Feb for SEO + partnerships |
| M2 | Tool dependency (Make, Tally, Placid) | Low | Medium | Monthly JSON exports; test backup tools; replicate all data to Airtable |
| M3 | User trust barrier: photos on unknown app | High | Medium | Testimonials; trust signals; community distribution; no-photo option |
| M4 | EUR/GBP currency risk | Low | Medium | Separate Stripe balances; monthly Wise transfer; annual review |
| M5 | Deposit schemes build product themselves | Low | High | Approach as white-label partner proactively in months 4–6 |
| M6 | International student numbers decline | Low | Medium | Domestic tenants (13M FR, 11M UK) are fallback TAM |

---

## Monitoring Schedule

| Action | Frequency | Owner |
|---|---|---|
| Make.com pipeline test (€0.01 Stripe charge) | Weekly — Monday | Founder |
| Competitor scan (Deposit Guard, BailFacile) | Monthly | Founder |
| Airtable outcome data review | Monthly | Founder |
| EU AI Act / CNB / SRA regulatory scan | Quarterly | Founder |
| Risk register full review | Monthly | Founder |
| Legal disclaimer review with avocat | 6-monthly | Founder + avocat |

---

*Last updated: 2026-04-02  
Next review: 2026-05-02*
