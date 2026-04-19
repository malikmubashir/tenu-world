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

- [x] CC: Scheduled push v2 — replace Gmail create_draft with Brevo direct send (p:1, due 2026-04-19) — done 2026-04-19: new SKILL.md at scripts/scheduled-tasks/tenu-daily-push.md, brevo.env.example alongside. Telegram path unchanged. MH installs + adds BREVO_API_KEY — see MH line below.
- [ ] MH: Install scheduled-push v2 — copy scripts/scheduled-tasks/tenu-daily-push.md into ~/Documents/Claude/Scheduled/tenu-daily-push/SKILL.md and drop BREVO_API_KEY into .secrets/brevo.env (p:1, due 2026-04-20)
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
- [x] CC: SOT consolidation — fix CLAUDE.md project path, refresh CLAUDE-CONTEXT.md to current React/in-code stack, replace stale-clone CLAUDE.md + CLAUDE-CONTEXT.md with redirect stubs (p:0, due 2026-04-19) — done 2026-04-19: SOT CLAUDE.md now declares `/Users/mmh/Documents/Claude/Projects/Tenu.World/` as canonical at the top, project structure block rewritten to match real layout (no nested `app/` wrapper, lists ios/, android/, mobile/, resources/, supabase/, scripts/). SOT CLAUDE-CONTEXT.md fully refreshed: dropped Webflow/Make.com/Tally/Airtable/Asana/Placid references, added pricing matrix, in-code pipeline, build timeline through 11 May, brand SOT pointers. Stale clone at `/Users/mmh/Documents/Global Apex/Tenu/` now has redirect-only CLAUDE.md + CLAUDE-CONTEXT.md so any agent invoked from that path bounces immediately.
- [ ] MH: Move leaked secrets out of `/Users/mmh/Documents/Global Apex/Tenu/05-Legal-Compliance/` — `client_secret_1016793771503-bnq65154rootrva2e81kh1jicoks7hss.apps.googleusercontent.com.json`, the same with " (1)" suffix, and `stripe_backup_code.txt`. All three are sitting in plaintext in a Documents folder (iCloud-syncable, Time-Machine-backupable). Move to `~/.secrets/` or 1Password, then `rm` from disk. **Do NOT git commit them anywhere.** (p:0, due 2026-04-19)
- [ ] CC: Migrate stragglers from stale-clone `05-Legal-Compliance/` into SOT — `01-Legal-Checklist.md` (review + dedupe against SOT 05-Legal-Compliance content first), `etat-des-lieux.pdf`, `etat-des-lieux-meuble.pdf`, `modele-etat-des-lieux T2-T3.pdf` into SOT `docs/reference/etat-des-lieux/` (or wherever Dr Mubashir prefers). Delete from stale clone after move (p:1, due 2026-04-21)
- [ ] MH: Decide fate of `/Users/mmh/Documents/Global Apex/Tenu/` once secrets + legal stragglers are out — archive to `~/Archive/` or `rm -rf`. Sandbox cannot delete the parent folder. (p:1, due 2026-04-22)

## WEEK 1 (20-24 Apr) — pipeline + native scaffold

- [x] CC: Implement /api/risk-scan Haiku handler per prompt-spec-scan-v2.md, JSON validation, cost cap (p:0, due 2026-04-21) — done 2026-04-17: French system prompt, grille injection, zod validation, Haiku→Haiku→Sonnet retry, €0.12 cost cap per scan, v2 payload persisted to inspections.risk_score jsonb, ScanError codes surfaced as 400/402/422/502 on the route
- [x] CC: Implement /api/dispute-letter Sonnet handler per prompt-spec-dispute-v2.md, FR LRAR + UK TDS/DPS branches (p:0, due 2026-04-22) — done 2026-04-18: code shipped 2026-04-17 (zod schema + FR/EN system prompts + Sonnet → Sonnet retry + items-sum validation ±1 EUR + €0.50 cost cap + DisputeError 9 codes → HTTP 400/402/404/409/502/504 + server-forced disclaimer injection + /api/ai/dispute reads v2 scan from inspections.risk_score.v2 and upserts dispute_letters). Typecheck verified 2026-04-18: `npx tsc --noEmit` exit 0 on fresh sandbox after index.lock clear.
- [x] CC: Implement /api/upload Cloudflare R2 EU + presigned URL flow (p:0, due 2026-04-22) — done 2026-04-18: shipped as two-phase flow at /api/mobile/upload-intent (presigned PUT URL) + /api/mobile/upload-commit (object verification + DB row), backed by src/lib/storage/r2-upload.ts and src/app/api/photos/route.ts. Commits 0a0192b + 22d028f. Path differs from original /api/upload title — same goal, mobile-scoped route.
- [>] CC: End-to-end pipeline wiring Stripe webhook → Supabase → R2 → Haiku → @react-pdf/renderer → R2 → Brevo (p:0, due 2026-04-23) — partially wired 2026-04-18: Stripe webhook → Supabase chain live (src/app/api/webhooks/stripe/route.ts, commit ce748ec, admin client bypasses RLS). Photos up through R2, scan via /api/ai/scan (Haiku) and dispute via /api/ai/dispute (Sonnet). MISSING: @react-pdf/renderer PDF generation step (only present in features/scan marketing page, not pipeline), Brevo transactional email leg (zero references in src/). Split into two new tasks below.
- [ ] CC: PDF generation leg — @react-pdf/renderer report builder invoked by webhook/post-scan, output to R2 (p:0, due 2026-04-23)
- [x] CC: Brevo transactional email leg — send scan-complete + dispute-ready emails with R2 PDF link (p:0, due 2026-04-23) — done 2026-04-18: in-repo template model (HTML-as-TS-string), Brevo as REST transport. Shipped src/lib/email/brevo.ts (fetch wrapper, no SDK dep), src/lib/email/notify.ts (high-level notifyScanComplete + notifyDisputeReady pulling email/locale/display_name from profiles via admin client), src/lib/email/templates/{scan-complete,dispute-ready}.ts (FR/EN stacked, Identity v1 palette, matches brevo-welcome.html register). Wired into /api/ai/scan post-update and /api/ai/dispute post-persist, both best-effort (try/catch + console.warn, never block caller). Typecheck exit 0. Link currently points to /inspection/{id}/report — dispute-ready template will grow a "Download PDF" button fed by R2 presigned URL once the @react-pdf/renderer leg lands; helper signature is already stable.
- [ ] MH: Delete iCloud dedup files on Mac — fuse mount blocks Cowork `rm`. Three in `scripts/` (`check-agent-runs 2.sql`, `governance-sync 2.py`, `queue-agent-tasks-2026-04-17 2.sql`) PLUS ~40 more under `src/app/` matching the ` (N).{tsx,ts}` pattern: `icon (1..8).tsx`, `apple-icon (1..7).tsx`, `opengraph-image (1..8).tsx`, `robots (1..7).ts`, `sitemap (1..8).ts`. Verify Next.js still routes correctly after deletion (these names are likely ignored but the parenthesised form is suspicious — confirm `npm run build` exit 0). One-liner from repo root: `find src/app scripts -type f -name "* [0-9]*"  -print -delete` after a quick `find` dry-run. (p:1, due 2026-04-19)
- [x] CC: Capacitor 7 scaffold — TS code-side complete: capacitor.config.ts, MobileGate, Shell, intro/onboarding carousel, preferences wrapper, deep-link handler, mobile/upload-intent + upload-commit (p:0, due 2026-04-24) — done 2026-04-18: intro flow at src/app/(mobile)/intro/{layout,page}.tsx (3-screen swipe carousel, Apple HIG dots/haptics/skip, Portal mark on screen 1), MobileGate mounted in src/app/layout.tsx (native first-launch routes to /intro/, returning users to /app-home/), preferences.ts with Capacitor Preferences + localStorage fallback, brand colours aligned to Identity v1 (#F4F1EA paper / #0B1F3A ink — drift from #F5F1E8/#0F3B2E corrected in capacitor.config.ts and Shell.tsx), resources/{icon,icon-foreground,icon-background,splash,splash-dark}.svg authored for @capacitor/assets. Native iOS + Android project add still required on Mac — see MH lines below.
- [ ] MH: Run `npm run build:mobile` on Mac to produce out/ static export (p:0, due 2026-04-22)
- [ ] MH: Run `npx cap add ios` on Mac, then merge mobile/ios-Info.plist.snippet.xml entries into ios/App/App/Info.plist (p:0, due 2026-04-22)
- [ ] MH: Run `npx cap add android` on Mac, then merge mobile/android-manifest.snippet.xml + drop network_security_config.xml under res/xml/ (p:0, due 2026-04-22)
- [ ] MH: Run `npx capacitor-assets generate --iconBackgroundColor "#0B1F3A" --iconBackgroundColorDark "#0B1F3A" --splashBackgroundColor "#F4F1EA" --splashBackgroundColorDark "#0B1F3A"` after cap add (p:0, due 2026-04-22)
- [ ] MH: Run `npx cap sync` to wire build:mobile output into native projects (p:0, due 2026-04-22)
- [ ] MH: Open Xcode (`npx cap open ios`), set Team ID + Bundle world.tenu.app + capabilities (Camera, Push, Associated Domains for tenu.world), run on simulator + physical iPhone (p:0, due 2026-04-23)
- [ ] MH: Open Android Studio (`npx cap open android`), set release keystore SHA-256 in mobile/.well-known/assetlinks.json placeholder, run on emulator + physical device (p:0, due 2026-04-23)
- [x] CC: Capacitor Camera plugin wired, replace HTML file input (p:0, due 2026-04-24) — done 2026-04-18: MB-06 reworked src/lib/mobile/camera.ts to match brief spec (resultType=Uri, quality=75, width=1600, correctOrientation=true), added CameraPermissionError typed class, null-on-cancel semantics, CameraButton updated to handle null cleanly without error haptic. tsc exit 0. Commit e3714ea.
- [ ] CC: Android ↔ iOS native-chrome parity audit (splash, status bar, safe-area, fonts, haptics, hardware back, keyboard) — DEFERRED until MH completes `npx cap add ios`/`add android` + `cap sync` and both simulators boot a real `out/` bundle. Audit brief drafted 2026-04-19 (Dr Mubashir provided checkpoints a–l + parity checks 1–9). Cannot execute on empty native shells. Re-open this line once cap-add work lands. (p:1, due post-cap-sync)
- [ ] CC: consents table + 4 consent UX touchpoints + timestamp + version pin (p:0, due 2026-04-23)
- [ ] CC: ECB daily refresh cron for EUR/GBP feeding calculatePrice (p:0, due 2026-04-24)
- [x] MH: Stripe webhook endpoint created in live mode, paste signing secret (p:0, due 2026-04-22) — done 2026-04-18: webhook endpoint configured in Stripe live mode, signing secret pasted to .env.local + Vercel (per Dr Mubashir)
- [ ] MH: Sign DPAs with Supabase, Cloudflare, Stripe, Vercel, Brevo, Anthropic (p:0, due 2026-04-24)

### Apps readiness sprint (CC, 2026-04-18 evening)

- [x] CC: MB-01 — verify npm run build:mobile produces clean out/ (p:0, due 2026-04-18) — done 2026-04-18: exit 0, out/ present, no @anthropic-ai/sdk or SUPABASE_SERVICE_ROLE_KEY in client chunks. Known structural issue documented in handover doc: app router pages drop from export because root layout uses async cookies()/headers() — only /404 ships. Two recovery paths offered to MH. Commit cddebcb.
- [x] CC: MB-03 — Info.plist + AndroidManifest snippets with bilingual usage descriptions (p:0, due 2026-04-18) — done 2026-04-18: ITSAppUsesNonExemptEncryption=false + LSApplicationQueriesSchemes added to ios-Info.plist.snippet.xml; android-AndroidManifest.xml.snippet renamed to android-manifest.snippet.xml to match TASKS.md references; POST_NOTIFICATIONS permission added; standalone mobile/network_security_config.xml created for drop-in to res/xml/. Commit 5ef8c71.
- [x] CC: MB-05 — iOS Privacy Manifest (Apple May 2024 mandate) (p:0, due 2026-04-18) — done 2026-04-18: mobile/PrivacyInfo.xcprivacy authored per Apple spec. Declared collected types (email, photos, userID, product interaction — all linked, none tracking), accessed APIs (UserDefaults CA92.1, FileTimestamp C617.1, DiskSpace E174.1, SystemBootTime 35F9.1), NSPrivacyTracking=false. Commit a4b21b4.
- [x] CC: MB-08 — Mac-side mobile build handover doc (p:0, due 2026-04-18) — done 2026-04-18: docs/10-Mobile-Build-Handover-2026-04-19.md. Steps 0–10 with expected output + red-flag per step, covers repo sync, npm install, build:mobile verify, cap add ios + Info.plist merge, Privacy Manifest drop, cap add android + manifest + network security config, icon generation (capacitor-assets OR manual copy), cap sync, Xcode signing + capabilities, keystore + SHA-256 capture, TestFlight + Play internal upload. Explicit callout on root-layout dynamic-APIs blocker with two recovery paths. Commit c24f3d6.
- [x] CC: MB-09 — session closeout + tracker mirror refresh (p:0, due 2026-04-18) — done 2026-04-18: this entry. Tracker xlsx + dashboard regenerated.

## OOO BRIDGE (27-30 Apr)

- [x] CC: App icon set — 1024, 512, 180, 120, 87, 60, 40, 29 iOS + Play adaptive (p:0, due 2026-04-28) — done 2026-04-18 (ahead of schedule): MB-02 shipped scripts/generate-icons.mjs (sharp-based ladder generator, npm run icons:generate) and committed the full PNG set at resources/icons-generated/{ios,android}/ — 13 iOS sizes (20@1x through 1024 marketing) + 5 Android mipmap densities (mdpi→xxxhdpi, launcher + launcher_round + adaptive foreground + adaptive background) + 512 Play Store. MH can choose capacitor-assets OR direct copy at cap-add time. Commit 93e6592.
- [x] CC: Splash screens per density, status bar theming, safe-area insets (p:0, due 2026-04-29) — done 2026-04-18: already shipped via commit f21f5a8 (MobileGate + Shell + resources/{splash,splash-dark}.svg sources + capacitor.config.ts SplashScreen plugin config at #F4F1EA/#0B1F3A, StatusBar overlaysWebView=false). capacitor-assets generate on the Mac (documented in the handover doc) produces the density ladder from the SVG sources.
- [x] CC: Deep-linking scheme tenu:// + Universal Links config pointing at tenu.world (p:0, due 2026-04-30) — done 2026-04-18: MB-04 shipped src/app/.well-known/apple-app-site-association/route.ts (applinks details for /auth/callback, /app-home, /inspection, /report, /dispute with force-static) and assetlinks.json/route.ts (android_app target world.tenu.app, SHA-256 placeholder with TODO for MH post-keystore), middleware allow-listed /.well-known. tenu:// scheme already present in capacitor.config.ts + Info.plist + AndroidManifest snippets. TEAMID still a TODO (unblocks once Apple Developer enrolment completes). Commit 88cc97e.
- [x] CC: Store listing copy drafted in FR + EN — description, keywords, support URL, privacy URL (p:0, due 2026-04-30) — done 2026-04-18 (ahead of schedule): MB-07 shipped docs/store-listings/{ios-fr,ios-en,play-fr,play-en}.md. Professional services register throughout (no buzzwords, no guaranteed-outcome claims), character counts validated inline, Stripe reader-app classification explicitly argued in reviewer notes, data safety section filled for Play form. Awaits MH (nights) review + edit before submission. Commit 50db60f.
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
| 2026-04-18 | Brevo transactional email leg shipped: scan-complete and dispute-ready fire from their respective /api/ai/ routes post-persist, best-effort. PDF leg still pending Dr Mubashir call. |
| 2026-04-18 evening | Apps readiness sprint — MB-01..MB-08 shipped (commits cddebcb, 93e6592, 5ef8c71, 88cc97e, a4b21b4, e3714ea, 50db60f, c24f3d6). Icons, native snippets, Privacy Manifest, AASA + assetlinks routes, Camera wrapper spec, store listings, and a numbered Mac-side handover doc. cap add / cap sync / Xcode / Android Studio steps remain MH-owned per Week 1 plan. Structural blocker flagged: static export currently drops app router pages to /404 only — two recovery paths documented in the handover doc for MH to pick tomorrow morning. |
| 2026-04-19 | SOT consolidation. CLAUDE.md + CLAUDE-CONTEXT.md at SOT path rewritten to match real repo layout and current React/in-code stack. Stale clone at `/Users/mmh/Documents/Global Apex/Tenu/` neutralised with redirect-only CLAUDE.md + CLAUDE-CONTEXT.md. Two real findings parked in TASKS.md: (a) leaked OAuth + Stripe secrets in plaintext under stale clone's 05-Legal-Compliance/ — MH p:0, (b) état-des-lieux PDFs + legal checklist stranded in stale clone — CC p:1 to migrate. Android↔iOS parity audit brief received but deferred — cannot run before cap add / cap sync. Logged as CC line in Week 1. |
