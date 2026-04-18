# Tenu.World — Agent Execution Strategy

**Version:** 1.0
**Date:** 2026-04-15
**Status:** RETIRED 2026-04-18. Document kept for historical reference.
**Objective:** Go live with full-stack app: Next.js web + Capacitor iOS + Capacitor Android. Zero more wasted runs.
**Supersedes:** 01-MVP-Architecture.md (Make.com no-code approach is abandoned. We build everything.)

> ⚠ **RETIRED 2026-04-18.** Paperclip agents retired 2026-04-17, OpenAI account cancelled 2026-04-18. All execution now happens via Claude Cowork sessions directly against the Tenu.World repo. This strategy document describes the prior multi-agent approach and is preserved only for context. See `docs/09-Paperclip-Retirement-Handover-2026-04-18.md`.

---

## 1. The Blocker (must fix before anything else)

gemma4:31b via Codex CLI bridge **cannot execute tool calls**. 31 session logs from April 14 confirm this: zero tool invocations, zero files written, zero shell commands executed. The model reasons about tasks but never emits a valid tool-use response. No amount of task breakdown changes this.

### Fix Options (pick one)

| Option | Cost | Risk | Speed |
|---|---|---|---|
| **A. Put Web Dev on claude_local** | ~$2-5 per run (cap at $5) | Credit burnout if uncapped | Fast, proven |
| **B. Switch Ollama to qwen2.5-coder:32b** | $0 (local) | Untested with Codex bridge | Medium, needs validation |
| **C. Cowork session scaffolds, agents iterate** | $0 for scaffold, agents still blocked | Agents may still fail on iteration | Fastest for initial code |
| **D. Drop agents, build manually via Cowork** | $0 beyond this session | No agent orchestration | Fastest to go-live |

**Recommended: Option C then A.**

Cowork scaffolds the entire app (skeleton + routing + i18n + Supabase). Then put Senior Web Dev on claude_local with a $5/run budget cap for iteration tasks. Keep all non-dev agents on Ollama since their work is text-based (plans, docs, strategy), which Ollama handles fine textually even without tool calls.

The three dev agents are the only ones that MUST write files. Everyone else produces plans and documents that Paperclip stores in issue comments, not on disk.

---

## 2. Org Accountability Structure

```
CEO (claude_local)
│   Checks: Are all directors responding? Are issues moving?
│   Escalation: Pauses failed agents, creates incident issue
│
├── CTO (codex_local → keep on Ollama for planning)
│   │   Checks: Are dev agents producing files? Are PRs building?
│   │   Escalation: Re-assigns stuck tasks, flags to CEO
│   │
│   ├── Senior Web Dev (claude_local, $5/run cap)
│   │   Executes: One atomic task per run, commits after each
│   │
│   ├── Senior iOS Dev (codex_local, deferred)
│   │   Status: IDLE until web MVP ships
│   │
│   └── Senior Android Dev (codex_local, deferred)
│       Status: IDLE until web MVP ships
│
├── Head of Marketing (codex_local)
│   Output: GTM plan in issue comments (text only, no files needed)
│
├── Head of Finance (codex_local)
│   Output: KPI tracking, cost projections in issue comments
│
├── Head of Governance (codex_local)
│   Output: GDPR checklist, legal opinion tracker in issue comments
│
└── Head of HR (codex_local)
    Output: Team capacity tracking in issue comments
```

**Key insight:** Only dev agents need tool-use. Everyone else is a planner. Ollama is fine for planning work because Paperclip captures their responses in issue comments. The failure was asking Ollama agents to write files, not to think.

---

## 3. Task Atomicity Rules

Every dev task must satisfy ALL of these:

1. **One file, one task.** Each task creates or modifies exactly one file. If a feature needs 3 files, that's 3 tasks.

2. **Under 10 minutes.** If a task takes longer, it's too big. Break it down further.

3. **Clear input.** The task description includes: which file, what it should contain, what it depends on.

4. **Clear output.** The task description includes: exact filename, where it goes, what "done" looks like.

5. **Git checkpoint.** Every completed task ends with a git commit. If the next task fails, the previous commit survives.

6. **No chaining.** Tasks should be runnable independently where possible. Don't make Task 7 depend on Task 6's runtime output if you can avoid it.

---

## 4. Sprint 0: Web MVP Task Breakdown (41 atomic tasks)

Target: working Next.js 16 app with i18n, camera flow, Supabase auth, deployed on Vercel.

### Phase A: Project Skeleton (Tasks 1-8)

| # | File | Description | Depends on |
|---|---|---|---|
| A1 | `package.json` | Init Next.js 16 + TypeScript + Tailwind + Supabase | nothing |
| A2 | `tsconfig.json` | TypeScript strict config | A1 |
| A3 | `tailwind.config.ts` | Tailwind with Tenu brand colors (#1B4D3E, #F5F0EB) | A1 |
| A4 | `next.config.ts` | Next config with i18n, image domains, env vars | A1 |
| A5 | `.env.local.example` | All env vars documented (Supabase, Anthropic, R2) | nothing |
| A6 | `src/app/layout.tsx` | Root layout with font, metadata, RTL support | A3, A4 |
| A7 | `src/app/page.tsx` | Landing page shell (hero + 6 features + CTA) | A6 |
| A8 | `src/app/globals.css` | Tailwind directives + RTL utilities | A3 |

**Checkpoint: `git commit -m "A: project skeleton"`**
**Verify: `npm run build` passes, dev server starts**

### Phase B: i18n System (Tasks 9-14)

| # | File | Description | Depends on |
|---|---|---|---|
| B1 | `src/lib/i18n/config.ts` | Language list, RTL flags, default locale | nothing |
| B2 | `src/lib/i18n/dictionaries/en.json` | English strings (all UI text) | nothing |
| B3 | `src/lib/i18n/dictionaries/fr.json` | French strings | B2 |
| B4 | `src/lib/i18n/dictionaries/ar.json` | Arabic strings (RTL) | B2 |
| B5 | `src/lib/i18n/dictionaries/zh.json` | Chinese strings | B2 |
| B6 | `src/lib/i18n/server.ts` | getDictionary() server function + middleware | B1, B2 |

**Checkpoint: `git commit -m "B: i18n with 4 priority languages"`**
**Verify: switching locale renders correct strings, RTL works for Arabic**

### Phase C: Auth + Database (Tasks 15-20)

| # | File | Description | Depends on |
|---|---|---|---|
| C1 | `src/lib/supabase/client.ts` | Browser Supabase client | A5 |
| C2 | `src/lib/supabase/server.ts` | Server Supabase client (cookies) | A5 |
| C3 | `src/lib/supabase/middleware.ts` | Auth middleware for protected routes | C2 |
| C4 | `supabase/migrations/001_schema.sql` | Tables: users, inspections, rooms, photos, disputes | nothing |
| C5 | `src/app/auth/login/page.tsx` | Login page (email magic link) | C1, B6 |
| C6 | `src/app/auth/callback/route.ts` | Auth callback handler | C2 |

**Checkpoint: `git commit -m "C: Supabase auth + schema"`**
**Verify: can sign up, sign in, see protected page**

### Phase D: Camera + Evidence Flow (Tasks 21-30)

| # | File | Description | Depends on |
|---|---|---|---|
| D1 | `src/components/camera/CameraCapture.tsx` | Camera component (getUserMedia, capture, preview) | A6 |
| D2 | `src/components/camera/RoomSelector.tsx` | Room picker (kitchen, bathroom, bedroom, etc.) | B6 |
| D3 | `src/components/camera/PhotoGrid.tsx` | Grid showing captured photos per room | D1 |
| D4 | `src/lib/storage/r2-upload.ts` | Upload photo to Cloudflare R2 (server action) | A5 |
| D5 | `src/app/inspection/new/page.tsx` | New inspection wizard (step 1: property details) | C5, B6 |
| D6 | `src/app/inspection/[id]/capture/page.tsx` | Photo capture page (room by room) | D1, D2, D3 |
| D7 | `src/app/inspection/[id]/review/page.tsx` | Review all photos before submission | D3, D4 |
| D8 | `src/app/api/inspection/create/route.ts` | API: create inspection record in Supabase | C2, C4 |
| D9 | `src/app/api/inspection/submit/route.ts` | API: mark inspection complete, trigger AI scan | D8, D4 |
| D10 | `src/components/ui/ProgressStepper.tsx` | Step indicator (details → capture → review → report) | B6 |

**Checkpoint: `git commit -m "D: camera + evidence flow"`**
**Verify: can create inspection, capture photos room by room, upload to R2, review**

### Phase E: AI Risk Scan + Report (Tasks 31-36)

| # | File | Description | Depends on |
|---|---|---|---|
| E1 | `src/lib/ai/risk-scan.ts` | Claude Haiku call: photos → risk JSON per room | A5 |
| E2 | `src/lib/ai/dispute-letter.ts` | Claude Sonnet call: risk data → formal letter | E1 |
| E3 | `src/app/inspection/[id]/report/page.tsx` | Report page (risk scores, room breakdown) | E1, B6 |
| E4 | `src/app/api/ai/scan/route.ts` | API: trigger risk scan, store results | E1, C4 |
| E5 | `src/app/api/ai/dispute/route.ts` | API: generate dispute letter | E2, C4 |
| E6 | `src/lib/pdf/generate-report.ts` | Generate PDF report (risk + photos + letter) | E1, E2 |

**Checkpoint: `git commit -m "E: AI risk scan + report generation"`**
**Verify: submit inspection → get risk scores → view report → download PDF**

### Phase F: Payment + Deployment (Tasks 37-41)

| # | File | Description | Depends on |
|---|---|---|---|
| F1 | `src/lib/payments/stripe.ts` | Stripe checkout session creation | A5 |
| F2 | `src/app/api/webhooks/stripe/route.ts` | Stripe webhook handler (unlock report) | F1, C4 |
| F3 | `src/app/pricing/page.tsx` | Pricing page (€15 scan + €20 dispute) | B6, F1 |
| F4 | `vercel.json` | Vercel deployment config | A4 |
| F5 | `.github/workflows/ci.yml` | CI: lint + type-check + build on PR | A1 |

**Checkpoint: `git commit -m "F: payments + deployment"`**
**Verify: full flow works end-to-end on Vercel preview**

### Phase G: Capacitor iOS (Tasks 42-48, Senior iOS Dev)

| # | File | Description | Depends on |
|---|---|---|---|
| G1 | `capacitor.config.ts` | Capacitor config (appId: world.tenu.app, server URL) | F4 |
| G2 | `ios/App/Podfile` | CocoaPods dependencies (Camera, Push) | G1 |
| G3 | `src/lib/native/camera.ts` | Capacitor Camera plugin wrapper (native capture) | D1, G1 |
| G4 | `src/lib/native/filesystem.ts` | Capacitor Filesystem for offline photo staging | G1 |
| G5 | `src/lib/native/push.ts` | Push notification registration + handling | G1 |
| G6 | `src/hooks/usePlatform.ts` | Detect web vs iOS vs Android, adapt UI | G1 |
| G7 | `ios/App/App/Info.plist` | Camera, photo library, location permissions | G2 |

**Checkpoint: `git commit -m "G: Capacitor iOS shell"`**
**Verify: `npx cap sync ios`, Xcode builds, camera works on simulator**

### Phase H: Capacitor Android (Tasks 49-54, Senior Android Dev)

| # | File | Description | Depends on |
|---|---|---|---|
| H1 | `android/app/build.gradle` | Android dependencies, minSdk 24, camera perms | G1 |
| H2 | `android/app/src/main/AndroidManifest.xml` | Permissions: camera, storage, internet | H1 |
| H3 | `src/lib/native/camera-android.ts` | Android-specific camera handling if needed | G3 |
| H4 | `android/app/src/main/res/values/strings.xml` | App name, permission rationale strings | H1 |
| H5 | `android/app/src/main/res/values/styles.xml` | Theme, splash screen, status bar | H1 |
| H6 | `.github/workflows/android-build.yml` | CI: Android APK build on PR | H1, F5 |

**Checkpoint: `git commit -m "H: Capacitor Android shell"`**
**Verify: `npx cap sync android`, Android Studio builds, camera works on emulator**

### Phase I: Cross-Platform Polish (Tasks 55-60)

| # | File | Description | Depends on |
|---|---|---|---|
| I1 | `src/components/ui/PlatformLayout.tsx` | Responsive layout: safe areas, nav bar, tab bar | G6 |
| I2 | `src/lib/native/offline-sync.ts` | Queue photos when offline, sync when back online | G4 |
| I3 | `src/lib/native/deep-links.ts` | Handle tenu.world deep links on mobile | G1 |
| I4 | `src/app/settings/page.tsx` | User settings: language, notification prefs | B6, C1 |
| I5 | `src/components/ui/RTLWrapper.tsx` | RTL layout wrapper for Arabic, Urdu, Hebrew | B1 |
| I6 | `src/lib/brevo/follow-up.ts` | 14-day outcome email trigger (replaces Make.com) | C2, A5 |

**Checkpoint: `git commit -m "I: cross-platform polish"`**
**Verify: same flow works on web, iOS simulator, Android emulator with RTL**

---

**Total: 60 atomic tasks across 9 phases. Each task = one file = one commit.**

---

## 5. CEO Goals

See: `docs/03-CEO-Goals.md`

---

## 6. CTO Goals

See: `docs/04-CTO-Goals.md`

---

## 7. Escalation Protocol

### Level 1: Agent self-recovery
Agent encounters error → retries once → if still failing, marks issue as BLOCKED with error details in comment.

### Level 2: CTO intervention
CTO heartbeat checks dev agent statuses every cycle. If any agent is BLOCKED or ERROR:
- Read the agent's last issue comment for error details
- If it's a fixable config issue (timeout, API key), update and retrigger
- If it's a code issue, re-assign the task with more specific instructions
- If the agent has failed 3 times on the same task, escalate to CEO

### Level 3: CEO intervention
CEO heartbeat finds CTO reporting repeated failures:
- Pause the failing agent
- Create incident issue with full context
- Flag for human (Dr Mubashir) review
- Optionally reassign work to a different agent or mark for manual execution

### Cost circuit breaker
If any single run exceeds $5, Paperclip should terminate it. Configure: `budgetMaxPerRunCents: 500` in adapter config.

---

## 8. Success Criteria

| Milestone | Definition | Target Date |
|---|---|---|
| Skeleton live | Phases A+B complete, build passing, i18n working | April 16 |
| Auth working | Phase C complete, users can sign up/in | April 17 |
| Camera flow | Phase D complete, photos capture and upload | April 19 |
| AI scan | Phase E complete, risk report generates | April 21 |
| Web deployed | Phase F complete, full flow on Vercel | April 23 |
| iOS build | Phase G complete, Xcode builds, camera works | April 25 |
| Android build | Phase H complete, Android Studio builds | April 27 |
| Cross-platform | Phase I complete, offline + RTL + deep links | April 28 |
| Beta launch | 10 users testing on web + mobile | April 30 |

---

*Global Apex NET — Tenu.World Agent System*
