-- ═══════════════════════════════════════════════════════════════
-- Migration 004: Tax columns on payments
--
-- Captures Stripe Tax output so we can reconcile VAT declarations
-- (French TVA via OSS / guichet unique for cross-border EU B2C).
--
-- Every paid transaction stores:
--   - tax_amount_cents: the VAT portion, in cents, of amount_total
--   - tax_rate_bps: basis points (2000 = 20%), effective rate applied
--   - tax_country: ISO 3166-1 alpha-2 of the billing address Stripe
--                  used for tax determination
--
-- Stripe returns these on session.total_details.amount_tax and
-- session.customer_details.address.country. Rate is computed as
-- round(amount_tax * 10000 / amount_subtotal) bps so we don't have
-- to parse total_details.breakdown.taxes.
--
-- Run this in Supabase SQL Editor after 003.
-- ═══════════════════════════════════════════════════════════════

alter table public.payments
  add column tax_amount_cents integer not null default 0,
  add column tax_rate_bps integer,
  add column tax_country text;

create index idx_payments_tax_country on public.payments(tax_country);
