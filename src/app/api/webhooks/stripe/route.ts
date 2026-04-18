import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = await verifyWebhookSignature(body, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata as {
      inspectionId?: string;
      userId?: string;
      product?: string;
      waiverConsentId?: string;
    } | null;

    if (!metadata?.inspectionId || !metadata?.product) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    // Service-role client — BYPASSES RLS. Required because Stripe webhook
    // has no user session (no cookies, no bearer token). The anon-keyed
    // server client would have auth.uid() = null and every insert/update
    // on user-scoped tables (payments, inspections, dispute_letters)
    // would be silently denied by RLS.
    const supabase = createAdminClient();

    // Tax fields from Stripe Tax output. When Stripe Tax is disabled
    // these come back as zero/null and we persist them as-is so
    // payments stays a uniform shape.
    const amountTotal = session.amount_total ?? 0;
    const amountTax = session.total_details?.amount_tax ?? 0;
    const amountSubtotal = session.amount_subtotal ?? amountTotal - amountTax;
    const taxRateBps =
      amountSubtotal > 0 ? Math.round((amountTax * 10000) / amountSubtotal) : null;
    const taxCountry =
      session.customer_details?.address?.country ?? null;

    // Record payment in payments table. waiver_consent_id is the audit
    // pointer into the consents table (L221-28 1° proof). Tax fields
    // feed OSS / TVA declarations.
    // Column names aligned with supabase/schema.sql `payments` table.
    // Earlier drafts used stripe_session_id / stripe_payment_intent / product;
    // the canonical schema exposes stripe_checkout_session_id /
    // stripe_payment_intent_id / type. Renamed 2026-04-17.
    const { error: paymentInsertError } = await supabase.from("payments").insert({
      user_id: metadata.userId,
      inspection_id: metadata.inspectionId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      type: metadata.product,
      amount_cents: amountTotal,
      currency: session.currency ?? "eur",
      status: "completed",
      waiver_consent_id: metadata.waiverConsentId ?? null,
      tax_amount_cents: amountTax,
      tax_rate_bps: taxRateBps,
      tax_country: taxCountry,
    });
    if (paymentInsertError) {
      // Return 500 so Stripe retries. Silent failure is the anti-pattern
      // we burned weeks on (consents, 2026-04-18). Never repeat.
      console.error("[stripe-webhook] payments insert failed:", paymentInsertError);
      return NextResponse.json(
        { error: "payments_insert_failed", details: paymentInsertError.message },
        { status: 500 },
      );
    }

    if (
      metadata.product === "report" ||
      metadata.product === "report_and_dispute" ||
      metadata.product === "exit_only"
    ) {
      // Unlock the report: mark as paid, trigger AI pipeline.
      // exit_only follows the same "paid → scan" path; the scan handler
      // branches on whether an entry-EDL record exists.
      const { error: paidUpdateError } = await supabase
        .from("inspections")
        .update({
          status: "paid",
          stripe_payment_id: session.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", metadata.inspectionId);
      if (paidUpdateError) {
        console.error("[stripe-webhook] inspections paid update failed:", paidUpdateError);
        return NextResponse.json(
          { error: "inspection_paid_update_failed", details: paidUpdateError.message },
          { status: 500 },
        );
      }
    }

    if (metadata.product === "dispute" || metadata.product === "report_and_dispute") {
      // Paid-gate contract for /api/ai/dispute v2: a dispute_letters row must
      // exist with stripe_payment_id set BEFORE the generation route runs.
      // We pre-insert the row here; the generation route UPDATEs it in place
      // with letter_content once the Sonnet call returns.
      //
      // Idempotency: Stripe retries webhooks. Check first by stripe_payment_id
      // so replays don't duplicate. (No unique constraint on the column yet;
      // tracked for schema v1.1.)
      const { data: alreadyInserted } = await supabase
        .from("dispute_letters")
        .select("id")
        .eq("stripe_payment_id", session.id)
        .maybeSingle();

      if (!alreadyInserted) {
        const { error: disputeInsertError } = await supabase
          .from("dispute_letters")
          .insert({
            inspection_id: metadata.inspectionId,
            user_id: metadata.userId,
            stripe_payment_id: session.id,
            stripe_amount_cents: session.amount_total ?? 0,
            status: "pending",
          });
        if (disputeInsertError) {
          console.error(
            "[stripe-webhook] dispute_letters insert failed:",
            disputeInsertError,
          );
          return NextResponse.json(
            { error: "dispute_insert_failed", details: disputeInsertError.message },
            { status: 500 },
          );
        }
      }

      // Flip the inspection flag so the report page swaps from "Purchase
      // Dispute Letter" to "Generate Dispute Letter" on reload. Idempotent
      // by design — stripe retries hitting the same row are harmless.
      const { error: disputeFlagError } = await supabase
        .from("inspections")
        .update({
          dispute_purchased: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", metadata.inspectionId);
      if (disputeFlagError) {
        console.error(
          "[stripe-webhook] inspections dispute_purchased update failed:",
          disputeFlagError,
        );
        return NextResponse.json(
          { error: "dispute_flag_update_failed", details: disputeFlagError.message },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
