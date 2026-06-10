-- 009_profiles_canonical_vocabulary.sql
-- 2026-06-10 — #T146 profiles schema vocabulary split (p:0, pre-F&F invites)
--
-- Root cause: two generations of the schema coexisted.
--   migration 001:        profiles.display_name / profiles.locale
--   supabase/schema.sql:  profiles.full_name   / profiles.preferred_language / country
-- The LIVE database (umvcjasalzcgtfwsjbfw / eu-west-2, verified 2026-06-10)
-- carries the migration-001 vocabulary. Most of the codebase reads the
-- schema.sql vocabulary, which schema.sql declares canonical ("Aligned with
-- existing API routes") and docs/architecture/04-Security.md §"Schema drift
-- warning" / 07-LLD.md §Schema confirm. Consumers on the canonical names —
-- /api/ai/dispute (tenant name + letter language), /account, GlobalHeader —
-- all fail silently against the live DB today (PostgREST returns an error,
-- code falls back through optional chaining).
--
-- Resolution: rename the live columns to the canonical vocabulary and update
-- the one module still on 001 names (src/lib/email/notify.ts) in the same
-- change set. Deploy ordering: apply this migration and deploy the code in
-- the same window — the only consumer of the OLD names is the best-effort
-- email/push notifier, so a brief skew degrades emails only, never requests.
--
-- Live data 2026-06-10: 1 profile row. Renames preserve data, defaults and
-- NOT NULL ('locale' was `not null default 'en'`).

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'display_name'
  ) then
    alter table public.profiles rename column display_name to full_name;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'locale'
  ) then
    alter table public.profiles rename column locale to preferred_language;
  end if;
end;
$$;

-- schema.sql canonical shape includes country (read by /account). Live DB
-- only had `jurisdiction`; keep that column untouched (legacy, unused by
-- the canonical readers) and add country with the schema.sql default.
alter table public.profiles
  add column if not exists country text not null default 'FR';

-- ─────────────────────────────────────────────────────────────────────
-- handle_new_user still inserts into the renamed column `locale` (see
-- migration 007 which last recreated it). Recreate it on the canonical
-- vocabulary, preserving the 007 lockdown posture exactly:
-- SECURITY DEFINER, pinned search_path, EXECUTE revoked from API roles.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  insert into public.profiles (id, email, full_name, preferred_language)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'locale', 'en')
  );
  return new;
end;
$function$;

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;
