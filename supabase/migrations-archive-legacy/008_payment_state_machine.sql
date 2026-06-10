-- 008_payment_state_machine.sql
-- 2026-06-10 — #T145 scan/payment state machine fix (p:0, pre-F&F invites)
--
-- Root cause: migration 001 shipped a CHECK constraint on inspections.status
-- that does NOT include 'paid', yet the Stripe webhook
-- (src/app/api/webhooks/stripe/route.ts) sets status='paid' on
-- checkout.session.completed. Verified against the live project
-- (umvcjasalzcgtfwsjbfw / eu-west-2) on 2026-06-10:
--   inspections_status_check = ('draft','capturing','submitted','scanned',
--                               'disputed','closed')
-- Consequence: the webhook's paid-unlock UPDATE violates the constraint,
-- the webhook returns 500, and Stripe retries indefinitely — payment is
-- recorded but the report never unlocks.
--
-- This migration completes the machine:
--   draft → capturing → submitted → paid → scanning → scanned → disputed → closed
--
-- 'paid'     — set by the Stripe webhook (service role) after checkout.
-- 'scanning' — transient claim state set atomically by /api/ai/scan so a
--              concurrent double-POST cannot trigger two Haiku runs
--              (double spend). Reverted to the prior status on scan failure.
--
-- The live inspections table is empty as of 2026-06-10, so swapping the
-- constraint is data-safe.

alter table public.inspections
  drop constraint if exists inspections_status_check;

alter table public.inspections
  add constraint inspections_status_check
  check (status in (
    'draft',
    'capturing',
    'submitted',
    'paid',
    'scanning',
    'scanned',
    'disputed',
    'closed'
  ));

-- ─────────────────────────────────────────────────────────────────────
-- Webhook idempotency backstops (Stripe retries events at-least-once).
-- The webhook now checks-before-insert in application code; these unique
-- indexes are the database-level guarantee the webhook comments flagged
-- as "tracked for schema v1.1".
-- ─────────────────────────────────────────────────────────────────────

create unique index if not exists uq_payments_stripe_checkout_session
  on public.payments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index if not exists uq_dispute_letters_stripe_payment
  on public.dispute_letters (stripe_payment_id)
  where stripe_payment_id is not null;
