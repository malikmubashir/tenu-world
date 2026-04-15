# Tenu — Introduction Brief

**tenu.world** | Global Apex NET (SAS, France)
Founded by Dr Mubashir Hassan | April 2026

---

## What Tenu Is

Tenu is a multilingual tenant rights companion built for international students and expats renting in France and the UK. It walks tenants through the full rental cycle, from move-in inspection to deposit recovery, in their own language, backed by AI-powered risk scoring and jurisdiction-specific dispute letters.

**Tagline:** Your rights. Your language. Your deposit.

## The Problem

Every year, hundreds of thousands of international tenants in France and the UK lose part or all of their security deposits. The system is stacked against them in three ways:

1. **Language barrier.** Rental law in France and the UK is written in French and English respectively. A Chinese student in Lyon or an Urdu-speaking family in Manchester has no practical way to understand their rights at the moment they need them most: standing at the door during a move-in inspection.

2. **Evidence gap.** Tenants rarely document the property condition with enough rigour to contest deductions. Landlords and agencies exploit this asymmetry routinely.

3. **Dispute complexity.** Even tenants who know they have been wronged face opaque, jurisdiction-specific dispute procedures (CDC in France, TDS/DPS in the UK) that require formal letters in the local language. Most give up.

No existing product addresses all three of these problems for international tenants.

## The Solution — Six Features

Tenu delivers a tightly scoped product with six features, each solving a specific part of the problem:

**Move-in onboarding** — presents the tenant's legal rights in their native language at the start of the tenancy.

**Guided photo evidence builder** — a room-by-room, timestamped photo capture flow stored on Cloudflare R2 (EU), creating a defensible evidence trail.

**Rights explainer** — 10 pre-written, legally reviewed facts per jurisdiction. These are static, human-authored, never AI-generated.

**AI risk scan** — Claude Haiku analyses the photo evidence and property data, scores deduction risk per room, and outputs structured JSON. Cost: approximately €0.30 per user.

**Dispute letter add-on** — Claude Sonnet drafts a formal CDC letter (France) or TDS/DPS letter (UK) in the correct legal language, with an explanation in the tenant's native language. Cost: approximately €0.60 per user.

**14-day outcome follow-up** — an automated Brevo survey sent 14 days after the report, feeding outcome data back into Airtable for product iteration.

## Target Users

Tenu's launch segments, in priority order:

| Segment | Size estimate | Language | Channel |
|---|---|---|---|
| Chinese students in France | ~35,000 | ZH | WeChat, Facebook |
| Arabic-speaking students/families in France | ~107,000 | AR | Mosques, ISOC |
| Pakistani/South Asian diaspora in UK | Significant | UR | Community orgs |
| Indian students in UK | Growing | EN/HI | University networks |
| Japanese students in France/UK | Small, high WTP | JA | Niche communities |

Legal output is always in French or English. The UI and rights explanations are delivered in the tenant's native language across 10 supported languages (AR, ZH, HI, UR as Priority 1; JA, ES, IT, UK as Priority 2; PT, KO as Priority 3).

## Competitive Landscape

No competitor combines evidence collection, AI risk scoring, multilingual delivery, and dispute letter generation for international tenants in France or the UK.

**Deposit Guard** operates UK-only, with no multilingual support and no AI scoring. **DefendMyRent** covers the US market only. **BailFacile** serves France but is landlord-focused.

Tenu occupies a white space: tenant-side, multilingual, AI-augmented, and dual-jurisdiction (FR + UK).

## Business Model

**Launch pricing (months 1–3):** €15/£15 flat fee for the risk scan report, plus €20/£20 for the dispute letter add-on.

**Standard pricing (month 4+):** €15 base + €5 per additional room + €30 dispute letter.

**Future:** 10–20% success fee on recovered deposits.

Gross margin sits between 88% and 94%. Fixed monthly burn is €47. Breakeven: 4 paying users.

### Year 1 Projections

| Scenario | Users | Revenue |
|---|---|---|
| Bear | 800 | ~€12K |
| Base | 2,000 | ~€36K |
| Bull | 4,500 | ~€86K |

## Tech Stack

The product is built on Next.js 16 with TypeScript and Tailwind CSS, deployed on Vercel, with Capacitor for mobile (iOS + Android). Supabase handles auth and database. Photos are stored on Cloudflare R2 (EU region). AI processing runs server-side via the Anthropic API. PDFs are generated through Placid, email through Brevo, and workflow automation through Make.com.

The architecture is designed for a solo founder: minimal operational overhead, pay-as-you-go AI costs, and a fixed burn that stays below €50/month until scale demands otherwise.

## Intellectual Property

Trademarks registered with EUIPO and CNIPA. Domain tenu.world secured on Namecheap for a 3-year term.

## Status

Tenu is in pre-launch build as of April 2026, targeting beta with the first 10 paying users by end of April. Three critical pre-launch gates remain: legal opinion from a French avocat and UK solicitor, GDPR compliance setup (signed DPAs, photo deletion policy), and willingness-to-pay validation through actual pre-payments.

---

*Global Apex NET — Île-de-France, France*
