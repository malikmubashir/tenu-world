# 16 — Go-Live Replan, 2026-06-10 (#T136)

**Author:** CC (Agent C, planning lead) · **Date:** Wednesday 2026-06-10 · **Target:** Public launch **Wednesday 15 July 2026** (D-35)

Context: the 11 May soft launch was retired (DECISION 2026-05-03); a web-only F&F launch shipped at tenu.world instead. Native iOS build 1.0(1) was uploaded to TestFlight 2026-05-09 but never went further. Android has no Play Console account. The RGPD V3 iteration with DPO Renaud stalled in late May on three MH admin confirmations. This document audits every open task, rebuilds the critical path to 15 Jul, and names the decision points.

**Verdict up front: 15 Jul is feasible for the web public launch — but only if the compliance chain (MEDICYS, RGPD V3, avocat sign-off, DPAs, dpo@) closes by end of June. The code is not the risk; the ~30 open MH-owned admin/legal lines are. Native iOS at launch is a bonus, not a commitment. Android is post-launch unless the Play Console account is opened this week.**

---

## Part 1 — Blocker audit

Source: TASKS.md as of 2026-06-10 (last sync 2026-05-21 + RGPD block 2026-05-22 + polish sprint 2026-06-10). Every `[ ]` / `[>]` line extracted: **60 ID'd open lines + ~11 un-ID'd checkboxes** (iOS TestFlight ×4, Workspace DKIM/DMARC ×2, Play Console ×5).

### (a) Hard launch blockers for 15 Jul — 22 lines + 4 validation-gate

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| #T088 | MEDICYS médiateur adhésion | MH | `[>]`, **overdue 28 May** | Obligation L612-1 Code de la conso — cannot open commercial signups without it. Decision already made, ~20 min online + ~€300, 3–5 day processing. 5 `[MEDIATEUR PENDING]` placeholders in legal pages wait on the certificate. |
| #T111 | FR avocat formal sign-off letter | CC/MH | **overdue 6 Jun** | Line says it explicitly: "formal letter required before paid signups open beyond F&F cohort". Third-party dependency — the single least controllable item on the path. |
| #T133 | RGPD V3 final to Renaud (AP3R) | MH | **overdue 31 May** | Blocked on #T128 + #T130–#T132 below. Launching publicly with unvalidated privacy docs is CNIL exposure, not a paperwork nicety. |
| #T128 | Téléphone éditeur — answer from Renaud | MH | **overdue 27 May** | Chase. If phone required → #T129 (virtual line, €15–25/mo, same day). |
| #T130–#T132 | 3 admin captures: Supabase OTP 3600s, PITR plan, Anthropic ZDR | MH | **overdue 28 May** | ~30 minutes total. These have been blocking V3 for two weeks. |
| #T091 | dpo@tenu.world mailbox + auto-ack | MH | **overdue 25 May** | Workspace is live on globalapex.net since 9 May — adding tenu.world as secondary domain + alias is now a small job, not a project. dpo@ is printed in the RGPD docs; it must answer before launch. |
| #T066 | DPAs signed: Supabase, Cloudflare, Stripe, Vercel, Brevo, Anthropic | MH | **overdue 25 May** | All six are click-through/standard DPAs. One sitting. Archive PDFs in docs/dpa-archive/. |
| #T028–#T037 | Google OAuth migration chain (10 sequential MH steps) | MH | open, due **4–6 Jul** | **Due dates are too late — see verdict below.** |
| #T041, #T042, #T044 | Vercel env audit, Maps key restriction, Sensitive flags | MH | **overdue 24–28 May** | Residue of the April Vercel incident. Security hardening that should not survive into a public launch. |
| #T011 | Brevo account access recovery | MH | due 12 Jun | API key still sends (transactional email works), but no dashboard = no bounce monitoring, no template fixes, no recourse if Brevo flags the account mid-launch. Ops-critical. |
| #T092, #T097, #T098, #T099 | F&F list, LAUNCH25 coupon, invites, 24h monitoring | MH | #T098/#T099 **overdue 6 Jun** | Validation gate, not a mechanical blocker: the whole point of F&F-before-public was outcome data. Five weeks remain — enough for one real cohort cycle if invites go out Mon 16 Jun. |

**OAuth chain verdict (#T028–#T037, due 4–6 Jul): too late, by design margin not by arithmetic.** The chain is 10 sequential steps, all MH, single sitting (~40–60 min per the #T087 runbook). But: (1) Google brand verification on a production consent screen typically takes **2–3 business days** even for basic scopes (email/profile/openid need no full verification, only the lighter brand check) — finishing 6 Jul means the consent screen may clear 9–10 Jul, five days before launch, with zero room for a 403 or redirect-URI mistake; (2) the *current* production Google login points at the burned `gen-lang-client-0896170717` credential — that is a live security defect today, not a July task; (3) the smoke test (#T034) is the only end-to-end auth verification on the calendar. **Pull the whole chain to 16–20 Jun.** Partial supersession noted: #T028 (Workspace subscription) is half-done — Workspace Business Starter is active on globalapex.net since 2026-05-09; the remaining work is adding tenu.world as a secondary/alias domain and creating ops@/support@/dpo@, not a new subscription.

### (b) Native-store blockers — 16 ID'd lines + ~9 checkboxes

**Apple — better than the tracker admits.** Enrolment complete (Team XWP5RS8Q4H), bundle ID registered, ASC record created, AASA deployed with the real Team ID, Xcode signing + Associated Domains configured, **build 1.0(1) uploaded to App Store Connect 2026-05-09 17:13**. That upload is only possible with a distribution certificate, so **#T113, #T114 and #T116 are stale-open — verify and close them**. #T115 (merge preflight → main) is also done per git log (PR #1 merged). Genuinely open: TestFlight internal tester + physical-iPhone test (#T117 + 2 un-ID'd checkboxes), magic-link Universal Link test, App Store metadata/screenshots (#T076, #T077), IAP stance decision (#T078), Firebase push (#T082, optional for v1), camera retry hardening (#T101), parity audit (#T062), Android keystore (#T060).

Current Apple review reality: most submissions clear in **24–48h**, but first submissions get a more thorough business-model/policy pass and the *queue* before review has been running 2–3 days; budget **one rejection cycle ≈ one week** ([Runway live tracker](https://www.runway.team/appreviewtimes), [lowcode.agency 2026](https://www.lowcode.agency/blog/app-store-review-time), [ptkd.com](https://ptkd.com/app-store/how-long-does-apple-app-store-review-take)). A reader-app/external-payment model on a paid-service app is exactly the kind of first submission that draws scrutiny — #T078 (IAP stance, documented physical-service argument) must be locked before submission.

**Google Play — not started, and #T020's 1 Jul due date is fantasy for a 15 Jul store presence.** Sequencing per Google: org account creation + $25 fee → **D-U-N-S** (Global Apex SAS already has one — Apple org enrolment required it, so #T015 is a lookup/reuse, not a 30-day wait; a *new* D-U-N-S request can take up to 30 days, which is why reuse matters) → org identity verification **2–7 business days** → Merchant profile/payments verification **~5 days** → first production review for new developer accounts **up to 7+ days** ([Play Console help — required info](https://support.google.com/googleplay/android-developer/answer/13628312?hl=en), [identity verification](https://support.google.com/googleplay/android-developer/answer/10841920?hl=en), [x-apps.dev org checklist](https://www.x-apps.dev/google-play-console-organization-verification/), [aerious review times](https://aerious.uk/blog/google-play-review-time-in-2026-real-timelines-and-how-to-avoid-delays)). One genuine relief: the **12-testers-for-14-days closed-testing requirement applies to personal accounts only — organization accounts are exempt** ([x-apps.dev](https://www.x-apps.dev/google-play-console-organization-verification/), [testers community 2026](https://www.testerscommunity.com/blog/google-play-developer-verification-2026)). Even so: open the account this week or take Android off the 15 Jul slide entirely. Recommendation: **Android ships post-launch (late July)**; open the Play Console account now anyway so verification clocks run in parallel.

### (c) Compliance blockers — 14 lines (12 overlap with class a)

RGPD V3 chain (#T128–#T133, 6 lines, all overdue), DPAs (#T066), dpo@ (#T091), MEDICYS (#T088), avocat sign-off (#T111), OAuth consent screen specifically (#T031, #T037 — the consent screen must show "Tenu" + support@tenu.world to match the privacy policy). **UK lines #T008 (solicitor brief send) and #T090 (TDS/DPS sign-off): reclassify p:0 → p:2.** UK is disabled at launch by locked decision; carrying them as overdue p:0 is tracker noise that hides real blockers. Re-open when the UK re-enable decision is taken.

### (d) Deferrable — ~18 lines

#T003 (tracker housekeeping), #T010 (scheduled-push install), #T102 (full T-103 suite), #T103 (14-day survey cron — schedule for early July so the *public* cohort gets surveys; F&F can be surveyed manually), #T104 (extra locales), #T106 (store updates), #T107–#T109 (PDF storage refactors; #T109 signed-URL TTL is the one worth pulling forward post-launch), #T112 (DPA middleware), #T118/#T119 (Cowork/MCP hygiene), #T129 (conditional on Renaud), #T062 (parity audit), DKIM/DMARC checkboxes, #T134/#T135 (in-flight polish sprint, due 11 Jun). #T110 (e2e env) sits between (a) and (d): not a legal gate, but it is the only automated end-to-end verification of auth→upload→scan→webhook — wire it before the OAuth smoke test so #T034 has a harness.

---

## Part 2 — Critical path, 10 Jun → 15 Jul

Five working weeks. The constraint is MH bandwidth: ~30 open MH lines, and CC cannot sign DPAs, click consoles, or answer Renaud. The plan front-loads every third-party clock (Google verification, MEDICYS certificate, avocat, Apple review, Play org verification) into the first two weeks.

### Week 1 — Wed 10 → Sun 14 Jun: unblock the clocks
| What | Owner | Lines |
|---|---|---|
| 3 RGPD admin captures (Supabase OTP, PITR, Anthropic ZDR) — 30 min, two weeks overdue | MH | #T130–#T132 |
| Chase Renaud on téléphone éditeur; open virtual line same day if required | MH | #T128, #T129 |
| Finish MEDICYS adhésion (certificate clock starts: 3–5 days) | MH | #T088 |
| dpo@tenu.world live: add tenu.world to existing Workspace, alias + auto-ack | MH | #T091, partially #T028 |
| Open Play Console org account ($25, reuse D-U-N-S from Apple enrolment) — starts 2–7 day verification | MH | #T020, #T015, #T023 |
| Stripe LAUNCH25 coupon + F&F list of 8 | MH | #T097, #T092 |
| Brevo recovery: password reset, else support ticket | MH | #T011 |
| Wire e2e env (.env.test.local), camera retry hardening | CC | #T110, #T101 |
| Re-date OAuth chain + reclassify UK lines in TASKS.md, rebuild dashboard | CC | new lines below |

### Week 2 — Mon 15 → Sun 21 Jun: OAuth + RGPD close + F&F live
- **Mon 16 Jun 09:00:** F&F invites out (#T098), 24h monitoring (#T099). This is the last date that still yields a meaningful cohort cycle before 15 Jul.
- **One sitting, Mon–Tue:** full OAuth chain #T028→#T037 per the #T087 runbook. Publish consent screen to production immediately; brand verification buffer 2–3 business days lands within the week. Smoke test #T034 through the new e2e harness.
- RGPD V3 assembled and sent to Renaud (#T133) — everything it waits on closes in Week 1.
- DPAs all six signed + archived (#T066).
- iOS: internal tester added in ASC, TestFlight on iPhone 12, magic-link Universal Link test (#T117 + checkboxes). Bug list out of it feeds Week 3.
- Vercel hardening closed (#T041, #T042, #T044).

### Week 3 — Mon 22 → Sun 28 Jun: legal surface final + store assets
- MEDICYS certificate in hand → CC updates the 5 `[MEDIATEUR PENDING]` placeholders same day.
- **Decision point D2, Fri 26 Jun: avocat formal sign-off received?** (see below)
- Renaud V3 validation expected back; integrate any final nits.
- Store: screenshots (#T076), listing copy review (#T077), IAP stance locked (#T078), App Store metadata complete. Firebase push (#T082) if time allows — not a gate.

### Week 4 — Mon 29 Jun → Sun 5 Jul: iOS submission window + web hardening
- **Decision point D3, Wed 1 Jul: submit iOS to App Review or decouple.** Review 24–72h typical + first-submission scrutiny + one rejection cycle = it can still make 15 Jul if submitted 1 Jul, and cannot if submitted later.
- Android: if Play verification cleared, upload to internal track; production review for a new org account (up to 7+ days) means **Android at 15 Jul is already out of plan** — internal/closed track only.
- Web: T-103 subset re-run, launch-day monitoring doc (docs/14) refreshed, legal pages final-versioned ("v1.0-final" once avocat letter lands).

### Week 5 — Mon 6 → Tue 14 Jul: freeze and gate
- **Code freeze Wed 8 Jul** — no schema, auth, or pricing changes after this date. ~~`feat/bedrock-migration` stays parked; it does not merge before launch under any argument.~~ **AMENDED 2026-06-12 (MH decision, RGPD V5):** the V5 sent to the DPO describes Bedrock Frankfurt as the operative AI architecture at publication. `feat/bedrock-migration` MUST therefore merge and be live in prod BEFORE the 8 Jul freeze (#T189 re-scoped, due 6 Jul: AWS account, model access, Vercel secrets, eu-central-1 verified, console capture for the compliance file). The ZDR path (#T178 path b) is dead — ZDR is Enterprise-only.
- **Decision point D4, Fri 10 Jul: GO/NO-GO.** Checklist: MEDICYS live in legal pages · RGPD V5 validated by Renaud · 6 DPAs archived (incl. AWS) · **Bedrock live in prod, region eu-central-1 verified — without it the published policy describes non-existent processing (Art. 13 RGPD), hard NO-GO** · OAuth consent screen in production showing "Tenu"/support@ · dpo@ answering · e2e suite green · avocat letter (or documented D2 fallback) · Stripe live-mode sanity.
- Launch comms prep Mon 13–Tue 14. **Launch Wed 15 Jul.**

### Decision points — stated bluntly

- **D1 (Fri 13 Jun) — Android scope.** Recommendation: cut Android from 15 Jul now. Verification arithmetic (2–7d org + ~5d merchant + 7+d first review) consumed the margin weeks ago. Open the account anyway this week; ship Android late July. Cost of deciding now: zero — nothing user-facing promised Android.
- **D2 (Fri 26 Jun) — avocat formal sign-off.** If the letter hasn't arrived: do **not** silently launch. Options, in order: (1) phone the cabinet and convert "agreed in principle 8 May" into a one-page letter with a fee bump if needed; (2) ask the avocat directly whether public paid signups can open on in-principle approval + médiateur in place, and get *that* in writing; (3) slip the paid-open gate (not the launch date) — launch 15 Jul with F&F-coupon-style gated checkout until the letter lands. Option 3 keeps the date and the legal posture; it costs early revenue, which is currently ~zero anyway.
- **D3 (Wed 1 Jul) — iOS App Review.** Not submitted by 1 Jul → 15 Jul is web-only public launch, app follows whenever review clears. The web product is the product; the app is distribution. No slip of the date for the binary.
- **D4 (Fri 10 Jul) — GO/NO-GO.** Any unchecked compliance item = NO-GO and a one-week slip to Wed 22 Jul. A public launch that triggers a CNIL complaint or a DGCCRF médiateur check in week one is strictly worse than a 7-day slip.

### What makes 15 Jul slip — top risks

1. **RGPD V3 inertia.** Six lines overdue 2 weeks, all waiting on ~1 hour of MH admin work plus Renaud's turnaround. If V3 isn't validated by ~4 Jul, D4 fails. Mitigation: Week 1 list, day one.
2. **Avocat sign-off is third-party and unbounded.** Only item on the path MH cannot brute-force. Mitigation: D2 with the option-3 fallback that preserves the date.
3. **OAuth chain at 4–6 Jul.** Single sitting, single owner, external verification clock, currently scheduled inside the freeze window. Mitigation: pull to 16–20 Jun (this replan).
4. **MH bandwidth.** ~30 open MH lines, solo founder, active consulting engagements. The plan only works because Weeks 1–2 are mostly sub-hour console tasks. Mitigation: the 72-hour list below is ordered; do it top-down, skip nothing, add nothing.
5. **First-submission App Review on a reader-app payment model.** Highest-variance native risk. Mitigation: D3 decoupling — the launch date never depends on Apple.

### Next 72 hours (Wed 10 — Fri 12 Jun)

**MH — ~3 hours total, ordered:**
1. #T130–#T132 — three screenshots (Supabase OTP expiry, PITR plan, Anthropic ZDR). 30 min. Unblocks V3.
2. #T128 — email Renaud re téléphone éditeur (and tell him the three captures are coming).
3. #T088 — finish MEDICYS adhésion online. 20 min + payment.
4. #T091 — add tenu.world to Workspace, create dpo@ alias + auto-ack. ~30 min.
5. #T020 — open Play Console org account, reuse D-U-N-S, pay $25, start verification.
6. #T097 — create LAUNCH25 coupon in Stripe (instructions already delivered 8 May); draft F&F list (#T092).
7. #T011 — Brevo password reset; if 2FA-blocked, open the support ticket today (their identity verification takes days).

**CC — this session/tomorrow:**
8. Commit this replan + CLAUDE.md refresh; orchestrator transcribes the task lines below; rebuild dashboard.
9. #T110 — e2e env wiring spec so MH only pastes two keys.
10. #T101 — camera retry/offline-queue hardening PR.

### Proposed new TASKS.md lines (ready to paste — stamp script assigns IDs)

```
- [ ] MH: Decide Android scope for 15 Jul — recommend cut to post-launch; open Play Console account regardless this week (p:0, due 2026-06-13)
- [ ] CC: Re-date OAuth chain #T028–#T037 from 4–6 Jul to 16–20 Jun and reclassify UK lines #T008/#T090 to p:2 in TASKS.md, rebuild dashboard (p:0, due 2026-06-11)
- [ ] MH: Execute full Google OAuth migration #T028–#T037 in one sitting per #T087 runbook, publish consent screen to production same day (p:0, due 2026-06-20)
- [ ] MH: Send F&F invites Mon 16 Jun 09:00 Paris — coupon + list must exist first (#T097/#T092) (p:0, due 2026-06-16)
- [ ] MH: Chase FR avocat for formal written sign-off letter — hard date, fallback options documented in docs/16 §D2 (p:0, due 2026-06-26)
- [ ] CC: Update 5 [MEDIATEUR PENDING] placeholders in legal pages same day MEDICYS certificate arrives (p:0, due 2026-06-27)
- [ ] MH: Verify and close stale iOS lines #T113/#T114/#T115/#T116 — TestFlight upload 2026-05-09 implies all four complete (p:1, due 2026-06-13)
- [ ] MH: iOS App Review submission decision point — submit by 1 Jul or decouple binary from 15 Jul launch per docs/16 §D3 (p:0, due 2026-07-01)
- [ ] CC: Refresh docs/14-Launch-Day-Monitoring.md for the 15 Jul public launch (p:1, due 2026-07-08)
- [ ] MH: GO/NO-GO review against docs/16 §D4 checklist — any unchecked compliance item slips launch to 22 Jul (p:0, due 2026-07-10)
- [ ] CC: Code freeze 8 Jul — no schema/auth/pricing changes after this date; feat/bedrock-migration must be merged and live BEFORE freeze (amended 2026-06-12, see #T189) (p:0, due 2026-07-08)
```

---

## Sources (freshness checks, retrieved 2026-06-10)

- Apple review times: [Runway live App Review tracker](https://www.runway.team/appreviewtimes) · [lowcode.agency — App Store Review Time 2026](https://www.lowcode.agency/blog/app-store-review-time) · [ptkd.com — how long does review take](https://ptkd.com/app-store/how-long-does-apple-app-store-review-take) · [aerious.uk — approval windows 2026](https://aerious.uk/blog/app-store-review-time-in-2026-expected-approval-windows-and-delays)
- Play Console org requirements: [Google Play Console Help — required information](https://support.google.com/googleplay/android-developer/answer/13628312?hl=en) · [Google Play Console Help — identity verification](https://support.google.com/googleplay/android-developer/answer/10841920?hl=en) · [x-apps.dev — org verification checklist (12-tester exemption)](https://www.x-apps.dev/google-play-console-organization-verification/) · [testerscommunity.com — developer verification 2026](https://www.testerscommunity.com/blog/google-play-developer-verification-2026) · [aerious.uk — Play review times 2026](https://aerious.uk/blog/google-play-review-time-in-2026-real-timelines-and-how-to-avoid-delays)
- D-U-N-S: free request can take up to 30 days ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/13628312?hl=en)) — moot for Tenu: Global Apex SAS's number already exists from Apple org enrolment; #T015 is lookup/reuse.
- OAuth consent screen: brand verification 2–3 business days for basic scopes; full verification not required for email/profile/openid ([Google — configure OAuth consent](https://developers.google.com/workspace/guides/configure-oauth-consent) · [Google Cloud Help — submitting for verification](https://support.google.com/cloud/answer/13461325?hl=en))
