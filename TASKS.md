# Tenu.World — Task List
# MASTER FILE. Single source of truth. Every Claude surface reads this first.
# Mirror: Tenu-Reste-a-Faire.xlsx (auto-generated, do not hand-edit).
# Refresh xlsx after any change: python3 scripts/tracker-refresh.py
# Protocol: CLAUDE.md > "Task Tracker Protocol" section.
# Owned by Dr Mubashir + Claude.
# Last sync: 2026-04-18
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

- [x] CC: Fix footer legal routes redirecting to /auth/login — expose /legal, /auth/accept-terms, /api/consents as public paths in middleware (p:0, due 2026-04-18) — done 2026-04-18: middleware allow-list extended, verified on tenu.world production in incognito, all six legal pages render without auth. Commit via PR fix/public-legal-routes merged to main. Pre-contractual disclosure (art. L221-5 Code de la conso) now reachable as required for Stripe/App Store review.
- [x] CC: Fix /stories/* and /features/* redirecting to /auth/login (p:0, due 2026-04-18) — done 2026-04-18: added "/stories" and "/features" to publicPaths in src/middleware.ts. Same isPublicPath startsWith match pattern as the /legal fix; single entry per parent covers all nested routes. Stories and features now reachable without auth as marketing/content surface.
- [x] CC: Use-case content system — manifest + /stories index + cross-link strip + homepage dual-card (p:1, due 2026-04-18) — done 2026-04-18: src/lib/stories.ts (single source of truth, Story type, 4 helpers), src/components/stories/OtherCases.tsx (bilingual cross-link strip), src/app/stories/page.tsx (index with cautionary populated, success placeholder awaiting 11 May cohort), homepage example section refactored from single Suzi hook to manifest-driven dual-card grid with "See all cases →" link, Suzi + Samir pages thread OtherCases before footer, example block in en/fr/zh/ar/ur dictionaries refactored to label/heading/intro/seeAll/disclaimer. Adding a new case is now one append to stories.ts + one new /stories/<slug>/page.tsx.
- [ ] MH: Check D-U-N-S number for Global Apex NET SAS at dnb.com/duns-number-lookup (p:0, due 2026-04-18)
- [x] MH: Telegram one-time setup — create bot via @BotFather, send token + chat_id (p:0, due 2026-04-20) — done 2026-04-18: bot created, token + chat_id set in .env.local and Vercel env (per Dr Mubashir)
- [ ] MH: Email UK housing-law solicitor for fixed-fee TDS/DPS template review, GBP 500-1500 budget (p:0, due 2026-04-18)
- [ ] MH: Email French avocat droit immobilier for fixed-fee legal v1.0 review (p:0, due 2026-04-20)
- [ ] MH: Apple Developer Program enrollment for Global Apex NET SAS, EUR 99/year (p:0, due 2026-04-20)
- [ ] MH: Google Play Console developer account, USD 25 one-time (p:0, due 2026-04-20)
- [x] MH: Paste ANTHROPIC_API_KEY into .env.local + Vercel project env (p:0, due 2026-04-20) — done 2026-04-18: key set in .env.local and Vercel project env (per Dr Mubashir)
- [x] MH: Paste BREVO_API_KEY into .env.local + Vercel project env (p:0, due 2026-04-20) — done 2026-04-18: key set in .env.local and Vercel project env (per Dr Mubashir)
- [ ] MH: Confirm SAS legal name + siège exactly match Apple + Play enrolment forms (p:0, due 2026-04-20)

## WEEK 1 (20-24 Apr) — pipeline + native scaffold

- [x] CC: Implement /api/risk-scan Haiku handler per prompt-spec-scan-v2.md, JSON validation, cost cap (p:0, due 2026-04-21) — done 2026-04-17: French system prompt, grille injection, zod validation, Haiku→Haiku→Sonnet retry, €0.12 cost cap per scan, v2 payload persisted to inspections.risk_score jsonb, ScanError codes surfaced as 400/402/422/502 on the route
- [x] CC: Implement /api/dispute-letter Sonnet handler per prompt-spec-dispute-v2.md, FR LRAR + UK TDS/DPS branches (p:0, due 2026-04-22) — done 2026-04-18: code shipped 2026-04-17 (zod schema + FR/EN system prompts + Sonnet → Sonnet retry + items-sum validation ±1 EUR + €0.50 cost cap + DisputeError 9 codes → HTTP 400/402/404/409/502/504 + server-forced disclaimer injection + /api/ai/dispute reads v2 scan from inspections.risk_score.v2 and upserts dispute_letters). Typecheck verified 2026-04-18: `npx tsc --noEmit` exit 0 on fresh sandbox after index.lock clear.
- [x] CC: Implement /api/upload Cloudflare R2 EU + presigned URL flow (p:0, due 2026-04-22) — done 2026-04-18: shipped as two-phase flow at /api/mobile/upload-intent (presigned PUT URL) + /api/mobile/upload-commit (object verification + DB row), backed by src/lib/storage/r2-upload.ts and src/app/api/photos/route.ts. Commits 0a0192b + 22d028f. Path differs from original /api/upload title — same goal, mobile-scoped route.
- [>] CC: End-to-end pipeline wiring Stripe webhook → Supabase → R2 → Haiku → @react-pdf/renderer → R2 → Brevo (p:0, due 2026-04-23) — partially wired 2026-04-18: Stripe webhook → Supabase chain live (src/app/api/webhooks/stripe/route.ts, commit ce748ec, admin client bypasses RLS). Photos up through R2, scan via /api/ai/scan (Haiku) and dispute via /api/ai/dispute (Sonnet). MISSING: @react-pdf/renderer PDF generation step (only present in features/scan marketing page, not pipeline), Brevo transactional email leg (zero references in src/). Split into two new tasks below.
- [ ] CC: PDF generation leg — @react-pdf/renderer report builder invoked by webhook/post-scan, output to R2 (p:0, due 2026-04-23)
- [>] CC: Brevo transactional email leg — send scan-complete + dispute-ready emails with R2 PDF link (p:0, due 2026-04-23) — started 2026-04-18: model chosen = in-repo HTML templates under docs/email-templates/, Brevo as transport via API. Awaiting Dr Mubashir confirmation on template path vs dashboard-template-ID path before wiring.
- [ ] MH: Delete three iCloud dedup files in scripts/ on Mac (`check-agent-runs 2.sql`, `governance-sync 2.py`, `queue-agent-tasks-2026-04-17 2.sql`). Fuse mount blocks Cowork rm (p:1, due 2026-04-19)
- [x] CC: Capacitor 7 scaffold — TS code-side complete: capacitor.config.ts, MobileGate, Shell, intro/onboarding carousel, preferences wrapper, deep-link handler, mobile/upload-intent + upload-commit (p:0, due 2026-04-24) — done 2026-04-18: intro flow at src/app/(mobile)/intro/{layout,page}.tsx (3-screen swipe carousel, Apple HIG dots/haptics/skip, Portal mark on screen 1), MobileGate mounted in src/app/layout.tsx (native first-launch routes to /intro/, returning users to /app-home/), preferences.ts with Capacitor Preferences + localStorage fallback, brand colours aligned to Identity v1 (#F4F1EA paper / #0B1F3A ink — drift from #F5F1E8/#0F3B2E corrected in capacitor.config.ts and Shell.tsx), resources/{icon,icon-foreground,icon-background,splash,splash-dark}.svg authored for @capacitor/assets. Native iOS + Android project add still required on Mac — see MH lines below.
- [ ] MH: Run `npm run build:mobile` on Mac to produce out/ static export (p:0, due 2026-04-22)
- [ ] MH: Run `npx cap add ios` on Mac, then merge mobile/ios-Info.plist.snippet.xml entries into ios/App/App/Info.plist (p:0, due 2026-04-22)
- [ ] MH: Run `npx cap add android` on Mac, then merge mobile/android-manifest.snippet.xml + drop network_security_config.xml under res/xml/ (p:0, due 2026-04-22)
- [ ] MH: Run `npx capacitor-assets generate --iconBackgroundColor "#0B1F3A" --iconBackgroundColorDark "#0B1F3A" --splashBackgroundColor "#F4F1EA" --splashBackgroundColorDark "#0B1F3A"` after cap add (p:0, due 2026-04-22)
- [ ] MH: Run `npx cap sync` to wire build:mobile output into native projects (p:0, due 2026-04-22)
- [ ] MH: Open Xcode (`npx cap open ios`), set Team ID + Bundle world.tenu.app + capabilities (Camera, Push, Associated Domains for tenu.world), run on simulator + physical iPhone (p:0, due 2026-04-23)
- [ ] MH: Open Android Studio (`npx cap open android`), set release keystore SHA-256 in mobile/.well-known/assetlinks.json placeholder, run on emulator + physical device (p:0, due 2026-04-23)
- [ ] CC: Capacitor Camera plugin wired, replace HTML file input (p:0, due 2026-04-24)
- [ ] CC: consents table + 4 consent UX touchpoints + timestamp + version pin (p:0, due 2026-04-23)
- [ ] CC: ECB daily refresh cron for EUR/GBP feeding calculatePrice (p:0, due 2026-04-24)
- [x] MH: Stripe webhook endpoint created in live mode, paste signing secret (p:0, due 2026-04-22) — done 2026-04-18: webhook endpoint configured in Stripe live mode, signing secret pasted to .env.local + Vercel (per Dr Mubashir)
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
| 2026-04-18 | File promoted to single source of truth. xlsx mirror generated by `scripts/tracker-refresh.py`. Protocol added to CLAUDE.md. Legacy xlsx archived to `docs/Tenu-Reste-a-Faire.archive-2026-04-18.xlsx`. |
| 2026-04-18 | Bug fix: footer legal routes public-path fix shipped to main. |
| 2026-04-18 | Mobile intro flow shipped: 3-screen Apple-HIG onboarding carousel (Portal mark, paper background, navy ink, emerald CTA, FR copy), MobileGate root-mounted, brand colour drift corrected, asset SVG sources authored. Native iOS + Android cap add work split out as MH-owned (requires Mac toolchain). |
| 2026-04-18 | Recovery commit: mobile intro bundle landed on main. Stale .git/index.lock from 16:25 session crash cleared. Dispute-letter tsc verification unblocked and passing (exit 0). Brevo leg moved to [>]. |
