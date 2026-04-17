-- ═══════════════════════════════════════════════════════════════
-- Tenu.World — Supabase Database Schema
-- Run this in Supabase SQL Editor to set up all tables
-- Aligned with existing API routes in src/app/api/
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ───────────────────────────────────────────────────────────────
-- PROFILES — extends Supabase auth.users
-- Created automatically on signup via trigger
-- ───────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  preferred_language text not null default 'en',
  country text not null default 'FR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────────────────────────────────────────────
-- INSPECTIONS — one per move-in/move-out session
-- Column names match src/app/api/inspection/create/route.ts
-- ───────────────────────────────────────────────────────────────
create table public.inspections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  jurisdiction text not null default 'fr',
  status text not null default 'draft',
  -- Address (Google Places structured)
  address_formatted text,
  address_line1 text,
  address_line2 text,
  city text,
  postal_code text,
  region text,
  country_code text,
  google_place_id text,
  address_lat double precision,
  address_lng double precision,
  -- Dates
  move_in_date date,
  move_out_date date,
  landlord_name text,
  landlord_email text,
  deposit_amount_cents integer,
  deposit_currency text not null default 'EUR',
  room_count integer not null default 0,
  photo_count integer not null default 0,
  risk_score jsonb,
  report_pdf_url text,
  stripe_payment_id text,
  stripe_amount_cents integer,
  -- True once the dispute add-on has been paid. Webhook flips this
  -- on checkout.session.completed for product in ("dispute", "report_and_dispute").
  dispute_purchased boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  completed_at timestamptz
);

alter table public.inspections enable row level security;

create policy "Users can read own inspections"
  on public.inspections for select
  using (auth.uid() = user_id);

create policy "Users can create inspections"
  on public.inspections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own inspections"
  on public.inspections for update
  using (auth.uid() = user_id);

create index idx_inspections_user on public.inspections(user_id);
create index idx_inspections_status on public.inspections(status);

-- ───────────────────────────────────────────────────────────────
-- ROOMS — each inspection has multiple rooms
-- Column names match src/app/api/inspection/create/route.ts
-- ───────────────────────────────────────────────────────────────
create table public.rooms (
  id uuid primary key default uuid_generate_v4(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  room_type text not null,
  label text,
  sort_order integer not null default 0,
  notes text,
  risk_score jsonb,
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

create policy "Users can read own rooms"
  on public.rooms for select
  using (
    exists (
      select 1 from public.inspections
      where inspections.id = rooms.inspection_id
      and inspections.user_id = auth.uid()
    )
  );

create policy "Users can create rooms"
  on public.rooms for insert
  with check (
    exists (
      select 1 from public.inspections
      where inspections.id = rooms.inspection_id
      and inspections.user_id = auth.uid()
    )
  );

create policy "Users can update own rooms"
  on public.rooms for update
  using (
    exists (
      select 1 from public.inspections
      where inspections.id = rooms.inspection_id
      and inspections.user_id = auth.uid()
    )
  );

create index idx_rooms_inspection on public.rooms(inspection_id);

-- ───────────────────────────────────────────────────────────────
-- PHOTOS — uploaded to R2, metadata stored here
-- Column names match src/app/api/photos/route.ts
-- ───────────────────────────────────────────────────────────────
create table public.photos (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  inspection_id uuid references public.inspections(id) on delete cascade,
  r2_key text not null,
  r2_url text,
  filename text,
  mime_type text not null default 'image/jpeg',
  size_bytes integer,
  width integer,
  height integer,
  sort_order integer not null default 0,
  -- Geolocation + authenticity
  capture_lat double precision,
  capture_lng double precision,
  capture_accuracy_meters double precision,
  distance_from_property_meters double precision,
  device_model text,
  exif_timestamp timestamptz,
  sha256_hash text,
  source text not null default 'camera',
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.photos enable row level security;

create policy "Users can read own photos"
  on public.photos for select
  using (
    exists (
      select 1 from public.rooms
      join public.inspections on inspections.id = rooms.inspection_id
      where rooms.id = photos.room_id
      and inspections.user_id = auth.uid()
    )
  );

create policy "Users can create photos"
  on public.photos for insert
  with check (
    exists (
      select 1 from public.rooms
      join public.inspections on inspections.id = rooms.inspection_id
      where rooms.id = photos.room_id
      and inspections.user_id = auth.uid()
    )
  );

create policy "Users can delete own photos"
  on public.photos for delete
  using (
    exists (
      select 1 from public.rooms
      join public.inspections on inspections.id = rooms.inspection_id
      where rooms.id = photos.room_id
      and inspections.user_id = auth.uid()
    )
  );

create index idx_photos_room on public.photos(room_id);
create index idx_photos_inspection on public.photos(inspection_id);

-- ───────────────────────────────────────────────────────────────
-- DISPUTE LETTERS — add-on product
-- ───────────────────────────────────────────────────────────────
create table public.dispute_letters (
  id uuid primary key default uuid_generate_v4(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  letter_type text not null default 'CDC',
  letter_language text not null default 'FR',
  letter_content text,
  letter_pdf_url text,
  user_explanation text,
  user_explanation_language text,
  stripe_payment_id text,
  stripe_amount_cents integer,
  deduction_items jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.dispute_letters enable row level security;

create policy "Users can read own disputes"
  on public.dispute_letters for select
  using (auth.uid() = user_id);

create policy "Users can create disputes"
  on public.dispute_letters for insert
  with check (auth.uid() = user_id);

create index idx_disputes_inspection on public.dispute_letters(inspection_id);
create index idx_disputes_user on public.dispute_letters(user_id);

-- ───────────────────────────────────────────────────────────────
-- OUTCOME SURVEYS — 14-day follow-up
-- ───────────────────────────────────────────────────────────────
create table public.outcome_surveys (
  id uuid primary key default uuid_generate_v4(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  outcome text,
  amount_recovered_cents integer,
  used_dispute_letter boolean default false,
  feedback text,
  nps_score integer,
  survey_sent_at timestamptz,
  survey_completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.outcome_surveys enable row level security;

create policy "Users can read own surveys"
  on public.outcome_surveys for select
  using (auth.uid() = user_id);

create policy "Users can update own surveys"
  on public.outcome_surveys for update
  using (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────
-- PAYMENTS — tracks all Stripe transactions
-- ───────────────────────────────────────────────────────────────
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  inspection_id uuid references public.inspections(id),
  dispute_letter_id uuid references public.dispute_letters(id),
  type text not null,
  status text not null default 'pending',
  stripe_payment_intent_id text unique,
  stripe_checkout_session_id text,
  amount_cents integer not null,
  currency text not null default 'EUR',
  tax_amount_cents integer not null default 0,
  tax_rate_bps integer,
  tax_country text,
  waiver_consent_id uuid references public.consents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "Users can read own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create index idx_payments_user on public.payments(user_id);
create index idx_payments_stripe on public.payments(stripe_payment_intent_id);
create index idx_payments_waiver on public.payments(waiver_consent_id);
create index idx_payments_tax_country on public.payments(tax_country);

-- ───────────────────────────────────────────────────────────────
-- CONSENTS — append-only record of explicit user consent actions
-- (L221-28 1° CConso waiver, DPA, marketing opt-in, etc.)
-- Defined AFTER payments in migrations/003, redefined here in canonical
-- order so fresh installs create consents BEFORE payments references it.
-- If you rebuild the schema from scratch, move this block above payments.
-- ───────────────────────────────────────────────────────────────
create table public.consents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_type text not null check (consent_type in (
    'withdrawal_waiver_l221_28',
    'dpa_acceptance',
    'marketing_optin',
    'cookies_nonessential'
  )),
  text_version text not null,
  locale text not null check (locale in ('fr', 'en')),
  inspection_id uuid references public.inspections(id) on delete set null,
  intended_product text,
  checkbox_checked boolean not null default true,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.consents enable row level security;

create policy "Users can read own consents"
  on public.consents for select
  using (auth.uid() = user_id);

create index idx_consents_user on public.consents(user_id);
create index idx_consents_inspection on public.consents(inspection_id);
create index idx_consents_type_version on public.consents(consent_type, text_version);

-- ───────────────────────────────────────────────────────────────
-- Updated_at trigger for all tables with updated_at column
-- ───────────────────────────────────────────────────────────────
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.inspections
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.payments
  for each row execute function public.update_updated_at();
