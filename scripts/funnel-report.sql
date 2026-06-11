-- funnel-report.sql — launch funnel readout (#T187, 2026-06-11)
--
-- Run in the Supabase SQL editor (tenu-world-eu-central /
-- dsbzgrjtiklmxjozbdjv) or via psql with the service role.
-- public.funnel_events has no client policies — the SQL editor runs
-- as postgres, which bypasses RLS.
--
-- Stages: landing → signup → inspection_created → checkout_started
--         → paid → scanned (+ letter_purchased, outcome_survey)
--
-- Notes on interpretation:
--   * 'landing' only counts attributed first touches (?src= / utm_*).
--     Organic/direct top-of-funnel lives in Vercel Web Analytics.
--   * Counts below are distinct users per stage (events deduplicated),
--     except 'landing' which is anonymous and counted by row.

-- ── 1. Daily funnel counts ──────────────────────────────────────────
select
  date_trunc('day', created_at)::date                                   as day,
  count(*) filter (where event = 'landing')                             as landing,
  count(distinct user_id) filter (where event = 'signup')               as signups,
  count(distinct user_id) filter (where event = 'inspection_created')   as inspections,
  count(distinct user_id) filter (where event = 'checkout_started')     as checkouts,
  count(distinct user_id) filter (where event = 'paid')                 as paid,
  count(distinct user_id) filter (where event = 'scanned')              as scanned,
  count(distinct user_id) filter (where event = 'letter_purchased')     as letters,
  count(distinct user_id) filter (where event = 'outcome_survey')       as surveys
from public.funnel_events
group by 1
order by 1 desc;

-- ── 2. Overall stage-to-stage conversion % (all time) ───────────────
with stage_counts as (
  select
    count(*) filter (where event = 'landing')                           as landing,
    count(distinct user_id) filter (where event = 'signup')             as signups,
    count(distinct user_id) filter (where event = 'inspection_created') as inspections,
    count(distinct user_id) filter (where event = 'checkout_started')   as checkouts,
    count(distinct user_id) filter (where event = 'paid')               as paid,
    count(distinct user_id) filter (where event = 'scanned')            as scanned,
    count(distinct user_id) filter (where event = 'letter_purchased')   as letters
  from public.funnel_events
)
select
  landing, signups, inspections, checkouts, paid, scanned, letters,
  round(100.0 * signups     / nullif(landing, 0),     1) as pct_landing_to_signup,
  round(100.0 * inspections / nullif(signups, 0),     1) as pct_signup_to_inspection,
  round(100.0 * checkouts   / nullif(inspections, 0), 1) as pct_inspection_to_checkout,
  round(100.0 * paid        / nullif(checkouts, 0),   1) as pct_checkout_to_paid,
  round(100.0 * scanned     / nullif(paid, 0),        1) as pct_paid_to_scanned,
  -- THE attach-rate number for the docs/17 adjudication:
  round(100.0 * letters     / nullif(scanned, 0),     1) as attach_rate_pct
from stage_counts;

-- ── 3. Acquisition source breakdown ─────────────────────────────────
-- source is first-touch (?src= or utm_source), stamped on the landing
-- event and carried onto the signup event via the tenu_attr cookie.
-- Post-signup events deliberately carry no source — join through the
-- user's signup row instead.
with signup_source as (
  select distinct on (user_id)
    user_id,
    coalesce(source, 'organic/direct') as source
  from public.funnel_events
  where event = 'signup' and user_id is not null
  order by user_id, created_at
)
select
  coalesce(s.source, 'organic/direct')                                   as source,
  count(*) filter (where f.event = 'landing')                            as landings,
  count(distinct f.user_id) filter (where f.event = 'signup')            as signups,
  count(distinct f.user_id) filter (where f.event = 'paid')              as paid,
  count(distinct f.user_id) filter (where f.event = 'letter_purchased')  as letters,
  round(
    100.0 * count(distinct f.user_id) filter (where f.event = 'paid')
          / nullif(count(distinct f.user_id) filter (where f.event = 'signup'), 0),
    1
  ) as pct_signup_to_paid
from public.funnel_events f
left join signup_source s on s.user_id = f.user_id
group by 1
order by signups desc, landings desc;

-- ── 4. Last 7 days at a glance ──────────────────────────────────────
select
  event,
  count(*)                 as events,
  count(distinct user_id)  as distinct_users
from public.funnel_events
where created_at >= now() - interval '7 days'
group by event
order by array_position(
  array['landing','signup','inspection_created','checkout_started',
        'paid','scanned','letter_purchased','outcome_survey'],
  event
);
