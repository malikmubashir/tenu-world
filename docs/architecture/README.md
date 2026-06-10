# Tenu — Engineering Architecture Documentation

Last verified against commit: `2697e1e` (`main`, 2026-06-10 — "fix(db): 007 security-definer lockdown per RGPD pre-publication audit").

This set documents the system **as built on `main`**. Every statement is grounded in the code (`src/`, `supabase/`, `capacitor.config.ts`, `next.config.ts`, `vercel.json`, `package.json`); where older project docs diverge from the code, the code wins and the divergence is flagged inline. The in-flight AWS Bedrock EU migration (`feat/bedrock-migration`) is flagged in 01, 04 and 07 but not treated as current state.

| Doc | One-line summary |
|---|---|
| [01-Architecture-Overview.md](./01-Architecture-Overview.md) | System context and component map (Next.js on Vercel cdg1, Supabase EU, R2, Stripe, Brevo, Anthropic, FCM, Capacitor shells), dual web/mobile build modes, environments, Bedrock flag. |
| [02-Data-Flows.md](./02-Data-Flows.md) | Sequence diagrams for payment→scan→PDF→email, the dispute-letter pipeline with its three gates, the (unimplemented) 14-day follow-up, web and mobile photo-upload paths, and the magic-link + consents auth flow. |
| [03-Design-System.md](./03-Design-System.md) | Descriptive record of the locked brand: two-layer token architecture in `theme.css`, type scale, `TenuMark` parametric mark, `.t-*` component classes, component inventory, i18n/RTL rules as implemented. |
| [04-Security.md](./04-Security.md) | Auth model and Supabase client tiers, middleware allow-list, full RLS matrix incl. migration 007 lockdown, secrets handling, server-only AI key rule, RGPD retention posture (#T120–#T133), and a code-verified list of known gaps. |
| [05-HLD.md](./05-HLD.md) | Module decomposition with responsibilities and forbidden dependencies, external interfaces, inspection state machine, hosting topology, soft-launch scaling assumptions, failure-mode table, observability. |
| [06-Wireframes.md](./06-Wireframes.md) | Full route inventory (web SSR tree + Capacitor static tree), navigation map, ASCII wireframes of the implemented screens. |
| [07-LLD.md](./07-LLD.md) | `src/lib` module reference, API route contracts with request/response shapes and error codes, live DB schema with ER diagram, complete environment-variable inventory. |

Maintenance rule: when a change lands that touches any documented surface (new route, schema migration, pipeline change, Bedrock cutover), update the affected doc **and** the commit hash above in the same PR.
