/**
 * Unit tests for calculatePrice(), determineTier(), createCheckoutSession(),
 * and verifyWebhookSignature() — EX-5
 *
 * These tests run in Node (no browser, no network, no Supabase).
 * They exercise the synchronous pricing logic that drives checkout amounts,
 * and the Stripe SDK wrappers with a mocked Stripe constructor.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Stripe SDK ─────────────────────────────────────────────────────────

const mockSessionCreate = vi.fn();
const mockConstructEvent = vi.fn();

vi.mock("stripe", () => {
  const Stripe = vi.fn(() => ({
    checkout: { sessions: { create: mockSessionCreate } },
    webhooks: { constructEvent: mockConstructEvent },
  }));
  return { default: Stripe };
});

import {
  calculatePrice,
  determineTier,
  createCheckoutSession,
  verifyWebhookSignature,
  type InspectionRoom,
} from "../stripe";

// Room type fixtures
const salon: InspectionRoom   = { type: "salon" };
const chambre: InspectionRoom = { type: "chambre" };
const cuisine: InspectionRoom = { type: "cuisine" };
const sdb: InspectionRoom     = { type: "salle_de_bains" };
const couloir: InspectionRoom = { type: "couloir" };

describe("determineTier", () => {
  it("returns t1 for 0 principal rooms (solo studio)", () => {
    expect(determineTier([cuisine, sdb])).toBe("t1");
  });

  it("returns t1 for exactly 1 principal room", () => {
    expect(determineTier([salon, cuisine, sdb])).toBe("t1");
  });

  it("returns t2 for 2 principal rooms", () => {
    expect(determineTier([salon, chambre, cuisine])).toBe("t2");
  });

  it("returns t3 for 3 principal rooms", () => {
    expect(determineTier([salon, chambre, chambre, cuisine])).toBe("t3");
  });

  it("returns t4 for 4 principal rooms", () => {
    expect(determineTier([salon, chambre, chambre, chambre, sdb])).toBe("t4");
  });

  it("returns t5_maison for 5+ principal rooms", () => {
    expect(determineTier([salon, chambre, chambre, chambre, chambre, sdb])).toBe("t5_maison");
  });

  it("service-only rooms (couloir) do not affect tier", () => {
    expect(determineTier([couloir, couloir, couloir])).toBe("t1");
  });
});

describe("calculatePrice — FR jurisdiction", () => {
  it("t1 report price is 1500 EUR cents (€15.00)", () => {
    const p = calculatePrice([salon, cuisine], "fr");
    expect(p.totalReportPrice).toBe(1500);
    expect(p.tier).toBe("t1");
    expect(p.currency).toBe("eur");
  });

  it("t2 report price is 2000 EUR cents (€20.00)", () => {
    const p = calculatePrice([salon, chambre, cuisine], "fr");
    expect(p.totalReportPrice).toBe(2000);
    expect(p.tier).toBe("t2");
  });

  it("t3 report price is 2500 EUR cents (€25.00)", () => {
    const p = calculatePrice([salon, chambre, chambre, cuisine], "fr");
    expect(p.totalReportPrice).toBe(2500);
    expect(p.tier).toBe("t3");
  });

  it("t4 report price is 3000 EUR cents (€30.00)", () => {
    const p = calculatePrice([salon, chambre, chambre, chambre, sdb], "fr");
    expect(p.totalReportPrice).toBe(3000);
    expect(p.tier).toBe("t4");
  });

  it("t5_maison report price is 3500 EUR cents (€35.00)", () => {
    const p = calculatePrice([salon, chambre, chambre, chambre, chambre, sdb], "fr");
    expect(p.totalReportPrice).toBe(3500);
    expect(p.tier).toBe("t5_maison");
  });

  it("dispute letter price is 2000 EUR cents (€20.00) for any tier", () => {
    const p = calculatePrice([salon, cuisine], "fr");
    expect(p.disputeLetterPrice).toBe(2000);
  });

  it("exit-only price is 2500 EUR cents (€25.00) for any tier", () => {
    const p = calculatePrice([salon, cuisine], "fr");
    expect(p.exitOnlyPrice).toBe(2500);
  });
});

describe("calculatePrice — UK jurisdiction", () => {
  it("currency is gbp for UK", () => {
    const p = calculatePrice([salon, cuisine], "uk");
    expect(p.currency).toBe("gbp");
  });

  it("t1 report price is 1500 GBP pence (£15.00) before FX", () => {
    // calculatePrice is synchronous and EUR-denominated; FX happens in
    // calculatePriceWithFx. Raw UK price uses the same EUR cent values.
    const p = calculatePrice([salon, cuisine], "uk");
    expect(p.totalReportPrice).toBe(1500);
  });
});

// ─── createCheckoutSession ───────────────────────────────────────────────────

const BASE_CHECKOUT_PARAMS = {
  inspectionId: "insp-uuid-001",
  userId: "user-uuid-001",
  userEmail: "tenant@example.com",
  successUrl: "https://tenu.world/success",
  cancelUrl: "https://tenu.world/cancel",
  waiverConsentId: "consent-uuid-001",
  jurisdiction: "fr" as const,
};

describe("createCheckoutSession — report product", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionCreate.mockResolvedValue({
      id: "cs_test_abc123",
      url: "https://checkout.stripe.com/pay/cs_test_abc123",
    });
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
  });

  it("returns sessionId and url from Stripe response", async () => {
    const result = await createCheckoutSession({
      ...BASE_CHECKOUT_PARAMS,
      product: "report",
      rooms: [salon, cuisine],
    });
    expect(result.sessionId).toBe("cs_test_abc123");
    expect(result.url).toBe("https://checkout.stripe.com/pay/cs_test_abc123");
  });

  it("passes correct unit_amount for t1 report", async () => {
    await createCheckoutSession({
      ...BASE_CHECKOUT_PARAMS,
      product: "report",
      rooms: [salon, cuisine],
    });
    const call = mockSessionCreate.mock.calls[0][0];
    const reportItem = call.line_items[0];
    expect(reportItem.price_data.unit_amount).toBe(1500);
    expect(reportItem.price_data.currency).toBe("eur");
  });

  it("passes correct unit_amount for t3 report (2500 cents)", async () => {
    await createCheckoutSession({
      ...BASE_CHECKOUT_PARAMS,
      product: "report",
      rooms: [salon, chambre, chambre, cuisine],
    });
    const call = mockSessionCreate.mock.calls[0][0];
    expect(call.line_items[0].price_data.unit_amount).toBe(2500);
  });

  it("sets metadata.inspectionId and product", async () => {
    await createCheckoutSession({
      ...BASE_CHECKOUT_PARAMS,
      product: "report",
      rooms: [salon, cuisine],
    });
    const call = mockSessionCreate.mock.calls[0][0];
    expect(call.metadata.inspectionId).toBe("insp-uuid-001");
    expect(call.metadata.product).toBe("report");
    expect(call.metadata.waiverConsentId).toBe("consent-uuid-001");
  });

  it("exit_only uses exitOnlyPrice (2500 cents)", async () => {
    await createCheckoutSession({
      ...BASE_CHECKOUT_PARAMS,
      product: "exit_only",
      rooms: [salon, cuisine],
    });
    const call = mockSessionCreate.mock.calls[0][0];
    expect(call.line_items[0].price_data.unit_amount).toBe(2500);
  });

  it("dispute product uses disputeLetterPrice (2000 cents)", async () => {
    await createCheckoutSession({
      ...BASE_CHECKOUT_PARAMS,
      product: "dispute",
      rooms: [salon, cuisine],
    });
    const call = mockSessionCreate.mock.calls[0][0];
    expect(call.line_items[0].price_data.unit_amount).toBe(2000);
  });

  it("report_and_dispute has two line items summing to 3500 cents", async () => {
    await createCheckoutSession({
      ...BASE_CHECKOUT_PARAMS,
      product: "report_and_dispute",
      rooms: [salon, cuisine],
    });
    const call = mockSessionCreate.mock.calls[0][0];
    const total = call.line_items.reduce(
      (sum: number, item: { price_data: { unit_amount: number } }) =>
        sum + item.price_data.unit_amount,
      0,
    );
    expect(call.line_items).toHaveLength(2);
    expect(total).toBe(3500); // 1500 report + 2000 dispute
  });

  it("includes service room count in line-item description", async () => {
    await createCheckoutSession({
      ...BASE_CHECKOUT_PARAMS,
      product: "report",
      rooms: [salon, cuisine, sdb],
    });
    const call = mockSessionCreate.mock.calls[0][0];
    const desc: string = call.line_items[0].price_data.product_data.description;
    expect(desc).toContain("de service");
  });
});

describe("verifyWebhookSignature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_fake";
  });

  it("returns the event from constructEvent", async () => {
    const fakeEvent = { type: "checkout.session.completed", data: {} };
    mockConstructEvent.mockReturnValue(fakeEvent);
    const result = await verifyWebhookSignature("body", "t=1,v1=sig");
    expect(result).toBe(fakeEvent);
  });

  it("propagates errors from constructEvent", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Signature mismatch");
    });
    await expect(verifyWebhookSignature("bad", "bad")).rejects.toThrow("Signature mismatch");
  });
});
