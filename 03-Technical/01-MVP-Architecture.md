# Tenu — MVP Architecture

**Version:** 1.0  
**Date:** 2026-04-02  
**Principle:** Zero code until month 4. Make.com orchestrates everything.

---

## Architecture Overview

```
USER (tenu.world)
    ↓
WEBFLOW — Landing page + language detection
    ↓
TALLY — Inspection form + photo upload
    ↓
STRIPE — Payment link + webhook
    ↓
MAKE.COM — Central automation engine
    ↓        ↓           ↓         ↓
CLOUDFLARE  CLAUDE    PLACID    BREVO
R2 (photos) (AI)     (PDF)     (Email)
    ↓
AIRTABLE — User database + outcome tracking
```

---

## Layer 1 — User-Facing Frontend

| Tool | Role | Cost |
|---|---|---|
| Webflow Starter | Landing page, multilingual CMS, tenu.world hosting | €14/mo |
| Tally Pro | Inspection form, photo upload, webhooks | €24/mo |
| Stripe | Payment links, discount codes, webhooks | 1.4% + €0.25/txn |

---

## Layer 2 — Orchestration

| Tool | Role | Cost |
|---|---|---|
| Make.com Core | Central automation, 10K ops/month | €9/mo |
| Cloudflare R2 | EU-region photo storage, GDPR compliant | €0–5/mo |

---

## Layer 3 — AI Engine

| Tool | Role | Cost |
|---|---|---|
| Claude Haiku | Risk scoring per room (~€0.30/user) | Pay per token |
| Claude Sonnet | Dispute letters, user-language explanations (~€0.60/user) | Pay per token |
| Anthropic API | Direct HTTP calls from Make.com | Pay per token |

---

## Layer 4 — Output & Delivery

| Tool | Role | Cost |
|---|---|---|
| Placid Starter | PDF generation from branded template | €0–15/mo |
| Brevo | Transactional email, 300/day free | €0/mo |
| Airtable | User database, outcome tracking | €0/mo |

---

## Total Monthly Costs

| Users/month | Fixed | Variable | Total |
|---|---|---|---|
| 0 | €47 | €0 | €47 |
| 50 | €47 | ~€18 | ~€65 |
| 200 | €47 | ~€108 | ~€155 |
| 500 | €47 | ~€270 | ~€317 |

**Breakeven: 4 paying users at €15 flat**

---

## Make.com Scenario 1 — Core Report

```
TRIGGER: Stripe webhook (payment_intent.succeeded)
→ EXTRACT: email, amount, metadata (submission_id, rooms, jurisdiction, language)
→ FETCH: Tally submission via API (GET by submission_id)
→ FETCH: Photos from Cloudflare R2 as base64
→ CALL: Claude Haiku API (risk scoring, jurisdiction-aware prompt)
→ RECEIVE: JSON {room, risk_level, estimated_deduction, notes_in_user_language}
→ CALL: Placid API (fill PDF template with risk data + photos)
→ RECEIVE: PDF URL
→ SEND: Brevo transactional email (PDF attached, subject in user's language)
→ CREATE: Airtable record (email, language, jurisdiction, risk, date)
```

## Make.com Scenario 2 — Dispute Add-on

```
FILTER: metadata.dispute_purchased = true
→ CALL: Claude Sonnet API (dispute letter, jurisdiction-aware)
→ RECEIVE: Formal letter (FR or EN) + explanation (user's language)
→ CALL: Placid (append dispute pages to PDF)
→ SEND: Brevo email with updated PDF
→ UPDATE: Airtable dispute_purchased = true
```

## Make.com Scenario 3 — 14-Day Follow-up

```
TRIGGER: Airtable watch (record age = 14 days AND outcome = empty)
→ SEND: Brevo follow-up email in user's language
→ LINK: Tally one-click survey
→ UPDATE: Airtable outcome field on survey response
```

---

## GDPR Compliance Architecture

| Requirement | Implementation |
|---|---|
| EU data storage | Cloudflare R2 EU region only |
| Data transfer (Make.com = US) | Sign Make.com EU DPA before launch |
| Photo access control | Signed temporary URLs, 1-hour expiry |
| Photo retention | Delete from R2 after PDF generation, 30-day max |
| User consent | GDPR checkbox in Tally form before any photo upload |
| Privacy policy | Iubenda generated, FR + UK jurisdictions |
| Right to erasure | Manual process via Airtable + R2 delete — document procedure |

---

## Error Handling Protocol

| Scenario | Response |
|---|---|
| Make.com scenario fails | Email alert to founder immediately |
| Claude API error | Retry once, then manual fallback within 30 min |
| Placid PDF error | Retry once, send raw JSON report as fallback |
| Brevo bounce | Check Brevo logs, re-send manually |
| Stripe webhook missed | Check Stripe dashboard daily, trigger manually |

**Weekly test:** Monday morning — run €0.01 Stripe test charge through full pipeline. Verify PDF arrives within 5 minutes.

---

*Last updated: 2026-04-02*
