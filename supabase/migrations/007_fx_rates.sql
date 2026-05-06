-- 007_fx_rates.sql
-- Daily EUR/GBP rate fetched from ECB SDMX 2.1 API by /api/cron/ecb-fx.
-- One row per calendar date. Upserted daily; never deleted.

create table if not exists public.fx_rates (
  date        date        primary key,
  eur_gbp     numeric(10, 6) not null check (eur_gbp > 0),
  source      text        not null default 'ecb',
  fetched_at  timestamptz not null default now()
);

-- No RLS needed: read by server-side admin client only (cron + pricing).
-- Protect against direct client access anyway.
alter table public.fx_rates enable row level security;

-- No public SELECT policy — all access goes through server-side admin client.
