-- ═══════════════════════════════════════════════════════════════
-- Migration 002: Owner details, contract info, multi-tenant,
--                property characteristics, zone tendue
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- TENANTS — up to 3 tenants per inspection (single, couple, coloc)
-- ───────────────────────────────────────────────────────────────
create table public.tenants (
  id uuid primary key default uuid_generate_v4(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.tenants enable row level security;

create policy "Users can read own tenants"
  on public.tenants for select
  using (
    exists (
      select 1 from public.inspections
      where inspections.id = tenants.inspection_id
      and inspections.user_id = auth.uid()
    )
  );

create policy "Users can create tenants"
  on public.tenants for insert
  with check (
    exists (
      select 1 from public.inspections
      where inspections.id = tenants.inspection_id
      and inspections.user_id = auth.uid()
    )
  );

create policy "Users can update own tenants"
  on public.tenants for update
  using (
    exists (
      select 1 from public.inspections
      where inspections.id = tenants.inspection_id
      and inspections.user_id = auth.uid()
    )
  );

create policy "Users can delete own tenants"
  on public.tenants for delete
  using (
    exists (
      select 1 from public.inspections
      where inspections.id = tenants.inspection_id
      and inspections.user_id = auth.uid()
    )
  );

create index idx_tenants_inspection on public.tenants(inspection_id);

-- ───────────────────────────────────────────────────────────────
-- INSPECTIONS — add owner, contract, and property fields
-- ───────────────────────────────────────────────────────────────

-- Owner details (individual or company)
alter table public.inspections add column owner_type text not null default 'individual';
  -- 'individual' or 'company'
alter table public.inspections add column owner_name text;
  -- Person name or company name
alter table public.inspections add column owner_company_name text;
  -- If individual acting for a company / management agency
alter table public.inspections add column owner_email text;
alter table public.inspections add column owner_phone text;
alter table public.inspections add column owner_address text;
  -- Postal address for formal letters

-- Drop old single landlord fields (replaced by owner_*)
-- Keep landlord_name and landlord_email temporarily for backward compat
-- We'll migrate data later if needed

-- Contract details
alter table public.inspections add column furnished boolean not null default false;
alter table public.inspections add column lease_start_date date;
alter table public.inspections add column lease_end_date date;
  -- null = open-ended (CDI)
alter table public.inspections add column notice_period_months integer not null default 3;
  -- 1 or 3 months
alter table public.inspections add column monthly_rent_cents integer;
alter table public.inspections add column monthly_charges_cents integer;
alter table public.inspections add column contract_pdf_r2_key text;
  -- R2 key for uploaded contract PDF (stored, not parsed)

-- Property characteristics
alter table public.inspections add column property_type text not null default 'appartement';
  -- 'appartement' or 'maison'
alter table public.inspections add column surface_m2 numeric(6,1);
alter table public.inspections add column main_rooms integer;
  -- nombre de pièces principales
alter table public.inspections add column zone_tendue boolean not null default false;
  -- auto-detected from postal code
alter table public.inspections add column commune_insee text;
  -- INSEE code for zone tendue lookup

-- Inspection type
alter table public.inspections add column inspection_type text not null default 'move_in';
  -- 'move_in' (état des lieux d'entrée) or 'move_out' (état des lieux de sortie)

-- Dispute purchased flag
alter table public.inspections add column dispute_purchased boolean not null default false;

-- Post-inspection email tracking
alter table public.inspections add column tenant_email_sent_at timestamptz;
alter table public.inspections add column owner_email_sent_at timestamptz;

-- ───────────────────────────────────────────────────────────────
-- ELEMENT RATINGS — per-element rating within each room
-- Maps to the 10 standard + room-specific elements
-- ───────────────────────────────────────────────────────────────
create table public.element_ratings (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  element_key text not null,
    -- e.g. 'portes', 'sol', 'murs', 'baignoire_douche', 'four'
  rating text not null default 'B',
    -- TB (très bon), B (bon), M (moyen), MV (mauvais)
  comment text,
    -- tenant's remark on this element
  photo_ids uuid[],
    -- references to photos for this specific element
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(room_id, element_key)
);

alter table public.element_ratings enable row level security;

create policy "Users can read own element ratings"
  on public.element_ratings for select
  using (
    exists (
      select 1 from public.rooms
      join public.inspections on inspections.id = rooms.inspection_id
      where rooms.id = element_ratings.room_id
      and inspections.user_id = auth.uid()
    )
  );

create policy "Users can create element ratings"
  on public.element_ratings for insert
  with check (
    exists (
      select 1 from public.rooms
      join public.inspections on inspections.id = rooms.inspection_id
      where rooms.id = element_ratings.room_id
      and inspections.user_id = auth.uid()
    )
  );

create policy "Users can update own element ratings"
  on public.element_ratings for update
  using (
    exists (
      select 1 from public.rooms
      join public.inspections on inspections.id = rooms.inspection_id
      where rooms.id = element_ratings.room_id
      and inspections.user_id = auth.uid()
    )
  );

create index idx_element_ratings_room on public.element_ratings(room_id);

create trigger set_updated_at before update on public.element_ratings
  for each row execute function public.update_updated_at();
