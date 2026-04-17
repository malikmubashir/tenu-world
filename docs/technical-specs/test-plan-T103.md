# Test Plan — T-103 End-to-End Paid Scan Flow

**File:** `test-plan-T103.md`
**Owner:** Dr Mubashir
**Status:** DRAFT v1 awaiting first dry run
**Last updated:** 2026-04-17
**Scope:** T-103 — complete paid risk-scan journey, from anonymous landing to delivered PDF report
**Out of scope:** T-104 (dispute letter add-on), T-105 (14-day follow-up survey), T-106 (refund). Covered in sibling test plans.

---

## 1. Why T-103 specifically

T-103 is the one flow that absolutely must work on launch day. Every paying user runs through it. Every broken step in T-103 is a revenue hole and a refund request. The dispute letter is optional, the follow-up is async, the refund is reactive. T-103 is the hot path.

The test plan here exists because Dr Mubashir will not run a manual smoke test at 02:00 the night a bug breaks checkout. The suite must run in CI and in staging, and produce a green tick before every deploy to production.

---

## 2. User journey under test

```
  1. Anonymous visit to tenu.world/fr
  2. Read landing page, click "Analyser mon depot"
  3. Enter email, receive magic link, click through
  4. Account created, onboarding flow (jurisdiction, language, property address)
  5. Inspection created, room-by-room photo capture flow
  6. Upload 8-15 photos total (4-5 rooms x 2-3 photos)
  7. Review screen, confirm
  8. Checkout page: price 15 EUR, L221-28 double-consent waiver tick boxes
  9. Stripe Elements or Stripe Checkout, successful test card
 10. Payment webhook received, risk scan kicked off
 11. PDF report generated within 180 seconds
 12. Email sent via Brevo with signed R2 download link
 13. In-app report view renders the same data
 14. User logs out, logs back in, report still visible 24h later
```

Every numbered step has at least one assertion. Total: 28 critical assertions.

---

## 3. Test environments

| Environment | Purpose | Data |
|---|---|---|
| Local dev | Developer fast loop | Supabase local, Stripe test mode, mocked Anthropic responses |
| Staging (Vercel preview) | Pre-prod E2E | Staging Supabase project, Stripe test, real Anthropic (Haiku only, low budget ceiling) |
| Production | Canary smoke only | Dr Mubashir's admin account, one real inspection per week, real money with self-refund |

No third-party mocks in staging except where explicitly noted. The point of staging is to catch integration drift before it hits users.

---

## 4. Test fixtures

Stored at `tests/e2e/fixtures/`:

- `photos/room-A-clean/` — 3 photos of a clean room, baseline: no deductions
- `photos/room-B-wear/` — 3 photos showing normal wear and tear (faded paint, worn carpet), baseline: deductions with coefficient_residuel < 0.5
- `photos/room-C-damage/` — 3 photos showing clear damage (broken tile, hole in plaster), baseline: deductions with coefficient_residuel near 1.0
- `photos/room-D-ambiguous/` — 3 photos with medium quality, baseline: model flags `confidence: "low"` on at least one observation
- `photos/room-E-blurry/` — 3 photos all blurry, baseline: scan returns `quality_flag: "insufficient_evidence"`

Each room folder has a `ground_truth.json` describing the expected output shape. Evals compare output to ground truth on a tolerance-based scoring rubric, not exact match (models drift).

---

## 5. Test taxonomy

| ID prefix | Layer | Tool | Runs on |
|---|---|---|---|
| T-103-U-* | Unit | Vitest | Every PR |
| T-103-I-* | Integration | Vitest + Supabase local | Every PR |
| T-103-E-* | End-to-end UI | Playwright | Every merge to `main`, nightly on staging |
| T-103-S-* | Synthetic/canary | Playwright against production | Every 15 min, 24/7 |
| T-103-P-* | Performance | k6 or Playwright + lighthouse | Weekly |
| T-103-EV-* | Eval (model output quality) | Node script + expert rubric | On prompt spec version bumps |

---

## 6. Unit and integration cases

### T-103-U-001: Zod schemas reject invalid inputs
- Given an `InspectionInput` missing `jurisdiction`
- When `POST /api/inspections` is called
- Then response is 400 with `INVALID_INPUT` code

### T-103-U-002: RLS prevents cross-user reads
- Given user A has an inspection
- When user B authenticates and queries `inspections` with A's id
- Then Supabase returns an empty array (not 403 — RLS silently filters)

### T-103-U-003: Photo MIME sniffing rejects spoofed PDF
- Given a file named `photo.jpg` with PDF magic bytes
- When uploaded via pre-signed URL
- Then server-side validation rejects with `INVALID_FILE_TYPE`

### T-103-U-004: Price ID tampering is caught
- Given the client submits a Stripe session with a price ID for the 1 EUR test product
- When the server receives the webhook
- Then the price is cross-checked with the inspection and the mismatch is rejected

### T-103-I-001: Magic link expires at 15 minutes
- Given a user requests a magic link at T
- When the user clicks the link at T+16 minutes
- Then the auth endpoint returns 401 with `AUTH_LINK_EXPIRED`

### T-103-I-002: Idempotent webhook handling
- Given Stripe delivers the same `checkout.session.completed` event twice
- When the second delivery arrives
- Then the handler returns 200 without creating a duplicate scan

### T-103-I-003: Rate limit on /api/risk-scan
- Given user X has triggered 5 scans in the last hour
- When user X triggers a 6th scan
- Then response is 429 with retry-after header

### T-103-I-004: Anthropic quota exceeded returns 402, not 500
- Given the monthly Anthropic budget is at 100%
- When /api/risk-scan is called
- Then the kill switch returns 402 `BUDGET_EXCEEDED` and the user is not charged

Total unit+integration: 24 cases. Full list in `tests/unit/risk-scan-flow.test.ts` and `tests/integration/`.

---

## 7. End-to-end Playwright cases

### T-103-E-001: Happy path FR, 5 rooms clean
- Locale `/fr`, language FR, jurisdiction FR
- Upload 5 rooms x 3 photos from `photos/room-A-clean/` rotated
- Pay with Stripe test card `4242 4242 4242 4242`
- Assert: report PDF downloaded within 180s, `total_deduction_eur` < 50, `refundable_eur` = deposit - total
- Assert: `consents` table has 4 rows for this user (`cookie_essential`, `privacy_policy`, `terms_of_service`, `photo_processing`, `refund_policy`, `withdrawal_waiver`)

### T-103-E-002: Happy path EN, 4 rooms mixed wear
- Locale `/en`, jurisdiction UK, currency GBP
- Upload mix of rooms A, B, C
- Pay with Stripe test card, UK address
- Assert: report generated in EN, GBP amounts, UK disclaimer block
- Assert: webhook returned 200, payment row created

### T-103-E-003: Abandoned at payment, no charge
- Run flow through step 8, close browser at Stripe Elements
- Assert: inspection row exists with `status: "awaiting_payment"`, no `risk_scans` row

### T-103-E-004: Stripe card declined
- Card `4000 0000 0000 0002` (always declines)
- Assert: user sees decline message, no scan triggered, no photo deleted from R2

### T-103-E-005: Insufficient evidence — all blurry
- Upload room E x 4 (all blurry)
- Pay
- Assert: report PDF is generated but flagged `quality_flag: "insufficient_evidence"`, no deductions computed, user sees a banner in the report explaining

### T-103-E-006: L221-28 waiver untick blocks checkout
- Proceed to checkout, do not tick both boxes
- Assert: "Pay" button remains disabled, tooltip explains why

### T-103-E-007: Session resumption after logout
- Complete flow through step 10 (payment success)
- Log out immediately
- Log back in from a different browser session after 60 seconds
- Assert: inspection is visible with `status: "processing"` or `"ready"`

### T-103-E-008: RTL layout (AR locale)
- Locale `/ar`, jurisdiction FR (legal output still FR)
- Run happy path
- Assert: UI flips RTL, no layout breakage, legal PDF is in FR (per language policy)
- Assert: email from Brevo in AR

### T-103-E-009: Mobile viewport (Capacitor webview simulator)
- 390x844 viewport (iPhone 14), upload 3 photos via file input (simulated camera)
- Assert: flow completes, PDF downloads

### T-103-E-010: Slow network (3G throttle)
- Throttle to 400 kbps down
- Run flow
- Assert: uploads succeed with retry, no duplicate inserts, total wall-clock under 8 minutes

Total end-to-end: 10 cases. Runtime budget: 15 minutes nightly on staging.

---

## 8. Synthetic canaries (production)

Run every 15 minutes, 24/7, from a GitHub Action or a Vercel Cron. Hit the `/api/health` endpoint (existence alone), then a read-only query via a dedicated canary account.

- T-103-S-001: `/api/health` returns 200
- T-103-S-002: Magic link issuance for `canary+XXXX@tenu.world` returns 200
- T-103-S-003: Supabase connection via service role returns a `select 1`
- T-103-S-004: R2 bucket HEAD request returns 200
- T-103-S-005: Anthropic API reachability ping

Three consecutive failures pages Dr Mubashir via Brevo-to-SMS gateway or Discord webhook.

---

## 9. Performance budgets

Measured on staging, p95 unless noted:

| Metric | Budget | Tool |
|---|---|---|
| TTFB on /fr landing | < 400 ms | Lighthouse |
| Largest Contentful Paint on /fr landing | < 2.5 s | Lighthouse |
| Scan time from payment webhook to PDF email | < 180 s | Custom timer logged to Supabase |
| Upload latency per 2 MB photo | < 3 s | Playwright timing |
| Bundle size (first-load JS, /fr landing) | < 150 KB gzipped | Next build stats |

Regression policy: any budget miss by > 15% blocks the merge. Under 15% is a yellow flag logged in the weekly review.

---

## 10. Eval cases for model output quality

Twenty golden cases at `tests/eval/risk-scan/`. Each case is a JSON file with the inputs (photos referenced by path) and the expected output shape (ranges, not exact values). Expert rubric scoring, 0-5:

- Schema validity: pass/fail
- Deduction accuracy: within 20% of expert-set figure
- Confidence calibration: did the model correctly flag low-confidence cases
- Tone: neutral, factual, no legal advice creep
- Grille code accuracy: right code chosen for the observed element

Acceptance gate for prompt version promotion:
- Zero schema failures
- Mean score ≥ 4.0
- No case below 3.0

Expert reviewer: Dr Mubashir for v2. Second reviewer recruited before v3.

---

## 11. Failure mode matrix

What should happen when each external dependency goes down:

| Dependency | Failure behaviour | User-facing message |
|---|---|---|
| Supabase | Graceful 503, retry banner | "Notre service rencontre une indisponibilite temporaire. Reessayez dans 2 minutes." |
| Cloudflare R2 | Upload fails with retry (3 attempts, exp backoff) | Per-photo retry button |
| Stripe | Checkout fails, no charge, inspection retained | "Paiement indisponible, reessayez dans quelques minutes" |
| Anthropic | Scan queued with retry after 5 min, user emailed if > 30 min | "Votre rapport est en cours, delai allonge, vous recevrez un email" |
| Brevo | Report still generated, email send retried for 24h, in-app notification | "Rapport pret dans votre compte" |
| Vercel | Cloudflare status page pinned, no user action possible | Maintenance page served by Cloudflare Worker |

Every failure mode must produce:
- A structured log entry with the incident id
- An in-app notification where possible
- No charge if the scan did not complete

---

## 12. CI integration

`.github/workflows/ci.yml` targets:

```yaml
- name: Unit tests
  run: npm run test:unit
- name: Integration tests
  run: npm run test:integration  # spins up Supabase local
- name: Build
  run: npm run build
- name: E2E (staging)
  if: github.ref == 'refs/heads/main'
  run: npm run test:e2e -- --base-url $STAGING_URL
- name: Eval suite
  if: contains(github.event.pull_request.labels.*.name, 'prompt-change')
  run: npm run test:eval
```

Eval suite is opt-in via label because it costs real Anthropic budget. Target cost per full eval run: < EUR 2.

---

## 13. Pre-launch test matrix — must all be green before first paying user

- [ ] 24 unit/integration tests passing
- [ ] 10 E2E tests passing on staging
- [ ] 5 canaries passing on production for 48 consecutive hours
- [ ] Performance budgets met on staging
- [ ] Eval suite mean ≥ 4.0 on prompt spec v2.0.0
- [ ] OWASP ZAP baseline clean on staging
- [ ] Manual UX walkthrough by Dr Mubashir on iOS (Capacitor build) and on desktop Safari / Chrome / Firefox

---

## 14. Open items

`[TO VERIFY]`

1. Playwright against Capacitor: there is no clean Playwright runner for a Capacitor webview. Plan: use Playwright against the mobile web PWA build (which Capacitor wraps unchanged) and accept that native plugin branches are tested by manual device testing only.
2. Synthetic canary account cost: 96 logins per day, 0 scans. Supabase free tier covers this but monitor.
3. Brevo-to-SMS gateway not configured yet. Interim: Discord webhook alerts on Dr Mubashir's personal server.
4. No load test yet. Small scale, but a k6 script hitting 100 concurrent scans should be built before any launch announcement to avoid the HN hug-of-death scenario.

---

## 15. Change log

| Date | Change |
|---|---|
| 2026-04-17 | Initial test plan, 24 unit+integration cases, 10 E2E, 5 canaries, 20 evals, pre-launch gate defined |
