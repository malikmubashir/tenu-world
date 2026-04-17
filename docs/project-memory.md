**Purpose & context**

Dr. Mubashir (Malik Mubashir Hassan) is the founder of Global Apex NET (French SAS), based in Île-de-France, with an active O365 migration consulting mission running in parallel. He prefers to be addressed as Dr. Mubashir. External board and academic commitments are kept strictly separate from Tenu/Global Apex work to avoid conflicts of interest.

**Tenu (tenu.world)** is Dr. Mubashir's primary build focus: an AI-powered multilingual tenant rights companion targeting international students and expats renting in France and the UK. Core features are deposit inspection (real-time, mobile-first) and dispute letter generation, supporting 10 languages (AR, ZH, HI, UR as P1; JA, ES, IT, UK as P2; PT, KO as P3), with all legal output in French or English. Primary target users are Chinese, Arabic, Urdu, and Hindi speakers in the FR and UK rental markets. Pre-seed launch target: April 2026.

**Key context and constraints:**
- Solo founder managing parallel consulting engagements; committed to ~35–40 hours/week on Tenu
- Full context file at `/Users/mmh/Documents/Claude/Projects/Tenu.World/CLAUDE.md`
- Dr. Mubashir explicitly wants critical, Harvard-serial-entrepreneur-style pushback — not validation or uncritical agreement

---

**Current state (updated 2026-04-16)**

Tenu is in Week 2 build. Core inspection flow functional end-to-end (form → photos → ratings). Infrastructure live:
- GitHub repo: `github.com/malikmubashir/tenu-world`
- Deployed: `tenu.world` on Vercel (auto-deploy on push to main)
- Database: Supabase with both migrations (001 base schema + 002 owner/tenants/ratings) live
- Auth: Supabase Auth with Google OAuth + magic link, French as default language
- Payments: Stripe test mode, dynamic pricing (no fixed products), webhook configured
- Storage: Cloudflare R2 (EU) for photos
- Google Maps API configured

**What's built:**
- Inspection creation form (6 sections: type, property, owner, tenants, contract, rooms)
- Zone tendue auto-detection from postal code (1,100+ codes from Décret 2013-392)
- Camera capture with timestamped photos, R2 upload
- Element rating system (TB/B/M/MV per element, 10 standard + kitchen/bathroom extras)
- Dynamic Stripe checkout with per-room pricing
- Language toggle (FR default, EN secondary, 8 others via dropdown)

**Key pending pre-launch actions:**
- Anthropic API key (blocks AI risk scan pipeline)
- Brevo API key (blocks post-inspection email)
- Pipeline 1: Stripe webhook → Haiku scan → PDF → email (core revenue path)
- Privacy policy and terms pages (/privacy, /terms)
- French avocat legal opinion and UK solicitor review
- Native speaker review of ZH and AR outputs
- End-to-end test of full inspection flow

---

**On the horizon**

- Room-based pricing from ~Month 4 (currently €15 flat + €5/extra room + €25 dispute)
- Mobile app store submissions (iOS + Android via Capacitor) — after web validation
- P2 and P3 language rollout following P1 validation
- Post-inspection email with photos and Article 3-2 notice
- 14-day outcome follow-up survey via Brevo

---

**Key learnings & principles**

- **Mobile-first is non-negotiable for inspection workflow:** A tenant standing at a door needs native camera access; browser-based forms are inadequate. This drove the shift to React + Capacitor.
- **Build once, run everywhere:** React + Capacitor avoids building web and native apps separately.
- **No external automation dependencies:** Make.com and Placid were abandoned in favor of in-code pipelines (Next.js API routes + @react-pdf/renderer). All orchestration lives in the codebase.
- **WTP validation must be real:** Pre-payments required, not just waitlist signups.
- **Legal review cannot be deferred:** Native speaker QA for AR and ZH outputs must happen before the first user.
- **Zone tendue matters legally:** Affects notice period (1 vs 3 months), rent control, deposit enforcement. Auto-detected from postal code.
- **Element-level ratings match official forms:** 10 standard elements per room + extras for kitchen (8) and bathroom (3), matching Décret 2016-382.

---

**Tools & resources**

| Layer | Tool |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Styling | Tailwind CSS |
| Mobile | Capacitor 6 |
| Auth & DB | Supabase (Postgres) |
| Photo storage | Cloudflare R2 (EU) |
| AI (risk scoring) | Claude Haiku (~€0.30/user, server-side only) |
| AI (dispute letters) | Claude Sonnet (~€0.60/user, add-on only) |
| PDF generation | @react-pdf/renderer (in-code, not Placid) |
| Email | Brevo |
| Payments | Stripe.js (dynamic pricing, server-side) |
| Hosting | Vercel |
| Pipeline | All in Next.js API routes (no Make.com) |
| Domain | tenu.world via Namecheap (3-year, WhoisGuard) |
| i18n | next-intl (10 languages, route-based) |
| Version control | GitHub |

**Financials:** €15/£15 flat launch + €5/extra room + €25 dispute letter. €47/month fixed burn. Breakeven at 4 users. Gross margin 88–94%. Trademarks clear on EUIPO and CNIPA.