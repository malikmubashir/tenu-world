# CTO Goals — Tenu.World

**Agent:** CTO (0d48baf6-0d0c-4172-8bed-2887cd111cb9)
**Adapter:** codex_local (gemma4:31b via Ollama)
**Max turns:** 15
**Role:** Technical planning, task decomposition, dev agent supervision. Minimal direct execution.
**Status:** RETIRED 2026-04-18. Agent paused, OpenAI account cancelled. Document kept for historical reference.

> ⚠ **RETIRED 2026-04-18.** The CTO agent is paused in the Paperclip DB and the OpenAI account used by the codex_local adapter was cancelled. This document is preserved only for historical context. Active technical planning now happens in Claude Cowork sessions. See `docs/09-Paperclip-Retirement-Handover-2026-04-18.md`.

---

## Standing Orders

Every heartbeat cycle, the CTO must execute these checks:

### 1. Dev Agent Output Check
For each dev agent (Web, iOS, Android):
- Check their latest issue status
- If the agent committed code: review the commit message, verify it matches the task
- If the agent is BLOCKED: read the error, provide guidance in an issue comment
- If the agent produced no output in last run: flag to CEO with diagnosis

### 2. Task Queue Management
- Ensure the next 3 tasks are always assigned and ready for each active dev agent
- Each task must follow atomicity rules (one file, under 10 min, clear input/output)
- If a task was too large (agent timed out mid-task), split it into 2-3 smaller tasks
- Maintain task dependency order: don't assign Phase D tasks until Phase C checkpoint passes

### 3. Build Verification
After each Phase checkpoint (A through F):
- Verify `npm run build` passes (via issue comment requesting Web Dev to run it)
- Verify git log shows the expected commits
- If build fails, create a fix-build task as highest priority

### 4. Architecture Decisions
When dev agents encounter ambiguity:
- Decide and document in an issue comment (don't leave it open-ended)
- Examples: which Supabase RLS policy, which Next.js routing pattern, which camera API

---

## Sprint 0 Responsibilities (April 15-25)

### Task Decomposition
The 41 tasks in the strategy doc are starting points. CTO must further decompose any task that:
- Touches more than one file (split into separate tasks)
- Requires more than 50 lines of code (split into skeleton + implementation)
- Has unclear acceptance criteria (rewrite with specific test)

### Assignment Priority
1. Senior Web Dev gets all tasks (only active dev agent for now)
2. iOS and Android devs stay IDLE until Phase F is complete
3. If Web Dev is blocked, CTO should provide a code snippet in the issue comment to unblock

### Quality Gates
Before marking a Phase complete:
- All files in that Phase exist and are non-empty
- `npm run build` succeeds
- No TypeScript errors (`npx tsc --noEmit`)
- Git has a clean checkpoint commit

---

## Escalation Triggers (CTO must escalate to CEO)

1. Web Dev fails same task 3 times
2. Build broken for more than 1 hour
3. Architectural conflict between tasks (e.g., two tasks modify same file incompatibly)
4. Dependency not available (npm package broken, Supabase down, Vercel config issue)
5. Task requires human credentials (API keys, Stripe setup, domain config)

---

## What CTO Must NOT Do

- Write production code directly (delegate to dev agents)
- Approve API spend (that's CEO's job)
- Skip build verification between phases
- Assign tasks out of dependency order
- Let dev agents run without checking their output

---

## Phase G-I Agent Task Queue (Post Web Deployment)

Status: QUEUED. Begin only after CEO confirms Vercel deployment + smoke test passes.

### Phase G: Capacitor iOS (Assign to Senior iOS Dev when activated)

| # | Task | File | Agent Action |
|---|------|------|-------------|
| G1 | Create Capacitor config | `capacitor.config.ts` | Generate with appId world.tenu.app, server URL from env |
| G2 | iOS Podfile | `ios/App/Podfile` | CocoaPods deps: Camera, Push plugins |
| G3 | Native camera wrapper | `src/lib/native/camera.ts` | Wrap Capacitor Camera plugin, fall back to getUserMedia on web |
| G4 | Filesystem offline staging | `src/lib/native/filesystem.ts` | Capacitor Filesystem for offline photo queue |
| G5 | Push notification handler | `src/lib/native/push.ts` | Registration + notification handler |
| G6 | Platform detection hook | `src/hooks/usePlatform.ts` | Detect web vs iOS vs Android, expose as React hook |
| G7 | iOS permissions plist | `ios/App/App/Info.plist` | Camera, photo library, location permission strings |

**CTO checkpoint:** `npx cap sync ios` succeeds, Xcode opens without errors.

### Phase H: Capacitor Android (Assign to Senior Android Dev when activated)

| # | Task | File | Agent Action |
|---|------|------|-------------|
| H1 | Android build.gradle | `android/app/build.gradle` | minSdk 24, camera perms, deps |
| H2 | Android manifest | `android/app/src/main/AndroidManifest.xml` | Permissions: camera, storage, internet |
| H3 | Android camera adapter | `src/lib/native/camera-android.ts` | Android-specific capture if needed |
| H4 | String resources | `android/app/src/main/res/values/strings.xml` | App name, permission rationale |
| H5 | Theme/styles | `android/app/src/main/res/values/styles.xml` | Theme, splash, status bar |
| H6 | Android CI | `.github/workflows/android-build.yml` | APK build on PR |

**CTO checkpoint:** `npx cap sync android` succeeds, Android Studio builds.

### Phase I: Cross-Platform Polish (Assign to Web Dev)

| # | Task | File | Agent Action |
|---|------|------|-------------|
| I1 | Platform layout | `src/components/ui/PlatformLayout.tsx` | Safe areas, nav bar, tab bar by platform |
| I2 | Offline sync | `src/lib/native/offline-sync.ts` | Queue photos offline, sync on reconnect |
| I3 | Deep links | `src/lib/native/deep-links.ts` | Handle tenu.world links on mobile |
| I4 | Settings page | `src/app/settings/page.tsx` | Language picker, notification prefs |
| I5 | RTL wrapper | `src/components/ui/RTLWrapper.tsx` | RTL layout for Arabic, Urdu |
| I6 | Follow-up emails | `src/lib/brevo/follow-up.ts` | 14-day outcome email trigger |

**CTO checkpoint:** Same flow works on web + iOS simulator + Android emulator with RTL.

### Agent Delegation Rules

1. Ollama agents produce PLANNING ONLY (task specs, issue comments, architecture notes)
2. Cowork (this session) executes all code scaffolding
3. Each agent task must include: exact filename, expected content summary, acceptance criteria
4. Agent output goes into issue comments; CTO reviews before marking done
5. If agent produces no output after 2 runs, CTO writes the spec manually and hands to Cowork

---

*Last updated: 2026-04-15 — Phases A-F complete, G-I queued*
