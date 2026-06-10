-- 007_security_definer_lockdown.sql
-- 2026-05-26 — RGPD pre-publication audit (Renaud, AP3R Consulting)
--
-- Supabase database linter flagged three issues in our public schema
-- helper functions. None are actively exploited, but they widen the
-- API surface beyond what the application needs. Renaud will see them
-- in his pre-publication scan, so we close them now.
--
-- Lints addressed:
--   0011 function_search_path_mutable — handle_new_user, update_updated_at
--   0028 anon_security_definer_function_executable — handle_new_user, rls_auto_enable
--   0029 authenticated_security_definer_function_executable — same
--
-- See https://supabase.com/docs/guides/database/database-linter
-- for the catalogue of lint IDs.

-- =========================================================================
-- 1. update_updated_at — pin search_path
-- Standard trigger function for updated_at columns. Already SECURITY INVOKER
-- so no privilege concern, just the search_path lint.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- =========================================================================
-- 2. handle_new_user — pin search_path + revoke RPC exposure
-- Trigger function that creates the profile row when a new auth user signs
-- up. Must remain SECURITY DEFINER because the trigger fires under the
-- auth schema context but writes to public.profiles. We revoke EXECUTE
-- from non-trigger callers so /rest/v1/rpc/handle_new_user is no longer
-- a valid call path; only the auth trigger (which runs as postgres) can
-- still invoke it.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
begin
  insert into public.profiles (id, email, locale)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'locale', 'en')
  );
  return new;
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- =========================================================================
-- 3. rls_auto_enable — revoke RPC exposure
-- Event trigger that auto-enables RLS on new tables. Already has a pinned
-- search_path. Event triggers in Postgres only fire under superuser anyway,
-- so the /rest/v1/rpc/ surface is dead code — just revoke it.
-- =========================================================================

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;

-- =========================================================================
-- Post-migration validation
-- After running, re-run the security advisor and confirm lints 0011, 0028,
-- 0029 no longer trigger on these three functions.
-- The "auth_leaked_password_protection" lint is intentionally NOT addressed
-- because Tenu uses magic-link only (no password flow exists).
-- =========================================================================
