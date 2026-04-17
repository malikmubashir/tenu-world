/**
 * Stripe payment utilities — server-side only.
 * Imported by API routes, never by client components.
 */

import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}

/* ------------------------------------------------------------------ */
/*  Pricing model — 5-tier grid locked 2026-04-17                     */
/*  Tier = number of pièces principales (salon + chambres + salle à   */
/*  manger). Kitchen, bathroom, WC, entrée are NOT principales in the */
/*  French classification. Price scales: +€5 per tier above T1.       */
/*                                                                    */
/*  Colocation semantics (NOT priced here):                           */
/*    - Each colocataire in the same flat buys their own inspection   */
/*      at the flat's tier price. A T4 with 3 colocs ⇒ 3 × €30.       */
/*    - A couple sharing one tenancy counts as ONE tenant — single    */
/*      purchase at the flat's tier (studio couple = €15 total).      */
/*    - This code path prices ONE inspection. Composition lives in    */
/*      the invite-roommate flow (post-launch).                       */
/* ------------------------------------------------------------------ */

/** Rooms that count toward the tier (pièces principales). */
const PRINCIPAL_ROOM_TYPES = ["salon", "chambre", "salle_a_manger"] as const;

/** Service rooms — inspected but not counted toward tier. */
const SERVICE_ROOM_TYPES = [
  "entree",
  "cuisine",
  "salle_de_bain",
  "wc",
] as const;

/** Parties privatives — cave/parking/etc. Not counted toward tier. */
const PARTIE_PRIVATIVE_TYPES = [
  "cave",
  "parking",
  "jardin",
  "balcon",
  "terrasse",
] as const;

export type Tier = "t1" | "t2" | "t3" | "t4" | "t5_maison";
type Jurisdiction = "fr" | "uk";

/** Price constants in cents. TTC (VAT-inclusive) at FR 20%. */
const TIER_PRICE_CENTS: Record<Tier, number> = {
  t1: 1500,        // €15 — studio / T1
  t2: 2000,        // €20 — T2
  t3: 2500,        // €25 — T3
  t4: 3000,        // €30 — T4
  t5_maison: 3500, // €35 — T5+ or house
};

const DISPUTE_LETTER_CENTS = 2000; // €20 — post-verdict add-on
const EXIT_ONLY_CENTS = 2500;      // €25 — cold exit scan, any size

const CURRENCY: Record<Jurisdiction, string> = {
  fr: "eur",
  uk: "gbp",
};

const TIER_LABELS: Record<Tier, string> = {
  t1: "Studio / T1",
  t2: "T2",
  t3: "T3",
  t4: "T4",
  t5_maison: "T5+ / Maison",
};

/* ------------------------------------------------------------------ */
/*  Tier detection + price calculation                                */
/* ------------------------------------------------------------------ */

export interface InspectionRoom {
  type: string;
  label?: string;
}

export interface PriceBreakdown {
  tier: Tier;
  tierLabel: string;
  principalRoomCount: number;
  serviceRoomCount: number;
  partiePrivativeCount: number;
  totalReportPrice: number;   // cents
  disputeLetterPrice: number; // cents
  exitOnlyPrice: number;      // cents
  currency: string;
}

/**
 * Count pièces principales (salon + chambres + salle à manger).
 * Returns the tier corresponding to that count: 1→t1, 2→t2, 3→t3,
 * 4→t4, 5+→t5_maison. Zero principal rooms falls back to t1 (we
 * won't sell sub-T1) so malformed inputs don't crash checkout.
 */
export function determineTier(rooms: InspectionRoom[]): Tier {
  const principalCount = rooms.filter((r) =>
    (PRINCIPAL_ROOM_TYPES as readonly string[]).includes(r.type),
  ).length;

  if (principalCount <= 1) return "t1";
  if (principalCount === 2) return "t2";
  if (principalCount === 3) return "t3";
  if (principalCount === 4) return "t4";
  return "t5_maison";
}

/**
 * Returns the full price breakdown for a single-inspection purchase.
 * Report price is the tier price; no per-room add-ons.
 */
export function calculatePrice(
  rooms: InspectionRoom[],
  jurisdiction: Jurisdiction,
): PriceBreakdown {
  const tier = determineTier(rooms);

  const principalRoomCount = rooms.filter((r) =>
    (PRINCIPAL_ROOM_TYPES as readonly string[]).includes(r.type),
  ).length;
  const serviceRoomCount = rooms.filter((r) =>
    (SERVICE_ROOM_TYPES as readonly string[]).includes(r.type),
  ).length;
  const partiePrivativeCount = rooms.filter((r) =>
    (PARTIE_PRIVATIVE_TYPES as readonly string[]).includes(r.type),
  ).length;

  return {
    tier,
    tierLabel: TIER_LABELS[tier],
    principalRoomCount,
    serviceRoomCount,
    partiePrivativeCount,
    totalReportPrice: TIER_PRICE_CENTS[tier],
    disputeLetterPrice: DISPUTE_LETTER_CENTS,
    exitOnlyPrice: EXIT_ONLY_CENTS,
    currency: CURRENCY[jurisdiction],
  };
}

/* ------------------------------------------------------------------ */
/*  Stripe Checkout — dynamic line items                              */
/* ------------------------------------------------------------------ */

// "exit_only" = cold exit scan for tenants who never captured an entry EDL.
//   Flat €25 regardless of tier (single prompt variant, smaller scope).
// "report_and_dispute" is kept in the union for backward compat but is no
//   longer reachable from the UI — dispute is sold post-scan only.
export type Product =
  | "report"
  | "dispute"
  | "report_and_dispute"
  | "exit_only";

interface CheckoutParams {
  product: Product;
  rooms: InspectionRoom[];
  jurisdiction: Jurisdiction;
  inspectionId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
  /** UUID of the consents row proving the L221-28 1° waiver was ticked. */
  waiverConsentId: string;
}

export async function createCheckoutSession(
  params: CheckoutParams,
): Promise<{ sessionId: string; url: string }> {
  const pricing = calculatePrice(params.rooms, params.jurisdiction);
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  // All locked prices are TTC (tax-inclusive). Stripe Tax needs this
  // declared per line item via tax_behavior so the VAT portion is
  // subtracted from the displayed price rather than added on top.
  const taxBehavior: Stripe.Checkout.SessionCreateParams.LineItem.PriceData["tax_behavior"] =
    "inclusive";

  // Report line item (tier-priced). Included in "report" and the legacy
  // "report_and_dispute" combo. Exit-only has its own flat-price line below.
  if (params.product === "report" || params.product === "report_and_dispute") {
    lineItems.push({
      price_data: {
        currency: pricing.currency,
        unit_amount: pricing.totalReportPrice,
        tax_behavior: taxBehavior,
        product_data: {
          name: `Tenu Inspection Report — ${pricing.tierLabel}`,
          description: buildReportDescription(pricing),
        },
      },
      quantity: 1,
    });
  }

  // Exit-only SKU. Flat €25, no entry-EDL record required.
  if (params.product === "exit_only") {
    lineItems.push({
      price_data: {
        currency: pricing.currency,
        unit_amount: pricing.exitOnlyPrice,
        tax_behavior: taxBehavior,
        product_data: {
          name: "Tenu Exit Inspection (cold)",
          description: "AI scan of your exit EDL without a prior entry record",
        },
      },
      quantity: 1,
    });
  }

  // Dispute letter line item (post-verdict add-on)
  if (params.product === "dispute" || params.product === "report_and_dispute") {
    lineItems.push({
      price_data: {
        currency: pricing.currency,
        unit_amount: pricing.disputeLetterPrice,
        tax_behavior: taxBehavior,
        product_data: {
          name: "Tenu Dispute Letter",
          description: "Formal dispute letter for deposit recovery, tailored to your jurisdiction",
        },
      },
      quantity: 1,
    });
  }

  // Stripe Tax toggle. The dashboard-side config (#37) must be complete
  // before this is flipped on in prod, otherwise the API call errors.
  // Default off so local / staging environments don't explode.
  const stripeTaxEnabled = process.env.ENABLE_STRIPE_TAX === "true";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: params.userEmail,
    line_items: lineItems,
    // Stripe Tax needs a billing address to compute the right rate per
    // jurisdiction (FR 20%, OSS rates for other EU B2C, 0% outside EU
    // until we register there).
    billing_address_collection: stripeTaxEnabled ? "required" : "auto",
    automatic_tax: { enabled: stripeTaxEnabled },
    metadata: {
      inspectionId: params.inspectionId,
      userId: params.userId,
      product: params.product,
      jurisdiction: params.jurisdiction,
      tier: pricing.tier,
      roomCount: String(params.rooms.length),
      principalRoomCount: String(pricing.principalRoomCount),
      totalCents: String(computeTotalCents(params.product, pricing)),
      // L221-28 1° audit pointer. The webhook persists this onto the
      // payments row so we can prove, per transaction, that the user
      // actively waived their 14-day withdrawal right before we charged.
      waiverConsentId: params.waiverConsentId,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

/* ------------------------------------------------------------------ */
/*  Webhook verification                                              */
/* ------------------------------------------------------------------ */

export async function verifyWebhookSignature(
  body: string,
  signature: string,
): Promise<Stripe.Event> {
  return getStripe().webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function buildReportDescription(pricing: PriceBreakdown): string {
  // Line-item description shown on the Stripe Checkout page. Keep it short;
  // Stripe truncates past ~200 chars and the tier label is already in the
  // product name. We surface the room count so a user with a T3 sees why
  // the tier landed where it did.
  const parts = [`AI deposit-risk scan — ${pricing.tierLabel}`];
  const principalsLabel =
    pricing.principalRoomCount === 1
      ? "1 pièce principale"
      : `${pricing.principalRoomCount} pièces principales`;
  parts.push(principalsLabel);

  if (pricing.serviceRoomCount > 0) {
    parts.push(
      `${pricing.serviceRoomCount} pièce${pricing.serviceRoomCount > 1 ? "s" : ""} de service`,
    );
  }
  if (pricing.partiePrivativeCount > 0) {
    parts.push(
      `${pricing.partiePrivativeCount} partie${pricing.partiePrivativeCount > 1 ? "s" : ""} privative${pricing.partiePrivativeCount > 1 ? "s" : ""}`,
    );
  }
  return parts.join(" · ");
}

/**
 * Total amount in cents for a single checkout, matching the line items
 * pushed onto the Stripe session above. Kept in lockstep with the line-
 * item branches in createCheckoutSession — if you add a new SKU there,
 * add it here too so metadata.totalCents stays truthful for the webhook.
 */
function computeTotalCents(product: Product, pricing: PriceBreakdown): number {
  switch (product) {
    case "report":
      return pricing.totalReportPrice;
    case "dispute":
      return pricing.disputeLetterPrice;
    case "report_and_dispute":
      return pricing.totalReportPrice + pricing.disputeLetterPrice;
    case "exit_only":
      return pricing.exitOnlyPrice;
  }
}
