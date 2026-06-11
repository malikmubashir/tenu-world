-- 0003_funnel_events.sql — minimal launch instrumentation (#T187)
--
-- Append-only event log for the acquisition → revenue funnel:
--   landing → signup → inspection_created → checkout_started → paid
--   → scanned → letter_purchased → outcome_survey
--
-- Service-role ONLY: RLS is enabled with NO policies, and direct grants
-- are revoked from anon/authenticated. Every write/read goes through
-- server code using the service-role key (src/lib/analytics/funnel.ts)
-- or operator SQL (scripts/funnel-report.sql).
--
-- Applied to live (dsbzgrjtiklmxjozbdjv, eu-central-1) 2026-06-11 via MCP.

create table public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references public.profiles(id) on delete set null,
  anonymous_id text null,
  event text not null check (
    event in (
      'landing',
      'signup',
      'inspection_created',
      'checkout_started',
      'paid',
      'scanned',
      'letter_purchased',
      'outcome_survey'
    )
  ),
  source text null,
  utm jsonb null,
  locale text null,
  path text null,
  created_at timestamptz default now()
);

comment on table public.funnel_events is
  'Launch funnel instrumentation (#T187). Service-role writes only — no client policies by design.';

-- RLS on, zero policies: anon/authenticated can do nothing; service role bypasses.
alter table public.funnel_events enable row level security;

-- Belt and braces: strip PostgREST default grants too.
revoke all on table public.funnel_events from anon, authenticated;

create index funnel_events_event_created_at_idx
  on public.funnel_events (event, created_at);
