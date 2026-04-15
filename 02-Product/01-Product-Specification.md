# Tenu — Product Specification

**Version:** 1.0  
**Date:** 2026-04-02

---

## Product Vision

Tenu is a universal tenant rights companion for international residents — move-in to move-out, in their language.

The product guides tenants through every stage of a tenancy: understanding their rights when they get the keys, documenting the property, assessing risk at move-out, and generating dispute evidence when a landlord makes unfair deductions.

---

## Core User Personas

| Persona | Profile | Primary Pain |
|---|---|---|
| Mei (China, Lyon) | Engineering student, basic French, 1-year lease | Doesn't know état des lieux rules, loses €600 |
| Yuki (Japan, Paris) | Exchange student, zero French, 6-month stay | Doesn't know CDC exists, accepts €300 "cleaning" |
| Tariq (Pakistan, Manchester) | Professional, Urdu-first, 2-bed flat | Doesn't know TDS process, landlord keeps £400 |
| Priya (India, London) | Student, English-speaking, unfamiliar with UK law | Doesn't know fair wear and tear rules, loses £500 |
| Fatima (Morocco, Marseille) | Family with children, complex move-out | Signs deduction list without questioning |

---

## Full Feature Set

### Feature 1 — Move-in onboarding
**Trigger:** User creates account / starts new tenancy  
**Output:** Rights explained in user's language  
**Content:**
- What the landlord must provide by law (FR: état des lieux, UK: prescribed information)
- What to check before signing
- What to photograph and how
- Deposit rules (cap, protection requirements, return deadlines)
- Key dates and deadlines

### Feature 2 — Guided photo evidence builder
**Trigger:** User starts inspection (move-in or move-out)  
**Process:**
- Room-by-room guided flow (predefined room types + custom)
- Photo capture: camera-only (no gallery uploads — ensures timestamping integrity)
- Server-side timestamp cross-validated against device time
- Condition checkboxes per room: walls / floor / ceiling / fixtures / cleanliness
- Free text notes field per room
- Progress tracker (X of Y rooms complete)

**Output:** Locked, immutable photo record with server timestamps

### Feature 3 — Rights explainer (jurisdiction-aware)
**Trigger:** User selects FR or UK  
**Content delivered in user's language:**
- Deposit cap rules (FR: 1 month unfurnished / UK: 5 weeks)
- Return deadlines (FR: 2 months / UK: 10 days after agreement)
- Fair wear and tear / vétusté rules
- What landlord can and cannot deduct
- How to dispute (FR: CDC / UK: TDS/DPS/mydeposits)
- Key deadlines for dispute submission

### Feature 4 — AI risk scan (move-out)
**Trigger:** User completes move-out inspection  
**Process:**
- Photos + checklist answers sent to Claude Haiku via Make.com
- Jurisdiction-aware system prompt (FR or UK rules)
- Output: JSON per room with risk level + estimated deduction + notes in user's language
- Aggregated report: total estimated deduction range, recommended actions

**Risk levels:** Low (green) / Medium (amber) / High (red)

### Feature 5 — Dispute letter generation (add-on)
**Trigger:** User purchases dispute support add-on  
**Process:**
- Claude Sonnet generates formal dispute letter
- FR: formatted for Commission Départementale de Conciliation (CDC)
- UK: formatted for TDS / DPS / mydeposits adjudication
- Legal disclaimer included in every output
- User sees: letter in FR/EN + explanation in their language, side by side

### Feature 6 — Outcome tracking
**Trigger:** 14 days after report delivered  
**Process:** Automated Brevo email in user's language → one-click survey  
**Data collected:** Deposit amount, amount recovered, disputes raised, outcome  
**Use:** Product improvement + fundraising proof data

---

## Language Stack

### Legal output (always host-country language)
- French → CDC / tribunal submissions
- English → TDS / DPS / mydeposits submissions

### UI + Rights explanation — Phase 1

| Language | Code | Priority | Market rationale |
|---|---|---|---|
| Arabic | AR | P1 | ~25% of all intl students in France |
| Mandarin | ZH | P1 | 3rd largest source country in France |
| Hindi | HI | P1 | Fastest growing (+17% YoY), 9,100 students |
| Urdu | UR | P1 | UK Pakistani diaspora — large, established |
| Japanese | JA | P2 | Small but very high WTP |
| Spanish | ES | P2 | 35%+ growth in France over 5 years |
| Italian | IT | P2 | 35%+ growth — major Erasmus source |
| Ukrainian | UK | P2 | +141% growth in France over 5 years |
| Portuguese | PT | P3 | Growing Erasmus + Brazilian segment |
| Korean | KO | P3 | High WTP, growing in both markets |

### Architecture principle
UI in user's language → rights explained in user's language → legal output always in FR or EN → user sees both side by side

---

## Pricing

### Launch phase (months 1–3)
- Base inspection: **€15 / £15 flat** (all rooms included)
- Dispute add-on: **€20 / £20**

### Standard phase (month 4+)
- Base: **€15 / £15** + **€5 / £5** per additional room
- Dispute add-on: **€30 / £30**

| Property | Rooms | Standard price | + Dispute |
|---|---|---|---|
| Studio | 1 | €15 | €45 |
| T2 / 1-bed | 2 | €20 | €50 |
| T3 / 2-bed | 3 | €25 | €55 |
| T4 / 3-bed | 4 | €30 | €60 |
| T5 / 4-bed | 5 | €35 | €65 |

### Future: success fee model
- 10–20% of recovered deposit amount
- Paid only on successful recovery
- Requires legal partnership structure

---

## UX Principles

1. **Language-first** — language selection is step 1, before anything else
2. **Icon-driven** — inspection UI uses icons not text, reducing language dependency
3. **Trust signals throughout** — GDPR badge, EU server statement, legal disclaimer
4. **No jargon** — all rights content written at B1 language level
5. **Fast** — target: full inspection completable in 15 minutes on mobile
6. **Evidence-focused** — every user action produces a legal evidence artefact

---

*Last updated: 2026-04-02*
