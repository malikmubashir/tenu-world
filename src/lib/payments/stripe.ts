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
/*  Pricing model — dynamic, per-room                                 */
/*  Based on official French état des lieux structure                  */
/*  See docs/02-Inspection-Spec.md for full spec                      */
/* ------------------------------------------------------------------ */

/** Rooms included in the base package (Studio/T1) */
const BASE_ROOMS = ["entree", "salon", "cuisine", "salle_de_bain", "wc"] as const;

/** Rooms that cost extra when added beyond base allocation */
const CHARGEABLE_ROOM_TYPES = [
  "chambre",
  "salle_de_bain",
  "wc",
  "salle_a_manger",
] as const;

/** Parties privatives — lighter inspection, same price per unit */
const PARTIE_PRIVATIVE_TYPES = [
  "cave",
  "parking",
  "jardin",
  "balcon",
  "terrasse",
] as const;

type Jurisdiction = "fr" | "uk";

/** Price constants in cents */
const PRICING = {
  baseCents: 1500,           // €15 / £15 — Studio/T1
  extraRoomCents: 500,       // €5 / £5 per additional room
  partiePrivativeCents: 500, // €5 / £5 per partie privative
  disputeLetterCents: 2500,  // €25 / £25 per dispute letter
} as const;

const CURRENCY: Record<Jurisdiction, string> = {
  fr: "eur",
  uk: "gbp",
};

/* ------------------------------------------------------------------ */
/*  Room counting and price calculation                               */
/* ------------------------------------------------------------------ */

export interface InspectionRoom {
  type: string;
  label?: string;
}

export interface PriceBreakdown {
  basePrice: number;           // cents
  extraRooms: number;          // count
  extraRoomPrice: number;      // cents
  partiesPrivatives: number;   // count
  partiePrivativePrice: number;// cents
  totalReportPrice: number;    // cents
  disputeLetterPrice: number;  // cents
  currency: string;
}

/**
 * Calculate dynamic price based on rooms selected.
 * Base package includes: entrée, salon, cuisine, 1x salle_de_bain, 1x wc.
 * Extra bedrooms, bathrooms, WCs, dining room: +€5 each.
 * Parties privatives (cave, parking, jardin, balcon, terrasse): +€5 each.
 */
export function calculatePrice(
  rooms: InspectionRoom[],
  jurisdiction: Jurisdiction,
): PriceBreakdown {
  const currency = CURRENCY[jurisdiction];

  // Count how many chargeable extras beyond base
  let extraRooms = 0;
  let partiesPrivatives = 0;

  // Base includes 1 salle_de_bain and 1 wc. Track extras.
  let sdbCount = 0;
  let wcCount = 0;

  for (const room of rooms) {
    const t = room.type;

    if ((PARTIE_PRIVATIVE_TYPES as readonly string[]).includes(t)) {
      partiesPrivatives++;
    } else if (t === "chambre") {
      // All bedrooms are extra (base is a studio with salon as living)
      extraRooms++;
    } else if (t === "salle_de_bain") {
      sdbCount++;
      if (sdbCount > 1) extraRooms++; // first is in base
    } else if (t === "wc") {
      wcCount++;
      if (wcCount > 1) extraRooms++; // first is in base
    } else if (t === "salle_a_manger") {
      extraRooms++; // dining room always extra (only if distinct)
    }
    // entree, salon, cuisine — included in base, no extra charge
  }

  const extraRoomPrice = extraRooms * PRICING.extraRoomCents;
  const partiePrivativePrice = partiesPrivatives * PRICING.partiePrivativeCents;
  const totalReportPrice = PRICING.baseCents + extraRoomPrice + partiePrivativePrice;

  return {
    basePrice: PRICING.baseCents,
    extraRooms,
    extraRoomPrice,
    partiesPrivatives,
    partiePrivativePrice,
    totalReportPrice,
    disputeLetterPrice: PRICING.disputeLetterCents,
    currency,
  };
}

/* ------------------------------------------------------------------ */
/*  Stripe Checkout — dynamic line items                              */
/* ------------------------------------------------------------------ */

export type Product = "report" | "dispute" | "report_and_dispute";

interface CheckoutParams {
  product: Product;
  rooms: InspectionRoom[];
  jurisdiction: Jurisdiction;
  inspectionId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(
  params: CheckoutParams,
): Promise<{ sessionId: string; url: string }> {
  const pricing = calculatePrice(params.rooms, params.jurisdiction);
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  // Report line item (always included)
  if (params.product === "report" || params.product === "report_and_dispute") {
    lineItems.push({
      price_data: {
        currency: pricing.currency,
        unit_amount: pricing.totalReportPrice,
        product_data: {
          name: "Tenu Inspection Report",
          description: buildReportDescription(pricing),
        },
      },
      quantity: 1,
    });
  }

  // Dispute letter line item (optional add-on)
  if (params.product === "dispute" || params.product === "report_and_dispute") {
    lineItems.push({
      price_data: {
        currency: pricing.currency,
        unit_amount: pricing.disputeLetterPrice,
        product_data: {
          name: "Tenu Dispute Letter",
          description: "Formal dispute letter for deposit recovery, tailored to your jurisdiction",
        },
      },
      quantity: 1,
    });
  }

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: params.userEmail,
    line_items: lineItems,
    metadata: {
      inspectionId: params.inspectionId,
      userId: params.userId,
      product: params.product,
      jurisdiction: params.jurisdiction,
      roomCount: String(params.rooms.length),
      totalCents: String(
        pricing.totalReportPrice +
        (params.product !== "report" ? pricing.disputeLetterPrice : 0),
      ),
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
  const parts = ["AI-powered deposit risk report"];
  if (pricing.extraRooms > 0) {
    parts.push(`${pricing.extraRooms} additional room${pricing.extraRooms > 1 ? "s" : ""}`);
  }
  if (pricing.partiesPrivatives > 0) {
    parts.push(`${pricing.partiesPrivatives} annexe${pricing.partiesPrivatives > 1 ? "s" : ""}`);
  }
  return parts.join(" + ");
}
