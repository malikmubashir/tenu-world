# Tenu.World — Task List
# Authoritative source. Owned by Dr Mubashir + Claude.
# Last sync: 2026-04-17
# Launch target: Mon 11 May 2026 (Fork B — public App Store + Play Store)
# OOO: Dr Mubashir off 27-30 Apr (works nights during OOO)

---

## Conventions

- `[ ]` = open  `[>]` = in progress  `[x]` = done  `[-]` = dropped
- `MH:` = Dr Mubashir only (cannot be delegated)
- `CC:` = Claude/Cowork (I execute, you review)
- `(due YYYY-MM-DD)` = hard deadline
- `(p:X)` = priority — p:0 blocks launch, p:1 nice-to-have, p:2 post-launch
- No ping-pong. If blocked I note the block and move to the next item.

---

## THIS WEEKEND (17-20 Apr)

- [ ] MH: Check D-U-N-S number for Global Apex NET SAS at dnb.com/duns-number-lookup (p:0, due 2026-04-18)
- [ ] MH: Telegram one-time setup — create bot via @BotFather, send token + chat_id (p:0, due 2026-04-20)
- [ ] MH: Email UK housing-law solicitor for fixed-fee TDS/DPS template review, GBP 500-1500 budget (p:0, due 2026-04-18)
- [ ] MH: Email French avocat droit immobilier for fixed-fee legal v1.0 review (p:0, due 2026-04-20)
- [ ] MH: Apple Developer Program enrollment for Global Apex NET SAS, EUR 99/year (p:0, due 2026-04-20)
- [ ] MH: Google Play Console developer account, USD 25 one-time (p:0, due 2026-04-20)
- [ ] MH: Paste ANTHROPIC_API_KEY into .env.local + Vercel project env (p:0, due 2026-04-20)
- [ ] MH: Paste BREVO_API_KEY into .env.local + Vercel project env (p:0, due 2026-04-20)
- [ ] MH: Confirm SAS legal name + siège exactly match Apple + Play enrolment forms (p:0, due 2026-04-20)

## WEEK 1 (20-24 Apr) — pipeline + native scaffold

- [x] CC: Implement /api/risk-scan Haiku handler per prompt-spec-scan-v2.md, JSON validation, cost cap (p:0, due 2026-04-21) — done 2026-04-17: French system prompt, grille injection, zod validation, Haiku→Haiku→Sonnet retry, €0.12 cost cap per scan, v2 payload persisted to inspections.risk_score jsonb, ScanError codes surfaced as 400/402/422/502 on the route
- [>] CC: Implement /api/dispute-letter Sonnet handler per prompt-spec-dispute-v2.md, FR LRAR + UK TDS/DPS branches (p:0, due 2026-04-22) — code shipped 2026-04-17: zod schema + FR/EN system prompts + Sonnet → Sonnet retry (no Haiku/Opus fallback) + items-sum validation ±1 EUR + €0.50 cost cap + DisputeError 9 codes → HTTP 400/402/404/409/502/504, server-forced disclaimer injection via disclaimerFor(locale), route pulls scan v2 from inspections.risk_score.v2 and upserts dispute_letters row. BLOCKED: tsc verification — bash sandbox locked from prior session; needs Cowork session reset to run npx tsc --noEmit
- [ ] CC: Implement /api/upload Cloudflare R2 EU + presigned URL flow (p:0, due 2026-04-22)
- [ ] CC: End-to-end pipeline wiring Stripe webhook → Supabase → R2 → Haiku → @react-pdf/renderer → R2 → Brevo (p:0, due 2026-04-23)
- [ ] CC: Capacitor 6 scaffold — iOS + Android native projects under app/ios and app/android (p:0, due 2026-04-24)
- [ ] CC: Capacitor Camera plugin wired, replace HTML file input (p:0, due 2026-04-24)
- [ ] CC: consents table + 4 consent UX touchpoints + timestamp + version pin (p:0, due 2026-04-23)
- [ ] CC: ECB daily refresh cron for EUR/GBP feeding calculatePrice (p:0, due 2026-04-24)
- [ ] MH: Stripe webhook endpoint created in live mode, paste signing secret (p:0, due 2026-04-22)
- [ ] MH: Sign DPAs with Supabase, Cloudflare, Stripe, Vercel, Brevo, Anthropic (p:0, due 2026-04-24)

## OOO BRIDGE (27-30 Apr)

- [ ] CC: App icon set — 1024, 512, 180, 120, 87, 60, 40, 29 iOS + Play adaptive (p:0, due 2026-04-28)
- [ ] CC: Splash screens per density, status bar theming, safe-area insets (p:0, due 2026-04-29)
- [ ] CC: Deep-linking scheme tenu:// + Universal Links config pointing at tenu.world (p:0, due 2026-04-30)
- [ ] CC: Store listing copy drafted in FR + EN — description, keywords, support URL, privacy URL (p:0, due 2026-04-30)
- [ ] CC: 6 iOS screenshots at 6.9 inch + 4 Play screenshots at 16:9 (p:0, due 2026-04-30)
- [ ] MH (nights): Review store listing copy in Notion/file, approve or edit (p:0, due 2026-05-02)
- [ ] MH (nights): Decide Apple IAP stance — physical service argument documented (p:0, due 2026-04-28)

## WEEK 2 (4-7 May + 8 May bank holiday) — submit + pray

- [ ] CC: Stripe Checkout in-app web view with return-URL deep link back to app (p:0, due 2026-05-04)
- [ ] CC: Magic-link auth working inside app — email link opens app, session persists (p:0, due 2026-05-05)
- [ ] CC: Push notifications APNs + FCM for risk-scan complete + letter ready (p:1, due 2026-05-07)
- [ ] CC: T-103-core pipeline tests — unit + integration for critical path only, skip full 48-item P0 coverage (p:0, due 2026-05-06)
- [ ] CC: Signed iOS production binary uploaded to App Store Connect (p:0, due 2026-05-04)
- [ ] CC: Signed Android app bundle uploaded to Play Console production track (p:0, due 2026-05-04)
- [ ] MH: Médiateur de la consommation signed — MEDICYS OR SMCE OR AME Conso (p:0, due 2026-05-05)
- [ ] MH: French avocat sign-off on legal v1.0, strip DRAFT banners (p:0, due 2026-05-07)
- [ ] MH: UK solicitor sign-off on TDS/DPS template (p:0, due 2026-05-07)
- [ ] MH: dpo@tenu.world mailbox live with auto-acknowledge (p:0, due 2026-05-05)
- [ ] MH: F&F invite list — 8 names, email, jurisdiction, case type (p:0, due 2026-05-06)
- [ ] MH: 512x512 production logo finalised, favicon set, OG image (p:0, due 2026-05-02)

## LAUNCH WEEK (8-11 May)

- [ ] CC: Bug sweep on inspection UI — camera retries, upload resume, offline queue (p:0, due 2026-05-09)
- [ ] CC: F&F install test on 2 real devices each (iPhone + Android) (p:0, due 2026-05-10)
- [ ] MH: Invite F&F list on 11 May 09:00 Paris (p:0, due 2026-05-11)
- [ ] MH: Monitor first 24h, triage, log issues, not fix (p:0, due 2026-05-12)

## POST-LAUNCH (12-31 May)

- [ ] CC: Full T-103 suite — 24 unit + 10 E2E + 5 canaries + 20 evals + OWASP ZAP baseline (p:2)
- [ ] CC: 14-day outcome survey cron — Brevo trigger + Supabase write-back (p:2)
- [ ] CC: Additional UI locales — ar, zh, hi, ur, ja, es, it, uk, pt, ko staged rollout (p:2)
- [ ] CC: App Store + Play production updates with post-launch fixes (p:2)

---

## Blocked / Waiting

- (none right now)

## Dropped scope (conscious cuts for 11 May)

- All 10 UI languages at launch — we ship FR + EN on 11 May, others from 15 May onward
- 48-item P0 security checklist in full — core subset shipped, remainder 12-31 May
- OWASP ZAP scan as launch gate — run 12 May, fix in week 1 post-launch
- 14-day outcome survey as launch gate — land by 25 May

## Change log

| Date | Change |
|---|---|
| 2026-04-17 | Initial list. Locked after Dr Mubashir chose Fork B + UK in + FR/EN + Apple/Play Mon 20 Apr. |
