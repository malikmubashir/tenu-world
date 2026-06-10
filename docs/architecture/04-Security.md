# 04 — Security & RGPD Posture

Status: verified against `main` @ `2697e1e` (2026-06-10).
Scope: auth model, middleware allow-list, RLS posture (migrations 001–007), secrets handling, server-only AI rule, RGPD retention posture, known gaps.

---

## 1. Auth model

- **Supabase Auth, magic link (email OTP) + Google OAuth (PKCE).** No password flow exists anywhere in the codebase; the Supabase `auth_leaked_password_protection` lint is intentionally unaddressed for this reason (`migrations/007` footer).
- Web sessions are cookie-based via `@supabase/ssr` (`src/lib/supabase/server.ts` / `client.ts`).
- Mobile (Capacitor) sends `Authorization: Bearer <access_token>` because cookies do not cross the native-shell/origin boundary; `/api/mobile/*` handlers hydrate the session from the bearer token before `getUser()`.
- Sign-out is a Server Action (CSRF-safe via Next's signed action IDs).
- Every API route handler re-authenticates with `supabase.auth.getUser()` and re-verifies resource ownership (`inspection.user_id !== user.id → 404`) — defence in depth on top of RLS.

### Three Supabase client tiers

| Client | File | Key | RLS |
|---|---|---|---|
| Browser | `src/lib/supabase/client.ts` | anon (public) | enforced |
| Server (cookie/bearer scoped) | `src/lib/supabase/server.ts` | anon + user JWT | enforced as the user |
| Admin | `src/lib/supabase/admin.ts` | `SUPABASE_SERVICE_ROLE_KEY` | **bypassed** |

The admin client is `server-only` (build-fails if a client bundle imports it) and is used exactly where no user session can exist: the Stripe webhook, email notification profile lookups, push-token reads, and `auth.admin.deleteUser`. The module docstring records the incident that motivated this discipline (consents writes silently denied by RLS for two weeks in April 2026).

## 2. Middleware and the public-path allow-list

`src/middleware.ts` runs on every request except static assets and redirects unauthenticated users to `/auth/login?redirect=<path>`. Public prefixes:

```
/  /pricing  /legal  /stories  /features  /inspection
/auth/login  /auth/callback  /auth/accept-terms
/api/webhooks  /api/webhook  /api/consents  /.well-known
```

Observations grounded in the code:
- `/inspection` being public means the inspection **pages** render without an edge auth check; every data access on them still goes through RLS or authenticated API routes, so unauthenticated visitors see empty shells, not data. It does widen the unauthenticated surface, though.
- `/api/consents` is allow-listed but its handlers return 401 without a session — the allow-list only skips the redirect, not route-level auth.
- If `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` are unset the middleware fails **open** (returns next response with no auth check). Acceptable for local bootstrap; worth knowing.
- The DPA gate (accept-terms) is *not* enforced in middleware — a session without DPA acceptance can reach app pages if it never passes through `/auth/callback` UI flow. Promoting the gate to middleware is open work (TASKS p:1, "DPA gate: promote from client useEffect to middleware").

`vercel.json` adds `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY` on `/api/*`. There is no CSP header on `main`.

## 3. Row-Level Security posture

Every table in `supabase/schema.sql` and all migrations enable RLS. Pattern summary:

| Table | select | insert | update | delete | Notes |
|---|---|---|---|---|---|
| profiles | own | trigger-only | own | — | created by `handle_new_user` trigger |
| inspections | own | own | own | — | |
| rooms / photos / element_ratings / tenants | own via inspection join | own via join | own via join (photos: delete instead) | photos+tenants only | ownership chained through `inspections.user_id = auth.uid()` |
| dispute_letters | own | own | — (admin client updates) | — | webhook inserts via service role |
| outcome_surveys | own | — | own | — | feature not yet wired |
| payments | own | **none** (service role only) | — | — | |
| consents | own | user-scoped insert (via authed server client) | **none** | **none** | append-only by construction |
| device_tokens | **none** | own | — | own | tokens only readable via admin client |

`migrations/007` (RGPD pre-publication audit, 2026-05-26) hardened the helper functions: pinned `search_path` on `update_updated_at` and `handle_new_user`, kept `handle_new_user` SECURITY DEFINER (required for the auth trigger) but revoked EXECUTE from `PUBLIC`/`anon`/`authenticated` so `/rest/v1/rpc/handle_new_user` is no longer callable, and revoked RPC exposure of `rls_auto_enable`. Database linter findings 0011/0028/0029 closed.

**Schema drift warning:** `migrations/001` and `supabase/schema.sql` describe different generations of the schema (e.g. `disputes`/`outcomes` vs `dispute_letters`/`outcome_surveys`; `profiles.display_name/locale` vs `profiles.full_name/preferred_language`). `schema.sql` is annotated as the canonical, API-aligned shape. Code reads both vocabularies in different modules (see §8). Treat `schema.sql` + migrations 002–007 as live truth; do not rebuild from 001 alone.

## 4. Secrets handling

- All secrets are environment variables; none are hardcoded in `src/`. `.env.local` is gitignored; `.env.local.template` / `.env.local.example` carry placeholders only.
- Server-only enforcement is layered: `import "server-only"` markers on `ai/*`, `email/*`, `supabase/admin`, `pdf/render-and-upload`, `notifications/push`; AWS SDK is dynamically imported inside handlers so web bundles never pick it up; the Capacitor static export contains no API routes at all.
- Stripe webhook authenticity: `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`; raw body is read as text before parsing (correct signature base).
- Photo evidence chain: SHA-256 of every photo persisted in `photos.sha256_hash` and as R2 object metadata; EXIF timestamp best-effort; presigned PUT URLs expire in 5 minutes; R2 keys are user-namespaced and prefix-checked at commit.
- Known off-repo issue (tracked in TASKS / CLAUDE.md): legacy `client_secret_*.json` and `stripe_backup_code.txt` files sit in the stale clone at `~/Documents/Global Apex/Tenu/05-Legal-Compliance/` and must be moved to a secret store. They are not in this repository.

## 5. Server-only AI key rule

Hard rule, enforced in code, not just convention: every Anthropic call happens in `src/lib/ai/risk-scan.ts` / `dispute-letter.ts`, both `server-only` modules consumed exclusively by `/api/ai/scan` and `/api/ai/dispute` route handlers. `ANTHROPIC_API_KEY` is read only inside those modules. The deliberate use of the `server-only` marker (rather than `"use server"`) is documented in-file: it makes any accidental client-bundle import a build failure instead of a key leak.

Prompt-injection surface is acknowledged and mitigated where user text enters prompts: `tenantRationale` is stripped of angle brackets and capped at 500 chars before fencing; model-controlled `meta.*` fields and `inspection_id` are overwritten server-side after parsing; output must be schema-valid JSON (Zod) with bounded retries.

Cost containment doubles as abuse containment: €0.12 hard cap per scan, €0.50 per letter, with `BUDGET_EXCEEDED` → HTTP 402.

## 6. Pending change — Bedrock EU migration (flag)

The privacy policy promises EU data residency. Supabase, R2 and Vercel legs are EU; the direct Anthropic API leg is not contractually EU-resident on the current account. Branch `feat/bedrock-migration` moves both AI modules to AWS Bedrock Frankfurt (`eu-central-1`) with an `AWS_REGION` must-start-with-`eu-` boot guard, after which `ANTHROPIC_API_KEY` is removed from Vercel. Until that merges and MH completes the AWS account/IAM/model-access checklist, **`main` still sends inspection photos and tenancy details to `api.anthropic.com`**. Interim compensating control tracked as #T132: enable Zero Data Retention on the Anthropic org with dated screenshot evidence.

## 7. RGPD posture

Lawful-basis and audit machinery (implemented):
- **Consents**: append-only `consents` table; four types (`withdrawal_waiver_l221_28`, `dpa_acceptance`, `marketing_optin`, `cookies_nonessential`); each row pins `text_version`, locale, checkbox state, IP, user-agent (L221-28 + GDPR Art. 7.1 burden of proof). Marketing default unticked, no bundling (Art. 7.2). Cookie banner defaults to reject-non-essential; anonymous choices live in localStorage only.
- **Art. 15 access**: users can read their own consents (RLS) and `/account` surfaces held data + consent status.
- **Art. 17 erasure**: `POST /api/account/delete` with typed-email confirmation, service-role `deleteUser`, FK cascade. R2 blob deletion is **not** part of this route (gap — see §8).
- **VAT/tax records**: payments rows carry Stripe Tax output for OSS declarations.

Retention durations (RGPD V2 document, AP3R/Renaud review cycle, TASKS #T120–#T133 — these are the agreed policy figures, with automation still partly open):

| Data | Retention | Mechanism |
|---|---|---|
| Photos | 30 days | R2 auto-purge (lifecycle rule — administrative, not in code) |
| Generated PDFs | 24 months | policy; no automated purge in code yet |
| Account | 12 months inactivity (single rule; the 14-month double rule was removed) | policy; no automated job yet |
| Billing records | 10 years (C. com. L 123-22) | payments table retained |
| Logs | 6 months | platform-side |
| Consent/traceability records | 12 months | consents table |

Open RGPD admin items at time of writing (owners MH, from TASKS): publisher phone question with Renaud (#T128/129), dated screenshot of Supabase OTP expiry 3600s (#T130), Supabase plan/PITR confirmation (#T131), Anthropic Zero Data Retention activation (#T132), final document delivery to Renaud (#T133). Contact point: `dpo@tenu.world` (single address; `privacy@` retired in V2).

## 8. Known gaps and accepted risks (code-verified)

1. **Scan endpoint is not payment-gated.** `POST /api/ai/scan` requires only ownership + `status === 'submitted'`. The Stripe webhook sets `status='paid'` — which the scan endpoint would then *reject*. As written, an owner can run a scan (Anthropic cost + PDF + email) without paying, and the documented paid path is inconsistent with the scan's status precondition. The dispute letter, by contrast, is correctly paid-gated.
2. **DPA gate is client-side.** Middleware does not check `profiles.dpa_accepted_at`. Tracked p:1.
3. **upload-commit trusts the client's sha256 and does not verify the R2 object exists.** Weekly verification sweep described in comments is not implemented. Accepted for soft-launch threat model.
4. **No idempotency/unique constraint on `dispute_letters.stripe_payment_id`** — webhook does a check-then-insert (race window on Stripe retries). Noted in-code as "tracked for schema v1.1".
5. **Erasure does not purge R2.** DB cascade only; blob lifecycle relies on the 30-day R2 rule for photos and nothing for PDFs.
6. **R2 object URLs** are stored as `https://<account>.r2.cloudflarestorage.com/<bucket>/<key>` and handed to clients and to the Anthropic vision API. There is no signed-GET layer in code; access control relies on bucket configuration outside the repo. If the bucket is public, anyone with a URL can fetch a photo (URLs contain a user UUID + timestamp — unguessable but unrevocable).
7. **No rate limiting** on any route handler (auth, scan, checkout) at the application layer; only Stripe/Supabase/Vercel platform limits apply.
8. **No CSP**; security headers limited to the two in `vercel.json`.
9. **14-day follow-up (pipeline 3) unimplemented** — relevant only insofar as marketing/legal pages describe it.
10. **`DISPUTE_PAYMENT_GATE_BYPASS=1`** disables the dispute paid gate; must never be set in production.
