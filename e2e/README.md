# Tenu.World — E2E Tests

## Prerequisites

1. **Dev server must be running** in a separate terminal before you execute the tests:
   ```
   npm run dev
   ```

2. **Environment variables** — populate `.env.local` with real Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```
   The test reads this file at runtime via `dotenv` so the Playwright process
   does not need these exported as shell variables.

3. **Test user** — create the smoke test account once in Supabase Auth:
   - Email:    `e2e-smoke@tenu.world`
   - Password: `TenuSmoke2026!`

   Via Supabase dashboard: Authentication → Users → "Create new user"
   Via CLI: `supabase auth admin create-user --email e2e-smoke@tenu.world --password TenuSmoke2026!`

4. **Database schema** — the `consents` table must exist (apply all migrations via
   `supabase db push` or the dashboard).

## Running tests

```bash
# Headless (CI default)
npm run test:e2e

# Headed (watch the browser)
npm run test:e2e:headed

# Debug mode
npx playwright test --debug

# View the last HTML report
npx playwright show-report
```

## Auth strategy

The test uses **Option A** (Supabase admin shortcut):
- Signs in with `signInWithPassword` via the anon client to get a real JWT session.
- Injects the `sb-<project-ref>-auth-token` cookie into the Playwright browser
  context before any navigation, so the Next.js middleware sees a valid session.
- Writes a `dpa_acceptance` consent row directly via the service-role client so
  the `/inspection/new` DPA gate does not redirect to `/auth/accept-terms`.

If the Supabase env vars are missing, the test skips with a clear message.

## Test file

`e2e/post-rotation-smoke.spec.ts` — exactly one test:

> signup → upload → scan → download report button visible

## Fixture

`e2e/fixtures/sample-room.jpg` — valid 1200x800 JPEG (~607KB), generated once
with `sharp`. Used as the photo upload payload in the capture step.
