/**
 * Dispute-letter eligibility gate.
 *
 * Moves the "should this user be allowed to buy a dispute letter"
 * decision up the funnel: pricing page, checkout API, and report
 * page all call the same helper so the gate is consistent.
 *
 * Why not let anyone buy? Two product-integrity reasons:
 *   1. If the scan produced no usable evidence (quality_flag =
 *      "insufficient_evidence"), the Sonnet prompt will refuse to
 *      draft — we'd charge then fail to deliver. Bad refund story.
 *   2. If our own scan assessment says the full deposit is
 *      legitimately deductible (refundable_eur === 0), the letter
 *      has nothing defensible to argue. Letting the user pay €20
 *      for a weak letter is a trust hit.
 *
 * Shape of risk_score JSONB (set by /api/ai/scan):
 *   { v2: RiskScanOutputV2, overallRisk, totalEstimatedDeductionEur, scanTimestamp, telemetry }
 */
import type { RiskScanOutputV2 } from "./types/risk-scan";

export type DisputeIneligibleReason =
  | "NO_SCAN"
  | "SCAN_V1_ONLY"
  | "INSUFFICIENT_EVIDENCE"
  | "NOTHING_TO_CONTEST";

export interface DisputeEligibility {
  eligible: boolean;
  reason: DisputeIneligibleReason | null;
  total_deduction_eur: number | null;
  deposit_amount_eur: number | null;
  refundable_eur: number | null;
  quality_flag: "ok" | "insufficient_evidence" | null;
  // Human-readable hint, FR + EN. UI decides which to render.
  message_fr: string;
  message_en: string;
}

const MESSAGES: Record<
  DisputeIneligibleReason | "OK",
  { fr: string; en: string }
> = {
  OK: {
    fr: "Votre scan permet de justifier une lettre de contestation.",
    en: "Your scan supports a dispute letter.",
  },
  NO_SCAN: {
    fr: "Lancez d'abord le scan IA avant de commander la lettre.",
    en: "Run your AI scan before ordering a dispute letter.",
  },
  SCAN_V1_ONLY: {
    fr: "Scan obsolète. Relancez le scan IA.",
    en: "Outdated scan. Please re-run the AI scan.",
  },
  INSUFFICIENT_EVIDENCE: {
    fr: "Preuves photo insuffisantes pour une lettre crédible. Ajoutez des photos et relancez le scan.",
    en: "Photo evidence is too thin for a credible letter. Add photos and re-run the scan.",
  },
  NOTHING_TO_CONTEST: {
    fr: "Notre analyse indique que les déductions couvrent la totalité du dépôt. Une lettre de contestation ne tiendrait pas.",
    en: "Our analysis shows deductions match the full deposit. A dispute letter would have nothing to argue.",
  },
};

/**
 * Evaluate dispute eligibility from the persisted risk_score JSONB.
 * Pass the raw jsonb value straight from Supabase — we unwrap the v2 ourselves.
 */
export function evaluateDisputeEligibility(
  riskScoreJsonb: unknown,
): DisputeEligibility {
  const jsonb = riskScoreJsonb as {
    v2?: RiskScanOutputV2 | null;
  } | null;

  if (!jsonb) {
    return ineligible("NO_SCAN", null);
  }

  const v2 = jsonb.v2 ?? null;
  if (!v2) {
    return ineligible("SCAN_V1_ONLY", null);
  }

  const quality = v2.meta?.quality_flag ?? null;
  if (quality === "insufficient_evidence") {
    return ineligible("INSUFFICIENT_EVIDENCE", v2);
  }

  // refundable_eur is computed by the scan as max(0, deposit - deductions).
  // When deposit isn't known, the scan defaults deposit_amount_eur to 0,
  // which makes refundable also 0. In that case we fall back to letting
  // the user through — absence of deposit info shouldn't block the sale.
  const depositKnown = v2.deposit_amount_eur > 0;
  if (depositKnown && v2.refundable_eur <= 0) {
    return ineligible("NOTHING_TO_CONTEST", v2);
  }

  return {
    eligible: true,
    reason: null,
    total_deduction_eur: v2.total_deduction_eur,
    deposit_amount_eur: v2.deposit_amount_eur,
    refundable_eur: v2.refundable_eur,
    quality_flag: v2.meta.quality_flag,
    message_fr: MESSAGES.OK.fr,
    message_en: MESSAGES.OK.en,
  };
}

function ineligible(
  reason: DisputeIneligibleReason,
  v2: RiskScanOutputV2 | null,
): DisputeEligibility {
  return {
    eligible: false,
    reason,
    total_deduction_eur: v2?.total_deduction_eur ?? null,
    deposit_amount_eur: v2?.deposit_amount_eur ?? null,
    refundable_eur: v2?.refundable_eur ?? null,
    quality_flag: v2?.meta.quality_flag ?? null,
    message_fr: MESSAGES[reason].fr,
    message_en: MESSAGES[reason].en,
  };
}
