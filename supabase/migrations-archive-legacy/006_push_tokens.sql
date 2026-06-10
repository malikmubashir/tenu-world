-- Tenu.World — device push tokens
-- One row per (user, device). Multiple devices per user supported.
-- Platform is "ios" or "android" — drives APNs vs FCM v1 routing.
-- Server reads via admin client (bypasses RLS). Users can only
-- insert/delete their own tokens.

create table if not exists public.device_tokens (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  token       text        not null,
  platform    text        not null check (platform in ('ios', 'android')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint device_tokens_user_token_unique unique (user_id, token)
);

alter table public.device_tokens enable row level security;

create policy "Users insert own tokens" on public.device_tokens
  for insert with check (auth.uid() = user_id);

create policy "Users delete own tokens" on public.device_tokens
  for delete using (auth.uid() = user_id);

-- No SELECT policy — tokens are only read server-side via admin client.
