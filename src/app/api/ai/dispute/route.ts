import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateDisputeLetterV2,
  DisputeError,
} from "@/lib/ai/dispute-letter";
import type {
  DisputeLetterInput,
  DisputeRecipient,
  DisputeTenant,
  DisputeRecipientRole,
  DisputeTone,
} from "@/lib/ai/types/dispute-letter";
import type { RiskScanOutputV2 } from "@/lib/ai/types/risk-scan";

interface RequestBody {
  inspectionId: string;
  tone?: DisputeTone;
  recipient?: {
    role?: DisputeRecipientRole;
    full_name?: string;
    address_lines?: string[];
    reference?: string | null;
  };
  tenantRationale?: string | null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const {
    inspectionId,
    tone = "conciliant",
    recipient,
    tenantRationale = null,
  } = body;
  if (!inspectionId) {
    return NextResponse.json(
      { error: "inspectionId required" },
      { status: 400 },
    );
  }

  // Inspection must belong to the caller and have a paid dispute add-on.
  // The paid-gate today is: an existing dispute_letters row with
  // stripe_payment_id set (the Stripe webhook inserts that row before we
  // generate). We rely on inspections.risk_score.v2 for the scan payload
  // rather than reconstructing from the rooms table.
  const { data: inspection, error: inspErr } = await supabase
    .from("inspections")
    .select(
      "id, user_id, status, jurisdiction, address_formatted, address_line1, city, postal_code, country_code, move_in_date, move_out_date, deposit_amount_cents, deposit_currency, landlord_name, risk_score",
    )
    .eq("id", inspectionId)
    .single();

  if (inspErr || !inspection || inspection.user_id !== user.id) {
    return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
  }

  if (inspection.status !== "scanned") {
    return NextResponse.json(
      { error: "Inspection must be scanned before generating a dispute letter" },
      { status: 409 },
    );
  }

  // Paid-gate: Stripe webhook (task #25) inserts a dispute_letters row with
  // stripe_payment_id before calling here. Until that pipeline is wired, we
  // accept any request from the inspection owner — the webhook will be the
  // real gate once #25 lands. TODO(#25): enforce once Stripe wire-up is live.
  const { data: existingPaid } = await supabase
    .from("dispute_letters")
    .select("id, stripe_payment_id, status")
    .eq("inspection_id", inspectionId)
    .eq("user_id", user.id)
    .not("stripe_payment_id", "is", null)
    .maybeSingle();
  const paymentGateBypass = process.env.DISPUTE_PAYMENT_GATE_BYPASS === "1";
  if (!existingPaid && !paymentGateBypass) {
    return NextResponse.json(
      { error: "Dispute letter requires purchase" },
      { status: 402 },
    );
  }

  const scanV2 = (inspection.risk_score as { v2?: RiskScanOutputV2 } | null)?.v2;
  if (!scanV2) {
    return NextResponse.json(
      { error: "Scan v2 payload missing — rerun /api/ai/scan" },
      { status: 409 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, preferred_language")
    .eq("id", user.id)
    .single();

  const jurisdiction: "FR" | "UK" = inspection.jurisdiction === "uk" ? "UK" : "FR";
  const userLocale: "fr" | "en" =
    profile?.preferred_language === "fr"
      ? "fr"
      : profile?.preferred_language === "en"
        ? "en"
        : jurisdiction === "FR"
          ? "fr"
          : "en";

  const tenancyLines = buildTenancyLines({
    address_formatted: inspection.address_formatted,
    address_line1: inspection.address_line1,
    city: inspection.city,
    postal_code: inspection.postal_code,
    country_code: inspection.country_code,
    jurisdiction,
  });

  const depositEur = (inspection.deposit_amount_cents ?? 0) / 100;
  const depositCurrency: "EUR" | "GBP" =
    inspection.deposit_currency === "GBP" ? "GBP" : "EUR";

  const defaultRecipient: DisputeRecipient = {
    role: "landlord",
    full_name:
      inspection.landlord_name ??
      (jurisdiction === "FR" ? "Bailleur" : "Landlord"),
    address_lines: tenancyLines,
    reference: null,
  };

  const finalRecipient: DisputeRecipient = {
    role: recipient?.role ?? defaultRecipient.role,
    full_name: recipient?.full_name ?? defaultRecipient.full_name,
    address_lines:
      recipient?.address_lines && recipient.address_lines.length >= 3
        ? recipient.address_lines.slice(0, 7)
        : defaultRecipient.address_lines,
    reference: recipient?.reference ?? null,
  };

  const tenant: DisputeTenant = {
    full_name: profile?.full_name ?? (jurisdiction === "FR" ? "Le locataire" : "The tenant"),
    address_lines: tenancyLines,
    correspondence_lines: tenancyLines,
    move_in_date: inspection.move_in_date ?? "",
    move_out_date: inspection.move_out_date ?? "",
    deposit_amount_eur: depositEur,
    deposit_currency: depositCurrency,
  };

  const input: DisputeLetterInput = {
    inspectionId,
    userLocale,
    jurisdiction,
    scan: scanV2,
    recipient: finalRecipient,
    tenant,
    tenantRationale: sanitiseRationale(tenantRationale),
    tone,
  };

  let result;
  try {
    result = await generateDisputeLetterV2(input);
  } catch (err) {
    if (err instanceof DisputeError) {
      const http = httpForCode(err.code);
      return NextResponse.json(
        { error: err.code, details: err.message },
        { status: http },
      );
    }
    return NextResponse.json(
      {
        error: "INTERNAL",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }

  const v2 = result.v2;
  if (!v2) {
    // Should never happen: v2 is always set when generateDisputeLetterV2 returns.
    return NextResponse.json(
      { error: "INTERNAL", details: "v2 payload missing from result" },
      { status: 500 },
    );
  }

  const letterType =
    finalRecipient.role === "cdc"
      ? "CDC"
      : finalRecipient.role === "tds"
        ? "TDS"
        : finalRecipient.role === "dps"
          ? "DPS"
          : "LANDLORD";

  const patch = {
    status: "generated",
    letter_type: letterType,
    letter_language: v2.locale.toUpperCase(),
    letter_content: v2.body,
    user_explanation: null,
    user_explanation_language: null,
    deduction_items: v2.items_table as unknown as Record<string, unknown>,
    completed_at: new Date().toISOString(),
  };

  let disputeId: string;
  if (existingPaid?.id) {
    // Webhook pre-inserted the row; update it in place.
    const { data: updated, error: updateError } = await supabase
      .from("dispute_letters")
      .update(patch)
      .eq("id", existingPaid.id)
      .select("id")
      .single();
    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message ?? "update failed" },
        { status: 500 },
      );
    }
    disputeId = updated.id;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("dispute_letters")
      .insert({
        inspection_id: inspectionId,
        user_id: user.id,
        ...patch,
      })
      .select("id")
      .single();
    if (insertError || !inserted) {
      return NextResponse.json(
        { error: insertError?.message ?? "insert failed" },
        { status: 500 },
      );
    }
    disputeId = inserted.id;
  }

  return NextResponse.json({
    disputeId,
    locale: result.locale,
    letter: {
      header: v2.header,
      body: v2.body,
      items_table: v2.items_table,
      closing: v2.closing,
      disclaimer: v2.disclaimer,
      meta: v2.meta,
    },
    costEur: result.costEur,
    modelUsed: result.modelUsed,
    attemptCount: result.attemptCount,
  });
}

function httpForCode(code: DisputeError["code"]): number {
  switch (code) {
    case "INVALID_INPUT":
      return 400;
    case "SCAN_NOT_FOUND":
      return 404;
    case "SCAN_INSUFFICIENT_EVIDENCE":
      return 409;
    case "BUDGET_EXCEEDED":
      return 402;
    case "MODEL_TIMEOUT":
      return 504;
    case "MODEL_REFUSAL":
    case "SCHEMA_INVALID_AFTER_RETRIES":
    case "ITEMS_SUM_MISMATCH_AFTER_RETRIES":
    case "UPSTREAM_ERROR":
    default:
      return 502;
  }
}

// Normalise tenancy address into 3..7 lines. DisputeAddressBlockSchema caps at 7.
function buildTenancyLines(args: {
  address_formatted: string | null;
  address_line1: string | null;
  city: string | null;
  postal_code: string | null;
  country_code: string | null;
  jurisdiction: "FR" | "UK";
}): string[] {
  const line1 = args.address_line1 ?? args.address_formatted ?? "Adresse non communiquee";
  const line2 = [args.postal_code, args.city].filter(Boolean).join(" ").trim();
  const country =
    args.country_code ??
    (args.jurisdiction === "UK" ? "United Kingdom" : "France");
  const lines = [line1, line2 || "-", country];
  return lines.map((l) => l.slice(0, 200));
}

// Tenant rationale is the highest-risk injection vector (spec section 11).
// Cap length, strip HTML angles, keep newlines so the fence still scans as text.
function sanitiseRationale(input: string | null): string | null {
  if (input == null) return null;
  const stripped = input.replace(/[<>]/g, "").slice(0, 500);
  return stripped.length > 0 ? stripped : null;
}
