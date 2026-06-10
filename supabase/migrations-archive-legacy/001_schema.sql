-- Tenu.World database schema
-- Run via Supabase Dashboard > SQL Editor or supabase db push

-- Users profile (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  locale text not null default 'en',
  jurisdiction text check (jurisdiction in ('fr', 'uk')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, locale)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'locale', 'en')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Inspections
create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  jurisdiction text not null check (jurisdiction in ('fr', 'uk')),
  address text not null,
  move_in_date date,
  move_out_date date,
  status text not null default 'draft' check (status in ('draft', 'capturing', 'submitted', 'scanned', 'disputed', 'closed')),
  stripe_payment_id text,
  dispute_purchased boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inspections enable row level security;
create policy "Users read own inspections" on public.inspections
  for select using (auth.uid() = user_id);
create policy "Users create inspections" on public.inspections
  for insert with check (auth.uid() = user_id);
create policy "Users update own inspections" on public.inspections
  for update using (auth.uid() = user_id);

-- Rooms within an inspection
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  room_type text not null,
  label text,
  sort_order int not null default 0,
  risk_level text check (risk_level in ('low', 'medium', 'high')),
  risk_score numeric(3,2),
  risk_notes jsonb,
  estimated_deduction_eur numeric(8,2),
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;
create policy "Users read own rooms" on public.rooms
  for select using (
    exists (select 1 from public.inspections i where i.id = inspection_id and i.user_id = auth.uid())
  );
create policy "Users create rooms" on public.rooms
  for insert with check (
    exists (select 1 from public.inspections i where i.id = inspection_id and i.user_id = auth.uid())
  );
create policy "Users update own rooms" on public.rooms
  for update using (
    exists (select 1 from public.inspections i where i.id = inspection_id and i.user_id = auth.uid())
  );

-- Photos
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  r2_key text not null,
  r2_url text,
  mime_type text not null default 'image/jpeg',
  size_bytes int,
  captured_at timestamptz not null default now(),
  sort_order int not null default 0
);

alter table public.photos enable row level security;
create policy "Users read own photos" on public.photos
  for select using (
    exists (
      select 1 from public.rooms r
      join public.inspections i on i.id = r.inspection_id
      where r.id = room_id and i.user_id = auth.uid()
    )
  );
create policy "Users create photos" on public.photos
  for insert with check (
    exists (
      select 1 from public.rooms r
      join public.inspections i on i.id = r.inspection_id
      where r.id = room_id and i.user_id = auth.uid()
    )
  );
create policy "Users delete own photos" on public.photos
  for delete using (
    exists (
      select 1 from public.rooms r
      join public.inspections i on i.id = r.inspection_id
      where r.id = room_id and i.user_id = auth.uid()
    )
  );

-- Dispute letters
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  letter_locale text not null check (letter_locale in ('fr', 'en')),
  letter_body text not null,
  explanation_body text,
  explanation_locale text,
  pdf_url text,
  created_at timestamptz not null default now()
);

alter table public.disputes enable row level security;
create policy "Users read own disputes" on public.disputes
  for select using (
    exists (select 1 from public.inspections i where i.id = inspection_id and i.user_id = auth.uid())
  );

-- Outcome tracking (14-day follow-up)
create table if not exists public.outcomes (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  deposit_returned boolean,
  amount_returned_eur numeric(8,2),
  amount_deducted_eur numeric(8,2),
  notes text,
  survey_sent_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.outcomes enable row level security;
create policy "Users read own outcomes" on public.outcomes
  for select using (
    exists (select 1 from public.inspections i where i.id = inspection_id and i.user_id = auth.uid())
  );
