# Tenu.World Execution Plan
**Prepared for:** Dr Mubashir, Founder
**Date:** 2026-04-17 (Friday)
**Author:** Claude (acting as senior advisor, Big4 style)
**Supersedes:** Prior weekly plan references in CLAUDE.md and Development Log.

---

## 1. Executive Review (the blunt version)

You asked for a Big4 review, so here it is. Not a victory lap.

**What is genuinely done.** The web codebase exists. Supabase, R2, Stripe test keys, Google Maps address, photo authenticity fields, dynamic per room pricing, deployed to Vercel at tenu.world. The architectural decisions are coherent. That is real work.

**What you are telling yourself that is not true.**

1. "Week 2 to 3 is mostly done." No. Code is written. Nothing is tested end to end with live services. The gap between "compiles and deploys" and "a real user can complete an inspection, pay, receive a PDF report and a dispute letter" is the product. You are inside that gap, not past it.

2. "Paperclip will orchestrate 10 agents and delegate the work." No. Your own memory records a 100 percent failure rate on the eight Ollama agents. You are running two agents on gpt-4o-mini (CEO and CTO) for governance only, and execution actually happens in Claude Cowork sessions. Pretending otherwise wastes time and money. The delegation plan below reflects reality.

3. "Ship to both app stores in June, 50 paying users in July." Possible but fragile. The binding constraints are (a) Apple review lead time, variable five to fourteen days and sometimes a rejection cycle, (b) GDPR compliance artefacts you do not yet have, (c) the fact you have not done a single live paid run through the funnel, (d) user acquisition channel unproven. Ship date drifts to early July is more honest than "pessimistic end June".

4. "AI risk scoring plus auto generated dispute letter is the wedge." Technically yes. Legally risky as configured. A Haiku call that "scores risk" on a deposit return, and a Sonnet call that writes a formal letter in the user's name referencing CDC or TDS, is close to unauthorised legal advice if not framed correctly. This needs a disclaimer shown before payment, a human review checkpoint on the first 50 letters, and an explicit "this is a template, not legal advice" banner on every generated PDF. Your wife (PhD Law) should review this once.

5. "Pricing: €15 launch, 4 users to break even." Break even of the fixed burn, not of acquisition cost. You have not funded a CAC line. If your channel is organic SEO and student communities, expected CAC is low but slow. If you pay for any ads, €15 ARPU is too thin. Do not pay for acquisition at launch; the unit economics will lie.

6. "Grille de vétusté integrated." It is not. It is listed in pending items. Without the depreciation grid, the AI risk scoring will be systematically wrong in the landlord's favour, because it will not know that five year old paint has no residual value. This is the single biggest product defect right now.

**What is actually missing and you have not flagged.**

- No error tracking (Sentry or Axiom). A silent 500 in `/api/ai/scan` loses a paying customer and you never learn about it.
- No rate limiting on the AI routes. A scraper with your public URL can burn through Anthropic credits in minutes.
- No analytics (PostHog or Plausible). You will not know which step of the funnel drops users.
- No GDPR documentation (DPIA, ROPA, privacy policy, cookie banner, data retention schedule). You are storing photos of a person's rental flat in an EU bucket. CNIL territory.
- No accessibility baseline. European Accessibility Act applies from June 2025 to digital services targeting EU consumers. You are in scope.
- No refund and dispute policy. Stripe requires it.
- No incident response plan. When the Claude API is down, what does the user see, and how do you refund.
- No brand assets beyond a domain. Logo, icon, social cards, app store screenshots are zero at this date.

Close those and you have a launchable product. Leave them and you have a liability disguised as a Friday deploy.

---

## 2. Hard priorities (next 14 days)

Ordered by what blocks revenue. Do not reorder.

| # | Priority | Why it is first | Owner |
|---|---|---|---|
| P0 | Anthropic API key added, AI routes tested end to end with a real room photo | Without this the product does not function. Every other task is moot. | Dr Mubashir (key), Claude Cowork (test) |
| P0 | Stripe webhook secret in Vercel, tested with `stripe trigger checkout.session.completed` | Without this, payments succeed but reports never generate. | Dr Mubashir |
| P0 | Privacy policy, Terms of Service, refund policy pages published | Cannot legally accept a euro in the EU without these. Stripe also enforces. | CEO agent (draft), Dr Mubashir (validate) |
| P0 | End to end smoke test: create account, create inspection, upload 10 photos, pay €15 test, receive PDF by email | This is the acceptance test for "we have a product". | Claude Cowork |
| P1 | Grille de vétusté integrated into Haiku prompt | Without this, risk scoring is systematically wrong. Product defect. | CTO agent + Claude Cowork |
| P1 | Sentry or Axiom error tracking on all `/api/*` routes | You cannot operate without it. Half a day of work. | Claude Cowork |
| P1 | Rate limiting on AI routes via Vercel Edge middleware or Upstash | One abusive user kills your Anthropic budget. | Claude Cowork |
| P1 | Brevo API key + first transactional template (report ready, dispute ready) | Email is the delivery mechanism. | Dr Mubashir (key), Claude Cowork (template) |
| P1 | PostHog free tier, track funnel events | You need data from day one. Retrofitting is painful. | Claude Cowork |
| P2 | Remaining 5 i18n dictionaries (hi, ja, es, it, uk) | UI polish, not blocker. Defer translation QA to Week 4. | Claude Cowork |
| P2 | Brand kit: logo, favicon, social OG cards, 3 app store screenshots mock | Needed for app store submission only. | External designer or Gamma/Canva |
| P2 | Legal disclaimer banner on generated PDFs | Legal risk mitigation. Small work, high leverage. | CEO agent draft |

---

## 3. Revised timeline (honest version)

```
Apr 17 (today)  Fri   Plan signed. Legal surface delivered. Anthropic + Brevo keys added.
Apr 18-19       Weekend Smoke test funnel end to end. Fix what breaks.
Apr 20-24       Mon-Fri  Security checklist P0 first pass. Grille de vétusté in prompt. Sentry on. Rate limits. Legal surface MDX routes + consents table.
Apr 25-26       Weekend Dr Mubashir + spouse review legal text. Freeze product copy.
Apr 27-30       OOO   Dr Mubashir time off. NO deploys, NO PRs, NO stakeholder actions.
May 1-3         Fri-Sun Resume. T-103 E2E dry run on staging. Any P0 still red: close.
May 4-8         Mon-Fri Security checklist final sign-off. Translation QA AR and ZH. Friends & family staging trials (3-5 users).
May 9-10        Weekend Final dress rehearsal. Full paid flow from 3 test accounts. Monitoring dashboards green.
May 11 (Mon)    SOFT LAUNCH. First-paying-user friends & family launch. Target: 3-5 paid inspections in week 1.
May 12-16       Week 6  Post-launch monitoring. Capacitor iOS + Android shells. App icons. Screenshots.
May 18-22       Week 7  App Store submission (iOS) and Play production track. Start external beta (20 users).
May 25-29       Week 8  Respond to Apple review feedback (likely one rejection cycle). Ship live on Play.
Jun 1-15        First half Live on both stores worst case mid-June. First paid users from French student Facebook groups and Reddit r/france.
Jun 16-30       Second half  Iterate on outcome survey data. Fix first real user reports.
Jul 1-31        Target 50 paid users, 10 outcome data points, first dispute letter success case.
```

The week numbers above replace the ones in CLAUDE.md. Update CLAUDE.md accordingly when you sign off this plan.

---

## 4. Paperclip delegation (reality, not aspiration)

Your Paperclip instance has 10 agent records. Functionally you have two agents and a pool of execution capacity through Claude Cowork. Trying to delegate code writing to gemma4:e4b has already been proven to fail at 100 percent. Do not repeat that test. Reassign the work to the layer that can actually do it.

### Live agents (working)

**CEO (gpt-4o-mini via codex_local).** Governance and investor ready writing. Do not let it touch code. Good at: strategy memos, risk registers, GTM briefs, legal disclaimer drafts, board style updates, outcome storytelling for PR.

**CTO (gpt-4o-mini via codex_local).** Technical governance, code review briefs, architecture decision records, prompt specs, non executing tasks. Do not let it write production code directly. Good at: acceptance criteria, test plans, ADRs, security checklists, prompt engineering drafts.

### Paused agents (do not reactivate yet)

Head of Product, Head of Marketing, Head of Finance, Head of Governance, Head of HR, Senior Web Developer, Senior iOS Developer, Senior Android Developer. All on gemma4:e4b, all broken on agent tasks. Keep them paused. If you ever move them back on, move to gpt-4o-mini only for specific deliverables, not as always on agents.

### Execution layer (where work actually happens)

**Claude Cowork sessions.** This is where code writing, test execution, infra changes, and file generation happen. Every task below names the layer responsible.

### Delegation matrix

| Workstream | Owner (real) | Paperclip agent role |
|------------|--------------|---------------------|
| Strategy memos, risk register updates, GTM narrative | Claude Cowork (draft) + CEO agent (polish) | CEO agent drafts, you approve |
| Legal pages (Privacy, ToS, Refund) first draft | CEO agent | Draft output pasted to Cowork for conversion to React page |
| ADRs and prompt specs | CTO agent | Drafts only. Cowork implements. |
| Grille de vétusté logic + prompt integration | Claude Cowork, CTO agent reviews spec | CTO writes the acceptance criteria |
| End to end smoke testing | Claude Cowork | None. Cowork does it. |
| Sentry, rate limiting, PostHog setup | Claude Cowork | None. |
| Stripe webhook secret + live run | Dr Mubashir + Cowork | None. |
| i18n dictionaries hi, ja, es, it, uk | Claude Cowork | None. |
| Brevo template HTML | Claude Cowork | CEO agent reviews copy. |
| Capacitor iOS/Android build | Claude Cowork | None. |
| App Store assets (screenshots, copy) | External designer OR Gamma, CEO agent drafts copy | CEO agent writes app store description in FR and EN |
| Beta user recruitment messaging | CEO agent (draft), Cowork (send) | CEO agent writes the cold outreach DM template |
| Weekly governance report to Tenu-Reste-a-Faire.xlsx | governance-sync.py (already running) | Monitors only |

Rule: any task that requires writing working code, editing files, or running a service goes to Claude Cowork. Any task that is prose, specification, or governance goes to CEO or CTO agents as drafts.

### Why only CEO and CTO

codex_local adapter routes to OpenAI. gpt-4o-mini is cheap (around $0.50/day at your volume) and coherent enough for governance. Expanding to Head of Product or Head of Marketing on the same model adds marginal value and scope for drift. Keep the surface small.

---

## 5. Technical assignments (ready to brief)

Each assignment has: owner, inputs, acceptance criteria, estimated effort. Hand these to the named layer.

### T-101 Anthropic key and live AI smoke test
- Owner: Dr Mubashir (key), Claude Cowork (test)
- Inputs: ANTHROPIC_API_KEY in `.env.local` and Vercel
- Do: Add key. Run `/api/ai/scan` POST with 3 test room photos (bathroom, kitchen, living room). Confirm JSON output matches `src/lib/ai/risk-scan.ts` schema. Run `/api/ai/dispute` POST with test inspection ID. Confirm Sonnet returns valid French CDC style letter.
- Acceptance: Both endpoints return 200 with valid JSON in under 12 seconds. Cost logged. Screenshots saved to `/docs/smoke-tests/2026-04-18/`.
- Effort: 2 hours.

### T-102 Stripe webhook secret and funnel run
- Owner: Dr Mubashir
- Do: Install Stripe CLI locally. Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. Copy signing secret into `.env.local`. Set production webhook endpoint in Stripe dashboard pointing to `https://tenu.world/api/webhooks/stripe`, add that signing secret to Vercel. Trigger a test `checkout.session.completed` event. Confirm row appears in `payments` table.
- Acceptance: `payments` table has one row with status `completed` after each test event. Vercel logs show webhook 200.
- Effort: 1 hour.

### T-103 End to end smoke test (THE launch gate)
- Owner: Claude Cowork
- Do: Using a burner Gmail, from `https://tenu.world`, complete the full flow:
  1. Land, pick FR locale
  2. Sign up via magic link
  3. Create new inspection (address in Paris, 2 rooms: chambre + cuisine)
  4. Capture 10 photos chambre, 18 photos cuisine (use dummy stock images if needed)
  5. Pay €20 (€15 base + €5 chambre) via Stripe test card
  6. Receive Brevo email with PDF risk report
  7. Trigger dispute letter add on €25
  8. Receive second email with dispute letter PDF
- Acceptance: All 8 steps pass. Timings recorded. Screenshots to `/docs/smoke-tests/`. Any failure becomes a P0 bug.
- Effort: 4 hours first run, 1 hour per subsequent run.

### T-104 Grille de vétusté integration
- Owner: Claude Cowork (implementation), CTO agent (prompt spec)
- Inputs: Décret 2016-382 grid. CTO agent produces structured JSON from the decree with element / lifetime / annual depreciation rate. Reference: LegalPlace PDFs already in `docs/reference/`.
- Do: Create `src/lib/ai/grille-vetuste.ts` exporting `getDepreciation(element, ageYears)` returning 0 to 1. Inject into Haiku prompt as a system message table. Risk scanning output must include `residual_value_percent` per item.
- Acceptance: Five year old paint returns 0 percent residual. New boiler returns 100 percent. Haiku output includes residual values. Three fixture inspections produce consistent numbers across two runs.
- Effort: 6 hours.

### T-105 Privacy, ToS, Refund, Legal disclaimer pages
- Owner: CEO agent (drafts), Claude Cowork (implements as Next.js pages), Dr Mubashir + spouse (review)
- Do:
  - CEO agent writes four documents in FR and EN: Politique de confidentialité, Conditions générales d'utilisation, Politique de remboursement, Mentions légales. Reference: RGPD, Loi informatique et libertés 1978 modifiée, obligations SAS.
  - Cowork converts each to `src/app/[locale]/legal/{privacy,terms,refund,legal}/page.tsx`.
  - Add PDF footer "Ce document est un modèle généré automatiquement. Il ne constitue pas un avis juridique." on dispute letters.
- Acceptance: All four pages live at `https://tenu.world/fr/legal/*` and `/en/legal/*`. Footer visible on a generated dispute PDF. Spouse signs off within one week.
- Effort: CEO drafts 3 hours, Cowork implements 2 hours, review 1 hour.

### T-106 Sentry error tracking
- Owner: Claude Cowork
- Do: `npx @sentry/wizard@latest -i nextjs`. Configure DSN in Vercel env. Add breadcrumbs in `/api/ai/scan`, `/api/ai/dispute`, `/api/webhooks/stripe`, `/api/photos`. Manual test by throwing from one route, confirm alert appears.
- Acceptance: Three captured errors visible in Sentry dashboard with request context (inspection_id, user_id).
- Effort: 2 hours.

### T-107 Rate limiting on AI routes
- Owner: Claude Cowork
- Do: Add Upstash Redis (free tier). Middleware on `/api/ai/*` limits to 10 req/hour/IP and 30 req/day/user. Return 429 with clean JSON.
- Acceptance: 11th request from same IP within an hour returns 429. Logged in Sentry as info, not error.
- Effort: 2 hours.

### T-108 PostHog analytics
- Owner: Claude Cowork
- Do: Free cloud tier EU region. Install `posthog-js` for pageviews. Server side event tracking on: inspection_created, photo_uploaded, checkout_started, checkout_completed, report_delivered, dispute_ordered, dispute_delivered, outcome_survey_submitted. PII off. Consent gate behind cookie banner.
- Acceptance: Dashboard shows funnel from landing to report delivered across the T-103 smoke run.
- Effort: 3 hours.

### T-109 Brevo transactional templates
- Owner: Claude Cowork (code), CEO agent (copy)
- Do: Two templates in Brevo: `report_ready` and `dispute_ready`. FR + EN variants. Each contains: one sentence summary, risk badge, download CTA, signed PDF link (R2 presigned URL, 7 day expiry). Wire into pipelines.
- Acceptance: Both templates fire in T-103 smoke test. Emails land in inbox (not spam) from a freshly configured domain sender `noreply@tenu.world` with SPF, DKIM, DMARC passing.
- Effort: Copy 1 hour, template setup 2 hours, DNS 1 hour.

### T-110 i18n completion
- Owner: Claude Cowork
- Do: Produce `hi.json`, `ja.json`, `es.json`, `it.json`, `uk.json` matching structure of `fr.json`. Machine translation as first pass. Flag all strings with `// REVIEW` comment for native speakers later.
- Acceptance: Site renders cleanly at `/hi`, `/ja`, `/es`, `/it`, `/uk` with no missing key warnings.
- Effort: 3 hours.

### T-111 Capacitor build
- Owner: Claude Cowork (Week 5)
- Do: Follow Capacitor 6 setup. `npx cap add ios && npx cap add android`. Configure splash, icons from brand kit. Build TestFlight and Internal Testing tracks.
- Acceptance: Both apps install on physical device, open, complete a guest inspection.
- Effort: 2 days with app review lag.

### T-112 App Store submission assets
- Owner: External designer OR Gamma, CEO agent for copy
- Do: 1024x1024 icon, 3 iPhone screenshots in FR, 3 in EN, 3 Android phone screenshots each. App store description: 170 char subtitle, 4000 char description, keywords. Privacy nutrition labels filled in.
- Acceptance: Assets in `/docs/marketing/app-store/` folder. Apple and Google both accept the submission without asset rejections.
- Effort: Designer 1 day or Gamma 3 hours. CEO agent copy 2 hours.

### T-113 Pre launch beta
- Owner: Dr Mubashir + CEO agent
- Do: CEO drafts cold DM in FR for r/france, WhatsApp student groups, and Dr Mubashir's Global Apex professional network. Target 10 friendly beta users by May 25. Offer: free report in exchange for feedback form.
- Acceptance: 10 real inspections completed on staging by May 29. 5 out of 10 complete the outcome survey.
- Effort: 1 week calendar, 2 hours per day effort.

---

## 6. Counter arguments to the plan itself

To be honest this plan can still be wrong. The sharpest objections:

**Objection A.** Delaying Capacitor to May 4 means App Store rejection risk compresses into a single cycle. True. Mitigation: prepare the Capacitor shell skeleton during Week 4 downtime so Week 5 is just wiring. Two days of risk, not five.

**Objection B.** Hiring an external designer in Week 5 is a cash and timing risk. True. Cheaper alternative: use Gamma or Canva with Tenu brand tokens generated from the logo you do not yet have. Rougher but Friday shippable.

**Objection C.** Publishing legal pages without a French lawyer looking at them is real risk. Spouse is PhD Law but probably not a data protection specialist. Accept this, publish version one, commission a CNIL focused review before scaling past 100 users.

**Objection D.** Running gpt-4o-mini on CEO and CTO still costs about $15/month and produces output you could write yourself in thirty minutes. True. The point is reproducibility in Paperclip logs, not intellectual content. If you stop valuing the audit trail, kill Option C and run pure Cowork.

**Objection E.** The whole "risk scan + dispute letter" may be a feature, not a product. A full product is a landlord compliance SaaS, not a one shot €15 report. True, but one shot is the correct wedge for acquisition, and landlord compliance is a later expansion with stronger moat. Do not confuse the wedge with the moat.

---

## 7. Immediate next 72 hours (what Dr Mubashir must do personally)

1. **Today (Fri 17):** Add ANTHROPIC_API_KEY and BREVO_API_KEY to `.env.local` and Vercel. Two environment variables. Ten minutes.
2. **Tonight:** Configure Stripe webhook endpoint on `tenu.world/api/webhooks/stripe`. Paste signing secret to Vercel. Twenty minutes.
3. **Saturday 18:** Kick off T-103 (end to end smoke test) in a Cowork session with this document open. Budget half a day.
4. **Sunday 19:** Decide with spouse whether to accept the legal pages as drafted by CEO agent or commission a lawyer. Sign off or escalate.
5. **Monday 20:** Green light Week 4 work to Cowork. Do not open new workstreams before P0 and P1 close.

Everything else is assignable. These five items are not.

---

## 8. Agent briefs (paste into Paperclip)

### CEO agent brief (paste as task)
```
You are the CEO of Tenu.World (tenant rights deposit recovery app, FR+UK, pre-launch).
Context file: /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/08-Execution-Plan-2026-04-17.md

Deliverables due within 48 hours:
1. FR + EN draft of Politique de confidentialité (GDPR compliant, covers photo storage in EU, 24 month retention, CNIL rights).
2. FR + EN draft of CGU (SAS governed, Paris jurisdiction, paid one shot €15/£15 service, dispute letter add on is a template not legal advice).
3. FR + EN draft of Refund policy (14 day right of withdrawal waived per article L221-28 once AI report is delivered and accessed, explicit consent required).
4. Legal disclaimer text for PDF footer (two languages, 25 words each).
5. Cold outreach DM template for r/france, Facebook FR student groups, and Global Apex professional contacts. FR only, 400 chars, no sales tone.

Output format: Markdown, one file per deliverable, saved to /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/legal-drafts/.
Do not write code. Do not touch files outside /docs/legal-drafts/.
```

### CTO agent brief (paste as task)
```
You are the CTO of Tenu.World.
Context file: /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/08-Execution-Plan-2026-04-17.md

Deliverables due within 72 hours:
1. ADR-001 Grille de vétusté integration: decision, alternatives, implementation sketch, prompt additions for Claude Haiku. Reference Décret 2016-382.
2. Prompt spec v2 for /api/ai/scan: system prompt, user prompt template, expected JSON schema, error handling rules, cost budget (target €0.15 per scan). Must include grille de vétusté inline table.
3. Prompt spec v2 for /api/ai/dispute: FR CDC format, UK TDS/DPS format, required fields, disclaimer footer, signature block. Target €0.40 per letter.
4. Security checklist for API routes: auth, rate limiting, input validation, R2 signed URLs, Sentry breadcrumbs. Mark which items are already implemented vs pending.
5. Test plan for T-103 end to end smoke test: 8 step flow, pass criteria per step, rollback plan if step 5 (payment) fails.

Output format: Markdown, one file per deliverable, saved to /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/technical-specs/.
Do not write production code. Specs only. Claude Cowork implements.
```

---

## 9. Governance cadence

Weekly on Fridays 17:00 CET, review against this plan. Five questions only:

1. What P0 closed this week. If none, why.
2. What P1 closed this week.
3. What slipped. Owner and new date.
4. New risks since last week.
5. Is the July 50 user target still credible. Yes or no.

governance-sync.py already runs every 30 minutes and updates Tenu-Reste-a-Faire.xlsx. Point it at the task IDs in section 5 so this plan becomes the single source of truth.

---

**End of plan. Sign off required from Dr Mubashir before any task in section 5 begins.**
