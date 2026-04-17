# TENU — Claude Context File
# Read this file at the start of every Tenu conversation.
# Last updated: 2026-04-03

---

## Who I am
- Full name: Malik Mubashir Hassan
- Called: Dr Mubashir
- Initials: MMH
- Company: Global Apex NET (French SAS, SIRET registered, based in France)
- Other commitments: active Global Apex consulting engagements. External board and academic obligations are strictly ring-fenced from Tenu/Global Apex work (conflict-of-interest separation) and must never appear in Tenu commercial materials.
- Location: France (Île-de-France)

---

## What Tenu is
A universal tenant rights companion for international residents — guiding them through move-in to move-out in their native language, with AI risk scoring and jurisdiction-specific dispute letters for France and the UK.

**Tagline:** Your rights. Your language. Your deposit.
**Domain:** tenu.world (registered Namecheap 2026-04-02, 3 years, WhoisGuard ON)
**Status:** Pre-launch — Week 1 setup in progress (as of 2026-04-03)
**Trademarks:** EUIPO ✓ clear | CNIPA ✓ clear

---

## Core problem Tenu solves
445,000 international students in France (record 2024-25) + 700,000+ in UK sign leases in languages they barely understand. They silently accept unfair deposit deductions because they don't know their rights or how to challenge them. No product currently serves them in their language.

---

## Target users (priority order)
1. Chinese students in France — 35,000, WeChat/Facebook groups
2. Arabic-speaking students/families in France — ~107,000, mosque/ISOC channels
3. Pakistani/South Asian diaspora in UK — Urdu-first, TDS disputes
4. Indian students in UK — English but unfamiliar with UK law
5. Japanese students in France/UK — small but very high WTP

---

## Product features
1. Move-in onboarding: rights in user's language
2. Guided photo evidence builder: room-by-room, timestamped, Cloudflare R2
3. Rights explainer: 10 static pre-written facts per jurisdiction (never AI-generated)
4. AI risk scan: Claude Haiku scores deduction risk per room
5. Dispute letter (add-on): Claude Sonnet writes CDC (FR) or TDS/DPS (UK) letter + user-language explanation
6. 14-day outcome follow-up: Brevo survey → Airtable

---

## Language stack
Legal output always in FR or EN. UI in: AR, ZH, HI, UR (P1) | JA, ES, IT, UK (P2) | PT, KO (P3)

---

## Pricing
Launch: €15/£15 flat + €20/£20 dispute. Standard (month 4): €15+€5/room + €30 dispute.
Gross margin 88–94%. Breakeven: 4 users/month. Fixed burn: €47/mo.

---

## MVP tool stack
Webflow (€14) + Tally Pro (€24) + Stripe (1.4%+€0.25) + Make.com (€9) + Cloudflare R2 (€0–5) + Claude API (€0.30–0.60/user) + Placid (€0–15) + Brevo (€0) + Airtable (€0)

---

## Make.com scenarios
- Scenario 1 (core): Stripe webhook → Tally fetch → R2 photos → Claude Haiku → Placid PDF → Brevo email → Airtable row
- Scenario 2 (dispute): Filter dispute=true → Claude Sonnet → Placid append → Brevo send
- Scenario 3 (follow-up): Airtable 14-day watch → Brevo survey → Airtable outcome update

---

## Critical risks
- C1: Legal liability → FR avocat + UK solicitor before launch (€500–1,000 + £400–800)
- C2: GDPR breach → R2 signed URLs + Make.com EU DPA + 30-day deletion
- C3: No PMF → waitlist test first (20 signups/48h = green light)

---

## Financial projections (Year 1)
Bear: 800 users, ~€12K revenue. Base: 2,000 users, ~€36K. Bull: 4,500 users, ~€86K.

---

## Competitive landscape
No product combines evidence + AI scoring + multilingual dispute letters for international tenants in FR or UK. Closest: Deposit Guard (UK only, no multilingual), DefendMyRent (US only), BailFacile (landlord-only, FR).

---

## Build timeline
- Week 1 (3–9 Apr): Webflow, R2, Stripe, Brevo, waitlist test
- Week 2 (10–16 Apr): Tally form, Claude prompts, legal reviews
- Week 3 (17–23 Apr): Make.com wiring, end-to-end testing
- Week 4 (24–30 Apr): Beta launch, first 10 users

---

## Discount codes (all active)
STUDENT25 (40%, student unions) | UMMAH25 (40%, Islamic societies) | LOCATAIRE25 (40%, Reddit/Facebook) | MOVE2025 (40%, Chinese communities) | LAUNCH25 (40%, press) | EXPAT25 (40%, expat communities)

---

## Documentation
Full docs at: /Users/mmh/Documents/Global Apex/Tenu/ (11 files)
Asana project: "Tenu — Launch" — 42 tasks, 7 sections, all dated.

---

## Key decisions (do not re-debate)
Domain: tenu.world | Stack: no-code (Webflow+Make.com+Tally) | AI: Haiku (risk) + Sonnet (letters) | Storage: Cloudflare R2 EU | Email: Brevo | PDF: Placid | 10 languages, legal output FR/EN only | Pricing: €15 flat launch, room-based month 4

---

## How to start every new Tenu session
1. Read this file for full context
2. Check Asana "Tenu — Launch" for open tasks
3. Ask Dr Mubashir: "What have you completed since we last spoke?"

---

*Update this file whenever a major decision changes or a new phase begins.*
