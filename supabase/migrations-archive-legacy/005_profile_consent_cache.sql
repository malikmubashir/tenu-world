-- ═══════════════════════════════════════════════════════════════
-- Migration 005: Profile consent cache columns
--
-- Denormalised mirrors of the latest consent decisions. The append-
-- only consents table remains the legal source of truth — these
-- columns exist so we can gate flows (did the user accept the DPA?)
-- and filter marketing sends (who opted in?) without a subquery.
--
-- Invariants:
--   - dpa_accepted_at is NEVER overwritten with NULL by application
--     code. Consents are append-only; a withdrawal creates a new
--     consent row and triggers account deletion, not a silent wipe
--     of this column.
--   - marketing_optin_at mirrors the latest POSITIVE opt-in. When a
--     user opts out we set this to NULL so the profile query stops
--     sending. The refusal row still lives in consents for audit.
--
-- Run this in Supabase SQL Editor after 004.
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists dpa_accepted_at timestamptz,
  add column if not exists dpa_text_version text,
  add column if not exists marketing_optin_at timestamptz,
  add column if not exists marketing_text_version text;

comment on column public.profiles.dpa_accepted_at is
  'Cache of latest dpa_acceptance consent row. Source of truth is public.consents.';
comment on column public.profiles.marketing_optin_at is
  'Cache of latest POSITIVE marketing_optin. NULL means not currently opted in (either refused or withdrawn).';

-- Index for marketing-send queries: WHERE marketing_optin_at IS NOT NULL.
create index if not exists idx_profiles_marketing_optin
  on public.profiles(marketing_optin_at)
  where marketing_optin_at is not null;

-- Backfill: if there are existing users with consents rows already
-- (shouldn't be the case pre-launch but cheap insurance), pull the
-- latest decisions forward into the cache.
update public.profiles p
set
  dpa_accepted_at = sub.created_at,
  dpa_text_version = sub.text_version
from (
  select distinct on (user_id)
    user_id, created_at, text_version
  from public.consents
  where consent_type = 'dpa_acceptance' and checkbox_checked = true
  order by user_id, created_at desc
) sub
where sub.user_id = p.id and p.dpa_accepted_at is null;

update public.profiles p
set
  marketing_optin_at = sub.created_at,
  marketing_text_version = sub.text_version
from (
  select distinct on (user_id)
    user_id, created_at, text_version, checkbox_checked
  from public.consents
  where consent_type = 'marketing_optin'
  order by user_id, created_at desc
) sub
where sub.user_id = p.id
  and sub.checkbox_checked = true
  and p.marketing_optin_at is null;
