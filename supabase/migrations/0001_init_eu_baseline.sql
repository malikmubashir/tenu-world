-- 0001_init_eu_baseline.sql
-- 2026-06-10 — Consolidated from-scratch baseline for tenu-world-eu-central
-- (dsbzgrjtiklmxjozbdjv, eu-central-1 / Frankfurt).
--
-- Supersedes the legacy migration chain 001–009 (non-replayable: 002 depended
-- on objects nothing created, 003 altered a payments table no migration
-- created). Legacy project umvcjasalzcgtfwsjbfw (eu-west-2) abandoned
-- 2026-06-10 per owner decision.
--
-- Shape sources, table by table:
--   profiles        canonical 009 vocabulary (full_name, preferred_language,
--                   country) + 005 consent cache columns
--   inspections     UNION of live legacy (001+002 vocabulary inserted by
--                   /api/inspection/create) and the structured columns read
--                   by /api/ai/scan + /api/ai/dispute (address_formatted,
--                   address_line1, city, postal_code, country_code,
--                   landlord_name, deposit_amount_cents, deposit_currency,
--                   risk_score jsonb) + 008 status state machine
--   rooms           live legacy shape (risk_level/risk_score/risk_notes/
--                   estimated_deduction_eur written by /api/ai/scan)
--   photos          schema.sql shape — code inserts inspection_id,
--                   sha256_hash, exif_timestamp, source (live legacy LACKED
--                   these; inserts were failing there)
--   element_ratings, tenants  live legacy shape
--   consents        live legacy shape (003)
--   payments        live legacy shape (003+004) + 008 partial unique index
--   dispute_letters live legacy shape + 008 partial unique index
--   device_tokens   006 (never applied on legacy — push-token route failed)
--   outcome_surveys schema.sql shape (pipeline 3, roadmapped)
--
-- EXCLUDED: 001 relics `disputes` and `outcomes` — zero code references.
--
-- Policy deltas vs live legacy (required by code, reported in cutover audit):
--   inspections      + DELETE own  (/api/inspection/create rollback path)
--   dispute_letters  + UPDATE own  (/api/ai/dispute updates the webhook
--                                   pre-inserted row with the user session)
--
-- Security posture (007/009): update_updated_at + handle_new_user pinned
-- search_path; handle_new_user SECURITY DEFINER with EXECUTE revoked from
-- anon + authenticated; RLS enabled on every table; payments and the
-- service-role write paths have NO client INSERT/UPDATE policies.

-- ─────────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp" with schema extensions;

-- ─────────────────────────────────────────────────────────────────────
-- Functions
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- ─────────────────────────────────────────────────────────────────────
-- PROFILES — extends auth.users, canonical vocabulary (009)
-- ─────────────────────────────────────────────────────────────────────
create table public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  email                  text not null,
  full_name              text,
  preferred_language     text not null default 'en',
  country                text not null default 'FR',
  -- 005 consent cache (source of truth stays in consents)
  dpa_accepted_at        timestamptz,
  dpa_text_version       text,
  marketing_optin_at     timestamptz,
  marketing_text_version text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create index idx_profiles_marketing_optin
  on public.profiles (marketing_optin_at)
  where marketing_optin_at is not null;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();

-- Auto-create profile on signup — 009 hardened form.
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────
-- INSPECTIONS — code-shape union + 008 status machine
-- ─────────────────────────────────────────────────────────────────────
create table public.inspections (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  jurisdiction          text not null check (jurisdiction in ('fr', 'uk')),
  address               text not null,
  -- structured address + tenancy facts read by /api/ai/scan + /api/ai/dispute
  address_formatted     text,
  address_line1         text,
  city                  text,
  postal_code           text,
  country_code          text,
  landlord_name         text,
  deposit_amount_cents  integer,
  deposit_currency      text not null default 'EUR',
  move_in_date          date,
  move_out_date         date,
  -- 008 state machine: draft → capturing → submitted → paid → scanning →
  -- scanned → disputed → closed
  status                text not null default 'draft' check (status in (
    'draft', 'capturing', 'submitted', 'paid', 'scanning', 'scanned',
    'disputed', 'closed'
  )),
  stripe_payment_id     text,
  dispute_purchased     boolean not null default false,
  -- owner details (002)
  owner_type            text not null default 'individual',
  owner_name            text,
  owner_company_name    text,
  owner_email           text,
  owner_phone           text,
  owner_address         text,
  -- contract details (002)
  furnished             boolean not null default false,
  lease_start_date      date,
  lease_end_date        date,
  notice_period_months  integer not null default 3,
  monthly_rent_cents    integer,
  monthly_charges_cents integer,
  contract_pdf_r2_key   text,
  -- property characteristics (002)
  property_type         text not null default 'appartement',
  surface_m2            numeric,
  main_rooms            integer,
  zone_tendue           boolean not null default false,
  commune_insee         text,
  inspection_type       text not null default 'move_in',
  -- notification timestamps (002)
  tenant_email_sent_at  timestamptz,
  owner_email_sent_at   timestamptz,
  -- v2 scan payload + telemetry, written by /api/ai/scan
  risk_score            jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.inspections enable row level security;

create policy "Users read own inspections"
  on public.inspections for select
  using (auth.uid() = user_id);

create policy "Users create inspections"
  on public.inspections for insert
  with check (auth.uid() = user_id);

create policy "Users update own inspections"
  on public.inspections for update
  using (auth.uid() = user_id);

create policy "Users delete own inspections"
  on public.inspections for delete
  using (auth.uid() = user_id);

create index idx_inspections_user on public.inspections (user_id);
create index idx_inspections_status on public.inspections (status);

create trigger set_updated_at before update on public.inspections
  for each row execute function public.update_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- ROOMS — live legacy shape (scan writes the risk_* columns)
-- ─────────────────────────────────────────────────────────────────────
create table public.rooms (
  id                      uuid primary key default gen_random_uuid(),
  inspection_id           uuid not null references public.inspections(id) on delete cascade,
  room_type               text not null,
  label                   text,
  sort_order              integer not null default 0,
  risk_level              text check (risk_level in ('low', 'medium', 'high')),
  risk_score              numeric,
  risk_notes              jsonb,
  estimated_deduction_eur numeric,
  created_at              timestamptz not null default now()
);

alter table public.rooms enable row level security;

create policy "Users read own rooms"
  on public.rooms for select
  using (exists (
    select 1 from public.inspections i
    where i.id = rooms.inspection_id and i.user_id = auth.uid()
  ));

create policy "Users create rooms"
  on public.rooms for insert
  with check (exists (
    select 1 from public.inspections i
    where i.id = rooms.inspection_id and i.user_id = auth.uid()
  ));

create policy "Users update own rooms"
  on public.rooms for update
  using (exists (
    select 1 from public.inspections i
    where i.id = rooms.inspection_id and i.user_id = auth.uid()
  ));

create index idx_rooms_inspection on public.rooms (inspection_id);

-- ─────────────────────────────────────────────────────────────────────
-- PHOTOS — schema.sql shape (evidence chain: sha256, EXIF, source)
-- ─────────────────────────────────────────────────────────────────────
create table public.photos (
  id                            uuid primary key default gen_random_uuid(),
  room_id                       uuid not null references public.rooms(id) on delete cascade,
  inspection_id                 uuid references public.inspections(id) on delete cascade,
  r2_key                        text not null,
  r2_url                        text,
  filename                      text,
  mime_type                     text not null default 'image/jpeg',
  size_bytes                    integer,
  width                         integer,
  height                        integer,
  sort_order                    integer not null default 0,
  capture_lat                   double precision,
  capture_lng                   double precision,
  capture_accuracy_meters       double precision,
  distance_from_property_meters double precision,
  device_model                  text,
  exif_timestamp                timestamptz,
  sha256_hash                   text,
  source                        text not null default 'camera',
  captured_at                   timestamptz not null default now(),
  created_at                    timestamptz not null default now()
);

alter table public.photos enable row level security;

create policy "Users read own photos"
  on public.photos for select
  using (exists (
    select 1 from public.rooms r
    join public.inspections i on i.id = r.inspection_id
    where r.id = photos.room_id and i.user_id = auth.uid()
  ));

create policy "Users create photos"
  on public.photos for insert
  with check (exists (
    select 1 from public.rooms r
    join public.inspections i on i.id = r.inspection_id
    where r.id = photos.room_id and i.user_id = auth.uid()
  ));

create policy "Users delete own photos"
  on public.photos for delete
  using (exists (
    select 1 from public.rooms r
    join public.inspections i on i.id = r.inspection_id
    where r.id = photos.room_id and i.user_id = auth.uid()
  ));

create index idx_photos_room on public.photos (room_id);
create index idx_photos_inspection on public.photos (inspection_id);

-- ─────────────────────────────────────────────────────────────────────
-- ELEMENT RATINGS — live legacy shape (TB/B/M/MV grid, app-validated)
-- ─────────────────────────────────────────────────────────────────────
create table public.element_ratings (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rooms(id) on delete cascade,
  element_key text not null,
  rating      text not null default 'B',
  comment     text,
  photo_ids   uuid[],
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint element_ratings_room_id_element_key_key unique (room_id, element_key)
);

alter table public.element_ratings enable row level security;

create policy "Users can read own element ratings"
  on public.element_ratings for select
  using (exists (
    select 1 from public.rooms
    join public.inspections on inspections.id = rooms.inspection_id
    where rooms.id = element_ratings.room_id and inspections.user_id = auth.uid()
  ));

create policy "Users can create element ratings"
  on public.element_ratings for insert
  with check (exists (
    select 1 from public.rooms
    join public.inspections on inspections.id = rooms.inspection_id
    where rooms.id = element_ratings.room_id and inspections.user_id = auth.uid()
  ));

create policy "Users can update own element ratings"
  on public.element_ratings for update
  using (exists (
    select 1 from public.rooms
    join public.inspections on inspections.id = rooms.inspection_id
    where rooms.id = element_ratings.room_id and inspections.user_id = auth.uid()
  ));

create index idx_element_ratings_room on public.element_ratings (room_id);

create trigger set_updated_at before update on public.element_ratings
  for each row execute function public.update_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- TENANTS — live legacy shape (1–3 per inspection)
-- ─────────────────────────────────────────────────────────────────────
create table public.tenants (
  id            uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  full_name     text not null,
  email         text,
  phone         text,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.tenants enable row level security;

create policy "Users can read own tenants"
  on public.tenants for select
  using (exists (
    select 1 from public.inspections
    where inspections.id = tenants.inspection_id and inspections.user_id = auth.uid()
  ));

create policy "Users can create tenants"
  on public.tenants for insert
  with check (exists (
    select 1 from public.inspections
    where inspections.id = tenants.inspection_id and inspections.user_id = auth.uid()
  ));

create policy "Users can update own tenants"
  on public.tenants for update
  using (exists (
    select 1 from public.inspections
    where inspections.id = tenants.inspection_id and inspections.user_id = auth.uid()
  ));

create policy "Users can delete own tenants"
  on public.tenants for delete
  using (exists (
    select 1 from public.inspections
    where inspections.id = tenants.inspection_id and inspections.user_id = auth.uid()
  ));

create index idx_tenants_inspection on public.tenants (inspection_id);

-- ─────────────────────────────────────────────────────────────────────
-- CONSENTS — append-only consent log (003). Created BEFORE payments so the
-- payments.waiver_consent_id FK resolves on a fresh install.
-- ─────────────────────────────────────────────────────────────────────
create table public.consents (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  consent_type     text not null check (consent_type in (
    'withdrawal_waiver_l221_28',
    'dpa_acceptance',
    'marketing_optin',
    'cookies_nonessential'
  )),
  text_version     text not null,
  locale           text not null check (locale in ('fr', 'en')),
  inspection_id    uuid references public.inspections(id) on delete set null,
  intended_product text,
  checkbox_checked boolean not null default true,
  ip_address       inet,
  user_agent       text,
  created_at       timestamptz not null default now()
);

alter table public.consents enable row level security;

create policy "Users can read own consents"
  on public.consents for select
  using (auth.uid() = user_id);

-- INSERTs come only from server route handlers operating with the user
-- session (checkout waiver, auth callback DPA/marketing, /api/consents).
-- No UPDATE/DELETE policy: the log is append-only.
create policy "Users can insert own consents"
  on public.consents for insert
  to authenticated
  with check (auth.uid() = user_id);

create index idx_consents_user on public.consents (user_id);
create index idx_consents_inspection on public.consents (inspection_id);
create index idx_consents_type_version on public.consents (consent_type, text_version);

-- ─────────────────────────────────────────────────────────────────────
-- PAYMENTS — live shape (003+004 tax columns) + 008 idempotency index.
-- Service-role only for writes (Stripe webhook). Clients hold SELECT only.
-- ─────────────────────────────────────────────────────────────────────
create table public.payments (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid not null references public.profiles(id) on delete cascade,
  inspection_id              uuid references public.inspections(id),
  dispute_letter_id          uuid,
  type                       text not null,
  status                     text not null default 'pending',
  stripe_payment_intent_id   text unique,
  stripe_checkout_session_id text,
  amount_cents               integer not null,
  currency                   text not null default 'EUR',
  tax_amount_cents           integer not null default 0,
  tax_rate_bps               integer,
  tax_country                text,
  waiver_consent_id          uuid references public.consents(id) on delete set null,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "Users can read own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create index idx_payments_user on public.payments (user_id);
create index idx_payments_stripe on public.payments (stripe_payment_intent_id);
create index idx_payments_waiver on public.payments (waiver_consent_id);
create index idx_payments_tax_country on public.payments (tax_country);

-- 008: Stripe delivers at-least-once — database-level idempotency backstop.
create unique index uq_payments_stripe_checkout_session
  on public.payments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create trigger set_updated_at before update on public.payments
  for each row execute function public.update_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- DISPUTE LETTERS — live shape + 008 idempotency index
-- ─────────────────────────────────────────────────────────────────────
create table public.dispute_letters (
  id                        uuid primary key default gen_random_uuid(),
  inspection_id             uuid not null references public.inspections(id) on delete cascade,
  user_id                   uuid not null references public.profiles(id) on delete cascade,
  status                    text not null default 'pending',
  letter_type               text not null default 'CDC',
  letter_language           text not null default 'FR',
  letter_content            text,
  letter_pdf_url            text,
  user_explanation          text,
  user_explanation_language text,
  stripe_payment_id         text,
  stripe_amount_cents       integer,
  deduction_items           jsonb,
  created_at                timestamptz not null default now(),
  completed_at              timestamptz
);

alter table public.dispute_letters enable row level security;

create policy "Users can read own dispute_letters"
  on public.dispute_letters for select
  using (auth.uid() = user_id);

create policy "Users can create own dispute_letters"
  on public.dispute_letters for insert
  with check (auth.uid() = user_id);

-- Required by /api/ai/dispute: the Stripe webhook (service role) pre-inserts
-- the paid row; the generation route then UPDATEs it in place with the user
-- session. Absent on legacy — the update silently matched zero rows there.
create policy "Users can update own dispute_letters"
  on public.dispute_letters for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_dispute_letters_inspection on public.dispute_letters (inspection_id);
create index idx_dispute_letters_user on public.dispute_letters (user_id);

-- 008: webhook idempotency backstop.
create unique index uq_dispute_letters_stripe_payment
  on public.dispute_letters (stripe_payment_id)
  where stripe_payment_id is not null;

-- payments.dispute_letter_id FK deferred until dispute_letters exists.
alter table public.payments
  add constraint payments_dispute_letter_id_fkey
  foreign key (dispute_letter_id) references public.dispute_letters(id);

-- ─────────────────────────────────────────────────────────────────────
-- DEVICE TOKENS — 006 (was never applied on legacy)
-- ─────────────────────────────────────────────────────────────────────
create table public.device_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  token      text not null,
  platform   text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint device_tokens_user_token_unique unique (user_id, token)
);

alter table public.device_tokens enable row level security;

create policy "Users insert own tokens"
  on public.device_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users delete own tokens"
  on public.device_tokens for delete
  using (auth.uid() = user_id);

-- No SELECT policy — tokens are only read server-side via the admin client.

create trigger set_updated_at before update on public.device_tokens
  for each row execute function public.update_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- OUTCOME SURVEYS — 14-day follow-up (pipeline 3, roadmapped)
-- ─────────────────────────────────────────────────────────────────────
create table public.outcome_surveys (
  id                     uuid primary key default gen_random_uuid(),
  inspection_id          uuid not null references public.inspections(id) on delete cascade,
  user_id                uuid not null references public.profiles(id) on delete cascade,
  outcome                text,
  amount_recovered_cents integer,
  used_dispute_letter    boolean default false,
  feedback               text,
  nps_score              integer,
  survey_sent_at         timestamptz,
  survey_completed_at    timestamptz,
  created_at             timestamptz not null default now()
);

alter table public.outcome_surveys enable row level security;

create policy "Users can read own surveys"
  on public.outcome_surveys for select
  using (auth.uid() = user_id);

create policy "Users can update own surveys"
  on public.outcome_surveys for update
  using (auth.uid() = user_id);

create index idx_outcome_surveys_inspection on public.outcome_surveys (inspection_id);
create index idx_outcome_surveys_user on public.outcome_surveys (user_id);
