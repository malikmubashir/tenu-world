# Morning handoff — 2026-04-18

Dr Mubashir, picking up where we stopped last night. Signup flow is still broken end-to-end but the infrastructure is now sane. Read this top-to-bottom before retrying signup, otherwise you will burn another hour of SMTP rate limit.

## Status of the signup flow

| Layer | State | Notes |
|---|---|---|
| Vercel env vars | Fixed | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` present in Production + Preview (+ Dev for the two public ones). Verified via `curl` on `/api/debug-env` before I deleted the route. |
| Supabase Site URL | Fixed | Was `http://localhost:3000`. Now `https://tenu.world`. Redirect allowlist has `https://tenu.world/auth/callback` and `https://tenu.world/**`. |
| `/auth/callback` | Patched | Now handles BOTH PKCE (`?code=`) AND OTP (`?token_hash=&type=`). Commit `d3ae2ee` on origin/main. |
| Callback diagnostics | Local only — NOT pushed | Commit `708912a` on your local `main` but not on origin. Adds `reason=` to error URL so we see the real failure instead of a generic `auth_failed`. The sandbox cannot push — GitHub creds are not in the bash env. |
| Supabase SMTP | Burned | Default quota hit. 3-4/hour per address. |
| Google OAuth | Blocked | "Access blocked: Tenu World can only be used within its organization" → OAuth consent screen is set to Internal, must be External for public signup. |
| Magic-link PKCE | Fragile | If the email is clicked in a different browser from the one that requested it, the `code_verifier` cookie is missing and `exchangeCodeForSession` fails silently. |

## First thing — push TWO local commits

```bash
cd ~/Documents/Claude/Projects/Tenu.World
git log --oneline -n 3     # expect d1a261a + 708912a on top of d3ae2ee
git push origin main
```

Two commits are sitting on your local `main` that the sandbox could not push (no GitHub creds inside the sandbox). Check with `git log --oneline -n 3`:

- Second-from-top: callback diagnostics — failed signups show the real Supabase error in the URL bar instead of a blank `auth_failed`.
- Topmost: mobile scaffold — Capacitor + iOS/Android UI + `/api/mobile/upload-intent` and `/upload-commit` endpoints. Non-production base, ~30 files, fully documented in `MOBILE-RUNBOOK.md`.

Vercel redeploys automatically once you push. The `/api/mobile/*` endpoints go live; the mobile binary is a separate Xcode / Android Studio run — see the runbook.

## Sequence for the morning (in order, do not skip)

### 1. Configure Brevo SMTP in Supabase (10 min)

Supabase default SMTP is unusable for real testing. Brevo key is already in `.env.local.template` as `BREVO_API_KEY`.

Supabase dashboard → Project Settings → Authentication → SMTP Settings:

```
Host:     smtp-relay.brevo.com
Port:     587
Username: <your Brevo SMTP login — not the API key>
Password: <Brevo SMTP master password from Brevo → SMTP & API → SMTP tab>
Sender:   no-reply@tenu.world
Name:     Tenu
```

Brevo SMTP credentials live at https://app.brevo.com/settings/keys/smtp — they are different from the Brevo API key. The SMTP key pattern is `xsmtpsib-…`.

Verify: trigger a password reset from `/auth/login` to an address you control. Email should arrive within 30 seconds from `no-reply@tenu.world`, not from `noreply@mail.app.supabase.io`.

### 2. Switch Google OAuth consent screen to External (5 min)

Google Cloud Console → APIs & Services → OAuth consent screen → User Type: External → Save.

You will have to re-submit for verification if you go over ~100 users, but for the 11 May soft launch with friends & family that is months away.

### 3. Retry end-to-end signup (Test 3 for Task #29)

Use a **single browser window, no incognito**. The PKCE flow stores `code_verifier` as an httpOnly cookie during `signInWithOtp`; the email click MUST happen in the same browser profile. If you test from your phone with a magic link sent from the laptop, you will see `auth_failed&reason=code_exchange:invalid flow state, no valid flow state found`.

Steps:
1. `https://tenu.world/auth/login` → tick DPA + marketing → type `mubashirr+test-$(date)@gmail.com` → Send magic link.
2. Open the email in **the same browser**. Click the link.
3. Expected redirect: `https://tenu.world/inspection/new` with session cookie set.
4. Verify in Supabase SQL editor:
   ```sql
   select consent_type, text_version, checkbox_checked, created_at
   from consents
   where user_id = (select id from auth.users where email ilike 'mubashirr+test-%' order by created_at desc limit 1)
   order by created_at desc;
   ```
   Expect 2 rows: `dpa_acceptance` (checkbox_checked=true) and `marketing_optin` (true or false depending on what you ticked).
5. Verify profile cache:
   ```sql
   select dpa_accepted_at, dpa_text_version, marketing_optin_at, marketing_text_version
   from profiles
   where id = (select id from auth.users where email ilike 'mubashirr+test-%' order by created_at desc limit 1);
   ```
   `dpa_accepted_at` must be non-null.

If all four assertions pass, Task #29 Test 3 is green. Close the task.

### 4. If cross-browser magic-link signup is required (user clicks email on phone)

PKCE flow cannot survive that. Two options:

**Option A (fastest):** customize the Supabase magic-link email template to send `token_hash` + `type` instead of `code`. Supabase dashboard → Auth → Email Templates → Magic Link. Change the link to:
```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink&redirect={{ .RedirectTo }}
```
The callback already handles this branch (commit `d3ae2ee`).

**Option B:** switch the client to implicit flow in `src/lib/supabase/client.ts` by passing `{ auth: { flowType: 'implicit' } }`. Less secure (token in URL fragment), skip unless Option A fails.

I recommend Option A — it is a one-line template change and keeps PKCE for the in-app browser case.

## Other unfinished work from last night

- Task #30 dispute-letter handler — v2 code shipped but typecheck blocked on sandbox; run `npm run typecheck` locally before merging.
- Task #32 Telegram push — not touched.
- Task #25 Stripe-to-Brevo end-to-end pipeline — depends on Brevo SMTP above.

## Mobile scaffold — what landed overnight

Non-production. Read `MOBILE-RUNBOOK.md` for the exact Xcode / Android Studio command sequence. Short version:

- `npm install` pulls 7 new Capacitor plugins.
- `npm run build:mobile` emits `./out/` (static export via `MOBILE_BUILD=1`).
- `npx cap add ios` + `pod install` + `npm run cap:ios` → opens Xcode with a working iOS project.
- `npx cap add android` + `npm run cap:android` → Android Studio.
- Paste the snippets from `mobile/ios-Info.plist.snippet.xml` and `mobile/android-AndroidManifest.xml.snippet` into the generated native projects.
- Universal Links / App Links files are in `public/.well-known/` — replace the two placeholders (`REPLACE_WITH_TEAM_ID` and `REPLACE_WITH_SHA256_FROM_KEYSTORE`) before Apple and Google verify them.

What works: local draft + photo capture + SQLite offline buffering + upload queue + bottom tab nav.
What doesn't work yet: end-to-end photo upload (needs `Review & Send` page to call `/api/inspection/create` first), mobile login, icons, push, i18n. All flagged in the runbook.

## What NOT to do this morning

- Do not switch `flowType` to implicit without trying the template fix first.
- Do not re-add the `/api/debug-env` route. Environment is confirmed healthy.
- Do not burn SMTP quota by spamming signup before Brevo is wired — you will wait an hour for it to unlock again.
- Do not re-debate the architecture because signup is hard. The stack is correct; the config was wrong.

## File map for this signup debugging

- `src/app/auth/login/page.tsx` — client page, calls `signInWithOtp` + `signInWithOAuth`, stamps `tenu_signup_consent` cookie before redirect.
- `src/app/auth/callback/route.ts` — handles return from Supabase, exchanges code OR verifies OTP, reads cookie, writes consent rows.
- `src/lib/legal/consents.ts` — shared consent copy, cookie helpers, text versions.
- `src/app/api/consents/route.ts` — generic POST/GET for post-signup consent changes (cookie settings page, marketing toggle).
- `src/middleware.ts` — auth gate with graceful bail-out if env vars missing.

---

*Generated overnight by Claude during autonomous session after "ok i leave PC ON, you can work in background" instruction at ~23:xx 2026-04-17.*
