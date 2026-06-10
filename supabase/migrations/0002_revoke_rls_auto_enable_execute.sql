-- 0002_revoke_rls_auto_enable_execute.sql
-- 2026-06-10 — carry the 007 lockdown posture to the new EU base.
--
-- `public.rls_auto_enable()` is a platform-provisioned SECURITY DEFINER
-- event-trigger function that arrives with EXECUTE granted to anon and
-- authenticated, tripping linter rules 0028/0029 (same finding 007 closed
-- on the legacy project). Event triggers only fire under superuser, so the
-- /rest/v1/rpc/ surface is dead code — revoke it.

revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon, authenticated;
