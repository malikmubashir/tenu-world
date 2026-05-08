# 14 — Launch Day Monitoring — Monday 11 May 2026

**Operator:** Dr Mubashir  
**Cohort:** 8 F&F users  
**Window:** 09:00–18:00 FR time  
**Triage threshold:** any RED item → stop new invites, fix first

---

## System health checks (run at 08:45 before first invite)

| System | URL / command | Green signal |
|---|---|---|
| Vercel deployment | vercel.com → tenu-world → Deployments | Latest deploy = `main` HEAD, status Ready |
| Vercel function logs | vercel.com → tenu-world → Logs → filter Functions | No 500s, no timeouts |
| Supabase auth | supabase.com → project → Auth → Users | No error floods, magic link logs visible |
| Supabase DB | supabase.com → project → Table Editor → profiles | Accessible, no migration pending |
| Stripe dashboard | dashboard.stripe.com → Payments | Webhook endpoint active (Settings → Webhooks → tenu.world/api/webhooks/stripe) |
| Brevo | app.brevo.com → Transactional → Logs | SMTP connected, no bounce flood |
| Anthropic console | console.anthropic.com → Usage | API key active, no rate-limit flags |
| Cloudflare R2 | dash.cloudflare.com → R2 → tenu-photos | Bucket accessible, PUT allowed |

---

## Per-user checklist (tick as each user completes onboarding)

| # | Name | Invite sent | Magic link arrived | DPA accepted | Payment processed | Scan delivered | Feedback received |
|---|---|---|---|---|---|---|---|
| 1 | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 2 | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4 | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5 | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 6 | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 7 | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 8 | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

---

## Tripwire alerts — stop new invites immediately if any of these fire

| Tripwire | How to detect | Action |
|---|---|---|
| Stripe webhook failures | Vercel logs: `POST /api/webhooks/stripe` returning 4xx/5xx | Pause invites. Check Stripe signing secret in Vercel env. |
| R2 upload failures | Vercel logs: `POST /api/mobile/upload-commit` returning 5xx | Pause invites. Check `CLOUDFLARE_R2_*` env vars. |
| Claude API errors | Vercel logs: `POST /api/ai/scan` or `/api/ai/dispute` returning 5xx | Pause scans. Check `ANTHROPIC_API_KEY` in Vercel env. |
| Supabase auth down | Magic links bouncing or /auth/callback returning 500 | Halt all invites. Monitor status.supabase.com. |
| Magic link email not arriving | User reports no email within 5 min | Check Brevo SMTP logs. Check Supabase Auth → Email provider config. |
| Any PII visible in logs or error messages | Scan Vercel function logs for email/address in plaintext | Halt. Rotate any exposed key. File incident note. |

---

## Monitoring cadence

| Time | Action |
|---|---|
| 08:45 | Run all system health checks above |
| 09:00 | Send first 2–3 invites |
| 09:30 | Check Vercel logs for first user attempts |
| 10:00 | Check Stripe for first payment intent |
| 12:00 | Midday check: function logs, Supabase auth log, Brevo delivery |
| 15:00 | Afternoon check: any user feedback received, triage |
| 18:00 | EOD: count paid users, note RED items for Tue fix |

---

## What is NOT a Monday blocker

- High scan latency (Haiku is fast; Sonnet for dispute letters is slower but not used on day 1)
- Brevo delivery taking >2 min (new domain reputation, expected)
- App Store / Play Store — not live until end of May
- UK jurisdiction — disabled at launch, intentional
- Préavis letter feature — deferred to v0.1
- e2e test suite not fully wired (`.env.test.local` p:1 item)
- Any p:1 or p:2 items in TASKS.md
- Vercel function cold start warnings in logs (Fluid Compute, expected on first request)
- A single user reporting confusion — note it, do not ship a fix during the F&F window

---

## Escalation contacts

| Issue | First contact |
|---|---|
| Stripe | dashboard.stripe.com → Support |
| Supabase | supabase.com → Support |
| Vercel | vercel.com → Support |
| Brevo | app.brevo.com → Support |
| Cloudflare R2 | dash.cloudflare.com → Support |
| Anthropic API | console.anthropic.com → Support |

---

*Created: 2026-05-08. Update per-user table as the day progresses.*
