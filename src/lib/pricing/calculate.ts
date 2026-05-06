/**
 * Async pricing wrapper with live FX conversion.
 *
 * calculatePrice() in stripe.ts is synchronous and EUR-denominated. This
 * module wraps it: for FR it's a no-op passthrough; for UK it fetches the
 * live EUR/GBP rate and converts all three price fields.
 *
 * Import this instead of calculatePrice() anywhere a price is shown to the
 * user or passed to Stripe for GBP sessions.
 */

import {
  calculatePrice,
  type InspectionRoom,
  type PriceBreakdown,
} from "@/lib/payments/stripe";
import { getLatestEurGbp, convertEurCentsToGbpCents } from "./fx";

export interface PriceBreakdownWithFx extends PriceBreakdown {
  /** EUR/GBP rate used for conversion. 1.0 for EUR jurisdictions. */
  fxRate: number;
}

/**
 * Returns pricing in the correct currency for the jurisdiction.
 *
 * - FR: amounts stay in EUR cents, fxRate = 1.0.
 * - UK: amounts converted to GBP pence using the most recent ECB rate.
 */
export async function calculatePriceWithFx(
  rooms: InspectionRoom[],
  jurisdiction: "fr" | "uk",
): Promise<PriceBreakdownWithFx> {
  const base = calculatePrice(rooms, jurisdiction);

  if (jurisdiction !== "uk") {
    return { ...base, fxRate: 1.0 };
  }

  const rate = await getLatestEurGbp();

  return {
    ...base,
    totalReportPrice:   convertEurCentsToGbpCents(base.totalReportPrice, rate),
    disputeLetterPrice: convertEurCentsToGbpCents(base.disputeLetterPrice, rate),
    exitOnlyPrice:      convertEurCentsToGbpCents(base.exitOnlyPrice, rate),
    currency:           "gbp",
    fxRate:             rate,
  };
}
