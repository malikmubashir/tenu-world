-- ═══════════════════════════════════════════════════════════════
-- Migration 003: Consents table
--
-- Stores every explicit consent action taken by a user: 14-day
-- withdrawal waiver (L221-28 1° CConso), DPA acceptance, marketing
-- opt-in, future add-ons. One row per consent action, append-only.
--
-- The exact legal text version the user ticked is stored by
-- (consent_type, text_version). The text itself lives in code at
-- src/lib/legal/withdrawal-waiver.ts so Git history is our audit
-- trail for "what the user actually agreed to on that day".
--
-- IP + user_agent captured for dispute defence (burden of proof of
-- active opt-in, L221-28 + GDPR Art. 7.1).
--
-- Run this in Supabase SQL Editor after 002.
-- ═══════════════════════════════════════════════════════════════

create table public.consents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  -- What the user consented to
  consent_type text not null check (consent_type in (
    'withdrawal_waiver_l221_28',
    'dpa_acceptance',
    'marketing_optin',
    'cookies_nonessential'
  )),
  text_version text not null,   -- e.g. 'v1.0-2026-04-17'
  locale text not null check (locale in ('fr', 'en')),

  -- What they were about to pay for (nullable for non-checkout consents)
  inspection_id uuid references public.inspections(id) on delete set null,
  intended_product text,        -- 'entry_t1' | 'exit_only' | 'dispute_letter' | null

  -- Proof of active opt-in
  checkbox_checked boolean not null default true,
  ip_address inet,
  user_agent text,

  created_at timestamptz not null default now()
);

alter table public.consents enable row level security;

-- Users can read their own consents (for transparency and GDPR Art. 15)
create policy "Users can read own consents"
  on public.consents for select
  using (auth.uid() = user_id);

-- Inserts happen from server (service_role) only — no client write policy
-- Append-only: no UPDATE, no DELETE policy. Consents are immutable.

create index idx_consents_user on public.consents(user_id);
create index idx_consents_inspection on public.consents(inspection_id);
create index idx_consents_type_version on public.consents(consent_type, text_version);

-- ───────────────────────────────────────────────────────────────
-- payments: link to the consent row that unlocked the transaction
-- ───────────────────────────────────────────────────────────────
alter table public.payments
  add column waiver_consent_id uuid references public.consents(id) on delete set null;

create index idx_payments_waiver on public.payments(waiver_consent_id);
