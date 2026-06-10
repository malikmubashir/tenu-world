# Legacy migration chain — ARCHIVED 2026-06-10

These nine files (001–009) are the migration history of the **abandoned**
legacy Supabase project `umvcjasalzcgtfwsjbfw` (eu-west-2 / London).
They are kept for audit only. **Never apply them to any project.**

## Why archived

1. **The chain is not replayable from scratch.**
   - 002 depends on the `uuid-ossp` extension and the `update_updated_at()`
     function, which no earlier migration creates (they were created by hand
     in the SQL editor on the legacy project).
   - 002 re-adds `inspections.dispute_purchased`, which 001 already created.
   - 003 alters a `payments` table that no migration creates (also hand-created).
2. **Superseded.** The database cutover of 2026-06-10 (owner decision)
   deployed a from-scratch consolidated baseline on the new EU project
   `dsbzgrjtiklmxjozbdjv` (tenu-world-eu-central, eu-central-1 / Frankfurt).
   See `../migrations/0001_init_eu_baseline.sql` — it carries everything these
   nine files plus the live-only hand-edits were supposed to produce, in the
   shape the code on `main` actually uses, minus the dead 001 relics
   (`disputes`, `outcomes`).
3. **The legacy project is being abandoned**, deletion pending the cutover
   smoke test (Vercel env swap + signup/inspection/payment round-trip).

## What was carried forward vs dropped

| Legacy item | Disposition |
|---|---|
| 001 core tables | carried (inspections in code-shape union, see baseline header) |
| 001 `disputes`, `outcomes` tables | **dropped** — zero code references |
| 002 owner/contract/tenant columns + `element_ratings`, `tenants` | carried |
| 003 `consents` + payments link | carried |
| 004 tax columns | carried |
| 005 profile consent cache | carried |
| 006 `device_tokens` | carried (was never actually applied on legacy) |
| 007 function lockdown (search_path pins, EXECUTE revokes) | carried (+ 0002 for the platform `rls_auto_enable`) |
| 008 payment state machine + idempotency indexes | carried |
| 009 profiles canonical vocabulary + hardened `handle_new_user` | carried |
