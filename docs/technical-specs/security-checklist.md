# Security Checklist — Tenu.World

**Owner:** Dr Mubashir
**Status:** LAUNCH GATE — every box must be ticked before first paying user
**Last updated:** 2026-04-17
**Next review:** before first paid user, then quarterly

---

## 0. How this document is used

Three states per item: `[ ]` open, `[~]` in progress, `[x]` done and verified. "Verified" means someone other than the person who ticked the box has confirmed it, or there is a scripted test that exercises the control. Self-ticking without evidence defeats the point of the list.

Launch gate rule: no soft launch until every P0 item is `[x]`. P1 items can go live as `[~]` with a named owner and a dated target. P2 items are hygiene, tracked but non-blocking.

---

## 1. Authentication and access control

### P0
- [ ] Supabase Auth configured with magic-link only. Password endpoints disabled in `auth.config`.
- [ ] Magic-link expiry set to 15 minutes. Default is 1 hour — tighten before launch.
- [ ] Rate limit on `/auth/magic-link` request endpoint: 5 per email per hour, 20 per IP per hour.
- [ ] Service role key present only in Vercel environment (`SUPABASE_SERVICE_ROLE_KEY`). Never in client bundle. Verify with `grep -r "SUPABASE_SERVICE" app/src/app/[locale]` returning zero results.
- [ ] Anon key used client-side is scoped through RLS. No table has `anon` role granted write permission without RLS matching `auth.uid()`.
- [ ] Admin account (Dr Mubashir) uses a separate email from `support@tenu.world`. Admin bit is a boolean column + RLS policy, not role-based.

### P1
- [ ] 2FA on Supabase, Vercel, Cloudflare, Stripe, Brevo, Anthropic, GitHub, Namecheap — all with hardware key or TOTP, no SMS.
- [ ] Recovery codes for each of the above stored in a KeePassXC database with a passphrase the size of a sonnet.
- [ ] `support@tenu.world` is a distribution list, not a shared mailbox, with audit on membership changes.

### P2
- [ ] Session idle timeout configured at 24h, rolling. Absolute timeout at 30 days.
- [ ] Device fingerprint tracking for anomaly detection. Not privacy-free — revisit after legal review of a working policy.

---

## 2. Supabase Row-Level Security (RLS)

### P0 — every table in `public` has RLS enabled and explicit policies
- [ ] `inspections`: SELECT/INSERT/UPDATE where `user_id = auth.uid()`. No DELETE policy = deletion forbidden at app layer, only via service role for GDPR erasure.
- [ ] `rooms`: same owner check joined through `inspections`.
- [ ] `photos`: same, plus enforce `size_bytes < 8_000_000` at insert time via trigger.
- [ ] `risk_scans`: read-only to owner, INSERT allowed only from service role.
- [ ] `dispute_letters`: same as risk_scans.
- [ ] `payments`: read-only to owner. INSERT only from service role (Stripe webhook).
- [ ] `consents`: read-only to owner, INSERT on own `user_id`, UPDATE for revocation only, NO DELETE policy.
- [ ] `audit_log`: INSERT via service role only, SELECT restricted to admin.

Verification script: `tests/security/rls-matrix.ts` hits each table as anon, as a random user, as the owner, and as service role — 32 assertions total.

### P1
- [ ] Function `public.ensure_row_ownership()` reused across policies to avoid copy-paste drift.
- [ ] All RLS policies covered by at least one pg_prove test in CI.

---

## 3. API routes and server-side boundaries

### P0
- [ ] Every `/api/*` route validates input with `zod` before touching the DB or the model.
- [ ] Every route checks `auth.getUser()` and rejects 401 on anonymous access where required.
- [ ] Anthropic API key (`ANTHROPIC_API_KEY`) read from env on cold start only. Never passed to a client component. Verify: `grep -r "ANTHROPIC_API_KEY" app/src/app/[locale]` returns zero.
- [ ] Stripe secret key same rule, verified same way.
- [ ] Brevo API key same rule.
- [ ] CSP header set via `next.config.ts`: `default-src 'self'; img-src 'self' https://*.r2.cloudflarestorage.com data:; script-src 'self' https://js.stripe.com; connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.r2.cloudflarestorage.com; frame-src https://js.stripe.com`.
- [ ] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- [ ] `X-Frame-Options: DENY` (clickjacking on checkout).
- [ ] `X-Content-Type-Options: nosniff`.
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")`.

### P1
- [ ] Rate limit on `/api/risk-scan`: 5 per user per hour, 20 per IP per hour. Implement with Upstash Redis or Supabase `rate_limits` table.
- [ ] Rate limit on `/api/dispute-letter`: 3 per user per hour.
- [ ] Rate limit on `/api/upload`: 100 per user per hour.
- [ ] CSRF token on every state-changing route. Next.js App Router covers this partially via same-origin checks — document the gap explicitly.

---

## 4. Photo upload and R2 storage

### P0
- [ ] R2 bucket configured with `Location Hint = EU` and `Jurisdiction = EU`. Screenshot archived in `docs/dpa-archive/`.
- [ ] Pre-signed upload URLs generated server-side only, valid for 5 minutes.
- [ ] Server-side MIME sniffing (`file-type` npm package) after upload, before DB write. JPEG, PNG, HEIC only. Reject everything else including SVG and PDF masquerading as images.
- [ ] Magic-byte check matches claimed MIME type.
- [ ] Image processing via `sharp` strips EXIF metadata before serving. Original with EXIF kept 24h only for scan input, then replaced by stripped copy.
- [ ] Bucket is private, no public read. Access via signed URLs with 1-hour TTL.

### P1
- [ ] Virus scan via ClamAV or Cloudflare WAF rules on every upload. Not a Tenu-specific threat, but insurers will ask.
- [ ] SSRF protection: the route handler never fetches user-supplied URLs.

---

## 5. AI model safety

### P0
- [ ] `ANTHROPIC_API_KEY` is org-scoped, not workspace-scoped. Training opt-out is set at org level.
- [ ] Every Anthropic call logs: `inspection_id`, `model`, `input_tokens`, `output_tokens`, `total_cost_eur`, `attempt_count`, `prompt_version`.
- [ ] Zod validation on every model output. Retry policy per `prompt-spec-scan-v2.md` section 6 and `prompt-spec-dispute-v2.md` section 8.
- [ ] Per-scan cost hard cap: EUR 0.12. Per-letter cost hard cap: EUR 0.50. Exceeding returns HTTP 402 without charging user.
- [ ] Monthly burn alert via Anthropic usage webhook → Brevo email at 50%, 80%, 100% of monthly budget.

### P1
- [ ] Red-team suite for prompt injection runs nightly in CI. Twenty cases. Any failure blocks deploy.
- [ ] Human-readable logs of first 100 production scans. Dr Mubashir reviews personally for output drift.

---

## 6. Payments and Stripe

### P0
- [ ] Stripe account registered under Stripe Technology Europe Ltd (Dublin). Dashboard screenshot archived.
- [ ] Webhook endpoint signature verification using `stripe.webhooks.constructEvent`. No handler runs without signature pass.
- [ ] Idempotency: Stripe `event.id` stored in `payments.stripe_event_id` with unique index. Duplicate webhook ignored.
- [ ] Never store card numbers, CVV, or full PAN. Stripe Elements / Checkout only.
- [ ] Price IDs hardcoded in an env var, not passed from client.
- [ ] Server verifies the price returned by Stripe matches the product in session, after checkout completion. Defends against client-side price tampering.
- [ ] Refund workflow implemented per `refund-fr.md` Case A/B. Case C returns HTTP 409.

### P1
- [ ] Chargeback alert pipeline: Stripe dispute webhook → Slack/email → 48h response SLA.
- [ ] Monthly Stripe reconciliation script reconciles DB `payments` against Stripe transfers.

---

## 7. Secrets management

### P0
- [ ] All secrets in Vercel Environment Variables, scoped per environment (preview, production).
- [ ] `.env.local` present locally, `.env` and `.env.*` in `.gitignore`. Verify: `git check-ignore .env`.
- [ ] Pre-commit hook runs `gitleaks` on staged files. One line in `lefthook.yml`.
- [ ] GitHub secret scanning + push protection enabled on the `tenu-world` repo.
- [ ] No secret in CI logs. Vercel masks by default — verify once by inspecting a deployment log.

### P1
- [ ] Quarterly key rotation: Anthropic, Stripe, Brevo, Supabase service role. Calendar reminder.
- [ ] Break-glass procedure documented: how to rotate all keys within 30 minutes in case of suspected compromise.

---

## 8. Data residency and sub-processors

### P0
- [ ] Supabase project in `eu-central-1` (Frankfurt). Settings → General → Region screenshot.
- [ ] Cloudflare R2 bucket Jurisdiction = EU, Location Hint = EU. Screenshot.
- [ ] Vercel Project Region = `cdg1` (Paris). Functions → Region screenshot.
- [ ] Stripe account legal entity = Stripe Technology Europe Ltd (Dublin). Settings → Legal entity screenshot.
- [ ] Brevo account EU data residency confirmed. Ask support@brevo.com in writing, keep reply.
- [ ] Anthropic SCC module 2 signed. Archive PDF in `docs/dpa-archive/`.
- [ ] Privacy policy (FR + EN) published at `/fr/confidentialite` and `/en/privacy` reflecting exact current sub-processor list.

### P1
- [ ] Quarterly sub-processor list review. Any change triggers a 30-day notice to users per privacy policy section 6.

---

## 9. Logging and monitoring

### P0
- [ ] Structured logs via Vercel native logging. No `console.log(user.email)` anywhere — use `user.id` or `hashed(user.id)`.
- [ ] No photo bytes in logs. No prompt contents in logs. Only metadata.
- [ ] PII scrub function runs on error objects before they reach Sentry (if used) or the console.
- [ ] 30-day log retention. After 30 days, logs redacted to aggregate-only.

### P1
- [ ] Sentry (or equivalent) wired with DSN in env. PII disabled in SDK config.
- [ ] Uptime monitoring on `tenu.world/api/health` every 1 minute, page if down for 3+ minutes.

---

## 10. GDPR operational controls

### P0
- [ ] Subject access request (SAR) handled via `/api/privacy/export` — delivers ZIP of inspections, photos, payments, consents within 10 days.
- [ ] Erasure request handled via `/api/privacy/delete` — anonymises `user_id`, nulls PII columns, retains invoices for 10 years per L123-22. Automated log with actor, timestamp, request reference.
- [ ] Consents table active, every sensitive UX touchpoint writes a row. Per `legal-surface-spec.md` section 4.
- [ ] Breach notification playbook: 72h to CNIL, documented in `docs/security/breach-playbook.md` (to write before launch).
- [ ] Data retention cron jobs running: photos deleted at 14 months, reports archived at 24 months, inspections purged after 24 months per privacy section 4.

### P1
- [ ] `ropa.md` (Register of Processing Activities) maintained per Art. 30 RGPD. Required even for small SAS above 250 employees — we are not, but keep it anyway. It will be asked at insurer due diligence.

---

## 11. Frontend hardening

### P0
- [ ] Subresource Integrity (SRI) on any third-party script tag. Only Stripe is loaded cross-origin; SRI present.
- [ ] No `dangerouslySetInnerHTML` on user content anywhere.
- [ ] No `eval`, no `new Function`, no dynamic imports from user input.
- [ ] Tailwind content purge covers all MDX, TS, TSX paths. No unused utility classes shipping CSS bloat that reveals feature flags.

### P1
- [ ] Bundle analyser run on each release. Flag regression if bundle grows > 15%.

---

## 12. Incident response

### P0
- [ ] `SECURITY.md` in repo root with `security@tenu.world` contact and 72h acknowledgement SLA.
- [ ] Incident response plan documented at `docs/security/ir-plan.md`: detection, triage, containment, eradication, recovery, lessons learned.
- [ ] On-call rotation of size 1 (Dr Mubashir) is acceptable at current scale but noted as single-point-of-failure risk.

### P1
- [ ] Tabletop exercise once per quarter. First one scheduled 2026-07-15.
- [ ] Supabase PITR (Point-In-Time Recovery) enabled. Test restoration once before launch.

---

## 13. Supply chain

### P0
- [ ] Dependabot enabled on GitHub with weekly schedule.
- [ ] `npm audit` runs in CI, fails the build on high/critical.
- [ ] Lockfile committed (`package-lock.json`), no `^` drift without review.

### P1
- [ ] SBOM generated per release via `cyclonedx-npm` and archived.
- [ ] Snyk or Socket.dev scan on PRs touching `package.json`.

---

## 14. Pre-launch walkthrough

### Launch day must be `[x]` on every P0 item. Three-person walkthrough:
- [ ] Dr Mubashir
- [ ] One independent outside reviewer with InfoSec or IT background, sourced outside Dr Mubashir's board commitments to avoid conflicts of interest
- [ ] One automated scan: OWASP ZAP baseline scan against staging, clean report archived

### Post-launch rhythm:
- [ ] Weekly: review rate limiter logs, failed auth attempts, cost anomalies for scan/letter
- [ ] Monthly: review access logs, Supabase RLS test suite passes, consent record growth
- [ ] Quarterly: rotate keys, tabletop incident exercise, sub-processor list review, update this document

---

## 15. Known gaps accepted at launch

Listed so nobody pretends otherwise:

1. No SOC 2 certification. Not needed at our scale, would cost 20-40k EUR for a Type I and serve nobody. Revisit when first B2B customer (landlord association white label) asks.
2. No external pentest. Budget not available. First pentest scheduled end of Q3 2026 if user count > 500.
3. No WAF beyond Cloudflare defaults. Acceptable — DDoS is not a realistic threat at 50-user scale, and Cloudflare's default protection covers 95% of the attack surface.
4. Single engineer. Dr Mubashir is sole maintainer. Bus factor = 1. Mitigation: every decision documented in `docs/`, all infra in IaC or declarative config.
5. No bug bounty program. Responsible disclosure via `security@tenu.world`. Formal bounty opens after profitability.

---

## 16. Change log

| Date | Change |
|---|---|
| 2026-04-17 | Initial checklist, 16 sections, launch gate defined at P0 completion |
