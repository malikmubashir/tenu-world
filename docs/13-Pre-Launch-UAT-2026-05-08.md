# 13 — Pre-Launch UAT Script — 2026-05-08 (T-3)

**Tester:** Dr Mubashir  
**Environment:** https://tenu.world (production Vercel deploy)  
**Target:** confirm all happy-path flows work end-to-end before Mon 11 May F&F launch  
**Grading:** GREEN (pass) / YELLOW (cosmetic, non-blocking) / RED (blocks launch, fix first)

---

## Section 1 — Prerequisites

Before starting, confirm:

- [ ] Latest main is deployed on Vercel (check Deployments tab — status = Ready, commit = today's HEAD)
- [ ] Stripe is in **live mode** (or test mode if doing a dry run — confirm which before starting)
- [ ] You have a personal email address not yet in the Supabase `auth.users` table (use for first-time auth test)
- [ ] You have a second email you've used before on tenu.world (for returning-user test)
- [ ] Browser: Chrome incognito, no cookies, no extensions

---

## Section 2 — Authentication flow

Tenu has **no signup page**. The magic-link callback is the signup flow. There is no `/signup` route.

### 2a — First-time user (new email, never signed in)

1. Navigate to `https://tenu.world/auth/login`
2. Enter a fresh email address. Click **Continuer** / **Continue**.
3. Check inbox — magic link email should arrive within 60 seconds (Brevo transactional).
4. Click the magic link.
5. Expected: browser hits `/auth/callback`, Supabase processes the token, redirects to `/auth/accept-terms`.
6. On `/auth/accept-terms`: tick the DPA checkbox, click Accept.
7. Expected: redirect to `/app-home` (or `/inspection/new` if you came via a redirect).

| Check | Expected | Result |
|---|---|---|
| Login page loads | Form with email input, no password field, no "Sign up" link | |
| Magic link arrives | Within 60 s, from noreply@tenu.world or configured Brevo sender | |
| Callback processes | No 500, no error page | |
| accept-terms gate | Shows DPA text, checkbox required, cannot skip | |
| Post-accept redirect | Lands on /app-home or original destination | |

### 2b — Returning user (email already in auth.users)

1. Open new incognito window. Navigate to `https://tenu.world/auth/login`.
2. Enter the email used in 2a. Click Continuer.
3. Click magic link from inbox.
4. Expected: `/auth/callback` → skips `/auth/accept-terms` (already accepted) → lands on `/app-home`.

| Check | Expected | Result |
|---|---|---|
| Magic link arrives again | Within 60 s | |
| accept-terms NOT shown | Skipped because consent already recorded | |
| Lands on app-home | Direct | |

### 2c — Unauthenticated access to protected route

1. Still in incognito (logged out). Navigate directly to `https://tenu.world/inspection/new`.
2. Expected: middleware redirects immediately to `/auth/login?redirect=/inspection/new`.
3. Log in via magic link. Expected: after accept-terms (if new user), redirect back to `/inspection/new`.

| Check | Expected | Result |
|---|---|---|
| /inspection/new without auth | 302 → /auth/login?redirect=/inspection/new | |
| After login, return to destination | /inspection/new loads | |

---

## Section 3 — Inspection creation flow

Logged in, DPA accepted. Navigate to `/inspection/new`.

1. Select property type (Studio / T1 / T2 etc.).
2. Select jurisdiction (France — UK is disabled at launch).
3. Fill in address.
4. Click **Commencer l'inspection** / **Start inspection**.
5. Expected: new inspection record created in Supabase `inspections` table, redirect to `/inspection/[id]/capture`.

| Check | Expected | Result |
|---|---|---|
| Property type selector | All FR sizes visible, UK disabled or hidden | |
| Jurisdiction selector | France only active | |
| Create inspection | No 500, inspection row in DB | |
| Redirect to capture | /inspection/[id]/capture loads | |

---

## Section 4 — Photo capture + upload

On `/inspection/[id]/capture`:

1. Click a room (e.g. Salon).
2. Use the file picker or camera button to attach a photo (use any JPEG ≥ 500KB).
3. Expected: presigned PUT URL fetched from `/api/mobile/upload-intent`, photo PUT to R2, commit call to `/api/mobile/upload-commit`, row in `photos` table.
4. Repeat for 2–3 rooms.

| Check | Expected | Result |
|---|---|---|
| Upload intent succeeds | No 500 from /api/mobile/upload-intent | |
| R2 PUT succeeds | Photo visible in Cloudflare R2 bucket | |
| Upload commit succeeds | Row in photos table with r2_key | |
| Progress indicator | Upload progress visible in UI | |

---

## Section 5 — Checkout and payment

After uploading photos, proceed to checkout.

1. Select the correct SKU for your property size (e.g. entry_t1 = €15 TTC).
2. Click **Payer** / **Pay**.
3. Expected: Stripe Checkout session created server-side, redirect to Stripe hosted page.
4. Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.
5. Complete payment. Expected: redirect to success page, Stripe webhook fires to `/api/webhooks/stripe`, Supabase `payments` table updated.

| Check | Expected | Result |
|---|---|---|
| Correct price shown | Matches SKU in CLAUDE.md pricing table | |
| TVA shown | 20% FR TVA line on Stripe Checkout | |
| Stripe redirect | No error, Stripe hosted checkout loads | |
| Payment completes | Success page shown | |
| Webhook fires | Vercel logs show POST /api/webhooks/stripe 200 | |
| Payment row in DB | payments table has record with user_id | |

---

## Section 6 — AI scan

After payment confirmed:

1. Scan triggers automatically (or click trigger if manual).
2. Expected: `/api/ai/scan` called server-side with photo URLs, Claude Haiku returns JSON risk assessment, PDF generated via @react-pdf/renderer, uploaded to R2, Brevo email sent with download link.
3. Check inbox for scan result email.

| Check | Expected | Result |
|---|---|---|
| Scan completes without 500 | Vercel function logs clean | |
| PDF generated | PDF accessible via R2 link in email | |
| Email received | From Brevo, within 5 min of payment | |
| PDF content correct | Risk ratings per room, legal references in FR | |

---

## Section 7 — Legal pages

Spot-check these pages load and contain no DRAFT / TBD / placeholder markers:

- [ ] `https://tenu.world/legal/terms/fr` — CGU
- [ ] `https://tenu.world/legal/terms/en` — Terms
- [ ] `https://tenu.world/legal/privacy/fr` — Politique de confidentialité
- [ ] `https://tenu.world/legal/privacy/en` — Privacy policy
- [ ] `https://tenu.world/legal/refund/fr` — Droit de rétractation
- [ ] `https://tenu.world/legal/cookies/fr` — Cookies

---

## Section 8 — RED / YELLOW / GREEN triage

After completing above:

| Colour | Count | Notes |
|---|---|---|
| GREEN | | |
| YELLOW | | |
| RED | | |

**Rule:** any RED item blocks sending invites. Fix Saturday/Sunday. Confirm fixed before Monday 09:00.

---

*Created: 2026-05-08. Auth section uses magic-link flow — no /signup route exists in Tenu.*
