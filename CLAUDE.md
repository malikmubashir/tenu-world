# CLAUDE.md — Tenu Project Context
# Auto-read by Claude Code at session start.
# Last updated: 2026-04-03

---

## Who you are working with
- **Name:** Dr Mubashir (Malik Mubashir Hassan) — always address as Dr Mubashir
- **GitHub:** https://github.com/malikmubashir
- **Company:** Global Apex NET (French SAS, Île-de-France, France)
- **Other roles:** HEC GEMM student, MHF treasurer, active O365 consulting mission

---

## Critical operating instruction
Dr Mubashir has explicitly requested:
> "Do NOT say yes just to say yes. Challenge me, advise me and have a discussion like a Harvard serial entrepreneur would talk to his new HEC Paris colleague."

- Never validate bad ideas to be agreeable
- Push back directly with reasons and alternatives
- Short, direct sentences. No padding. No sycophancy.
- Dr Mubashir decides — your job is to make sure he has heard the sharpest counterargument first

---

## What Tenu is
Multilingual tenant rights companion for international students and expats in France and UK.
AI-powered deposit risk scoring + dispute letters in 10 languages.

**Tagline:** Your rights. Your language. Your deposit.
**Domain:** tenu.world (Namecheap, 3 years, registered 2026-04-02)
**Status:** Pre-launch — Week 1 build in progress (April 2026)
**Trademarks:** EUIPO ✓ | CNIPA ✓

---

## Tech stack — React architecture (decided 2026-04-03)

| Layer | Tool | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | Web + PWA + SEO from one codebase |
| Language | TypeScript | Mandatory — no plain JS |
| Mobile wrapper | Capacitor 6 | iOS + Android from Next.js |
| Styling | Tailwind CSS | RTL support for Arabic built in |
| i18n | next-intl | 10 languages, route-based locale |
| Camera | Capacitor Camera plugin | Native camera on iOS + Android |
| Auth | Supabase Auth | Magic link — no password friction |
| Database | Supabase (Postgres) | Replaces Airtable |
| Payments | Stripe.js | Server-side only |
| AI calls | Anthropic API | Server-side Next.js route handlers only — never expose key client-side |
| PDF | @react-pdf/renderer | In-code branded report generation |
| Email | Brevo | Transactional + follow-up |
| Hosting | Vercel | Auto-deploy on push to main |
| Domain | tenu.world → Vercel DNS | Update Namecheap nameservers |

---

## Repository
- **GitHub:** https://github.com/malikmubashir/tenu-world
- **Branch strategy:** main (production) | dev (development) | feature/* (features)
- **Deploy:** Vercel auto-deploys main → tenu.world

---

## Project structure
```
/Users/mmh/Documents/Global Apex/Tenu/
├── CLAUDE.md                        ← Claude Code reads this (you are here)
├── CLAUDE-CONTEXT.md                ← Claude Chat reads this
├── README.md
├── tenu.code-workspace
├── app/                             ← ALL code lives here
│   ├── src/
│   │   ├── app/                     ← Next.js App Router
│   │   │   ├── [locale]/            ← i18n routing (en, fr, ar, zh, etc.)
│   │   │   │   ├── page.tsx         ← Landing page
│   │   │   │   ├── inspect/         ← Inspection flow
│   │   │   │   ├── report/          ← Report view
│   │   │   │   └── dispute/         ← Dispute letter
│   │   │   └── api/                 ← Server-side API routes
│   │   │       ├── risk-scan/       ← Claude Haiku call
│   │   │       ├── dispute-letter/  ← Claude Sonnet call
│   │   │       └── upload/          ← Cloudflare R2 upload
│   │   ├── components/              ← Shared React components
│   │   ├── lib/                     ← Utilities, API clients
│   │   └── messages/                ← i18n translation files
│   │       ├── en.json
│   │       ├── fr.json
│   │       ├── ar.json
│   │       └── zh.json (+ 6 more)
│   ├── capacitor.config.ts          ← Capacitor config for iOS/Android
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── 01-Strategy/
├── 02-Product/
├── 03-Technical/
├── 04-Financial/
├── 05-Legal-Compliance/
├── 06-Marketing-GTM/
└── 07-Risk/
```

---

## Product features
1. Move-in onboarding — rights in user's language
2. Guided photo evidence builder — room-by-room, timestamped, Cloudflare R2
3. Rights explainer — 10 static pre-written facts per jurisdiction (NEVER AI-generated)
4. AI risk scan — Claude Haiku, JSON output per room
5. Dispute letter add-on — Claude Sonnet, CDC (FR) or TDS/DPS (UK) format
6. 14-day outcome follow-up — Brevo survey → Supabase

---

## Languages
Legal output: FR or EN only.
UI: AR, ZH, HI, UR (P1) | JA, ES, IT, UK (P2) | PT, KO (P3)
RTL languages (AR, UR): Tailwind RTL plugin handles layout flip.

---

## Claude API rules (critical)
- ALL Anthropic API calls made server-side ONLY (Next.js route handlers in /api/)
- NEVER import Anthropic SDK or expose API key in any client component
- Haiku for risk scoring (~€0.30/user) — called from /api/risk-scan/
- Sonnet for dispute letters (~€0.60/user) — called from /api/dispute-letter/
- Full prompt specs: 03-Technical/03-Claude-Prompt-Specs.md

---

## In-code pipeline (replaces Make.com + Placid — decided 2026-04-15)
Pipeline 1: Stripe webhook → fetch Supabase user → fetch R2 photos → Claude Haiku → @react-pdf/renderer PDF → R2 upload → Brevo email
Pipeline 2: Dispute add-on → Claude Sonnet → PDF generation → R2 upload → Brevo email
Pipeline 3: Supabase scheduled function → 14-day Brevo outcome survey
All orchestration in Next.js API routes. No external automation dependencies.

---

## Pricing
Launch: €15/£15 flat + €20/£20 dispute
Standard (month 4+): €15 + €5/room + €30 dispute
Gross margin: 88–94% | Breakeven: 4 users | Fixed burn: €47/mo

---

## Build timeline
| Phase | Period | Goal |
|---|---|---|
| Week 1 | 3–9 Apr | Repo, Next.js scaffold, Vercel deploy, tenu.world live |
| Week 2–3 | 10–23 Apr | Inspection flow, camera, R2 upload, Make.com pipeline |
| Week 4 | 24–30 Apr | PWA, testing, ZH+AR review, legal disclaimer |
| May W1–2 | 1–15 May | Capacitor setup, iOS + Android builds |
| May W3–4 | 16–31 May | App Store submissions |
| June | 1–30 Jun | Both stores live (pessimistic: end June) |
| July | 1–31 Jul | 50 paying users, 10 outcome data points |

---

## Decisions already made — NEVER re-debate
- Domain: tenu.world
- Framework: Next.js 15 + TypeScript + Tailwind
- Mobile: Capacitor (not React Native)
- Auth: Supabase
- Database: Supabase (not Airtable)
- Camera: Capacitor Camera plugin
- AI: Haiku (risk) + Sonnet (letters), server-side only
- Storage: Cloudflare R2 EU
- Email: Brevo
- PDF: @react-pdf/renderer (in-code, not Placid)
- Pipeline: All in Next.js API routes (no Make.com, no Placid, no external automation)
- Hosting: Vercel
- Languages: 10 total, legal output FR/EN only
- Pricing: €15 flat launch

---

## Code standards
- TypeScript strict mode — no `any` types
- All API keys in environment variables — never hardcoded
- Server components by default — client components only when needed (camera, forms)
- Every component gets a comment explaining what it does
- Mobile-first CSS — Tailwind sm: breakpoints upward
- RTL support from day one — test AR layout at every component

---

*Update this file whenever a major decision changes.*
