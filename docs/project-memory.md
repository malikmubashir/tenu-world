**Purpose & context**

Dr. Mubashir (Malik Mubashir Hassan) is the founder of Global Apex NET (French SAS), based in Île-de-France. He is an HEC GEMM student and MHF treasurer, with an active O365 migration consulting mission running in parallel. He prefers to be addressed as Dr. Mubashir.

**Tenu (tenu.world)** is Dr. Mubashir's primary build focus: an AI-powered multilingual tenant rights companion targeting international students and expats renting in France and the UK. Core features are deposit inspection (real-time, mobile-first) and dispute letter generation, supporting 10 languages (AR, ZH, HI, UR as P1; JA, ES, IT, UK as P2; PT, KO as P3), with all legal output in French or English. Primary target users are Chinese, Arabic, Urdu, and Hindi speakers in the FR and UK rental markets. Pre-seed launch target: April 2026.

**Key context and constraints:**
- Solo founder managing concurrent commitments (consulting + HEC + MHF); committed to ~35–40 hours/week on Tenu
- Full context file at `/Users/mmh/Documents/Global Apex/Tenu/CLAUDE-CONTEXT.md`
- Dr. Mubashir explicitly wants critical, Harvard-serial-entrepreneur-style pushback — not validation or uncritical agreement

---

**Current state**

Tenu is in active Week 1 build. Infrastructure confirmed live:
- GitHub repo: `github.com/malikmubashir/tenu-world`
- Deployed: `tenu-world.vercel.app`
- DNS: `tenu.world` pointed to Vercel (A record + CNAME; conflicting Namecheap parking records removed)
- Stack scaffolded: Next.js 16 + TypeScript + Tailwind + Capacitor; dev server running on `localhost:3000`
- VS Code workspace configured and opening correctly via `code` command
- `CLAUDE.md` created at project root for Claude Code auto-context
- Documentation: 11 files across 7 folders at `/Users/mmh/Documents/Global Apex/Tenu/`
- Asana project "Tenu — Launch" with 42 tasks active

**Key pending pre-launch actions:**
- French avocat legal opinion and UK solicitor review
- Make.com EU DPA
- Native speaker review of ZH and AR outputs (agreed to complete before first user, not deferred to Month 2)
- WTP validation via pre-payments (not just waitlist signups)

---

**On the horizon**

- Room-based pricing model planned from ~Month 4
- Dispute letter add-on: €20 at launch, rising to €30
- Mobile app store submissions (iOS + Android via Capacitor) — sequenced after web validation
- P2 and P3 language rollout following P1 validation

---

**Key learnings & principles**

- **Mobile-first is non-negotiable for inspection workflow:** A tenant standing at a door doing a real-time inspection needs native camera access; browser-based forms are inadequate. This drove the shift from a no-code stack to React + Capacitor from day one.
- **Build once, run everywhere:** Going React + Capacitor from the start avoids the cost and complexity of building a web app and native apps separately — correctly identified as the right call despite initial challenge.
- **WTP validation must be real:** Waitlist signups are insufficient signal; pre-payments are required to validate willingness to pay before scaling.
- **Legal review cannot be deferred:** Native speaker QA for AR and ZH outputs must happen before the first user, not in a later sprint.
- **Solo-founder bandwidth is a live risk:** Concurrent commitments are acknowledged; the ~35–40 hours/week commitment to Tenu is the stated mitigation.

---

**Approach & patterns**

- Dr. Mubashir wants a critical advisor relationship with Claude — explicit pushback on assumptions, strategies, and sequencing is expected and valued
- Documentation-first discipline: strategy, market analysis, product spec, MVP architecture, prompt specs, GTM, financials, and legal all written before build began
- Sequenced rollout: web validation before app store submission; P1 languages before P2/P3

---

**Tools & resources**

| Layer | Tool |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Capacitor |
| Auth & DB | Supabase |
| Photo storage | Cloudflare R2 (EU) |
| AI (risk scoring) | Claude Haiku (~€0.30/user, server-side) |
| AI (dispute letters) | Claude Sonnet (~€0.60/user, add-on only) |
| PDF generation | Placid |
| Email | Brevo |
| Hosting | Vercel |
| Automation pipeline | Make.com |
| Domain registrar | Namecheap (3-year term, WhoisGuard on) |
| Project management | Asana |
| Version control | GitHub |

**Financials:** €15/£15 flat launch price; €47/month fixed burn; breakeven at 4 users. Trademarks clear on EUIPO and CNIPA.