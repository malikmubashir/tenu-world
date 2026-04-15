"use server";

import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}

export type Product = "scan" | "dispute";

const PRODUCTS: Record<Product, { name: string; priceEur: number; description: string }> = {
  scan: {
    name: "Tenu AI Risk Scan",
    priceEur: 1500, // €15.00 in cents
    description: "AI-powered photo analysis of your rental property with risk scores and deduction estimates",
  },
  dispute: {
    name: "Tenu Dispute Letter",
    priceEur: 2000, // €20.00 in cents
    description: "Legally-informed dispute letter tailored to your jurisdiction (FR or UK)",
  },
};

interface CheckoutParams {
  product: Product;
  inspectionId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(
  params: CheckoutParams,
): Promise<{ sessionId: string; url: string }> {
  const productInfo = PRODUCTS[params.product];
  if (!productInfo) throw new Error(`Unknown product: ${params.product}`);

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: params.userEmail,
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: productInfo.priceEur,
          product_data: {
            name: productInfo.name,
            description: productInfo.description,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      inspectionId: params.inspectionId,
      userId: params.userId,
      product: params.product,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

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

export async function getProductInfo(product: Product) {
  return PRODUCTS[product];
}
