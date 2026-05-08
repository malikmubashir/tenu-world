import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  disputeInsertFn,
  maybySingleFn,
  paymentsInsertFn,
  inspectionUpdateFn,
} = vi.hoisted(() => {
  const maybySingleFn = vi.fn();
  const disputeInsertFn = vi.fn().mockResolvedValue({ error: null });
  const paymentsInsertFn = vi.fn().mockResolvedValue({ error: null });
  const inspectionUpdateFn = vi.fn().mockResolvedValue({ error: null });
  return { disputeInsertFn, maybySingleFn, paymentsInsertFn, inspectionUpdateFn };
});

vi.mock("@/lib/payments/stripe", () => ({
  verifyWebhookSignature: vi.fn().mockResolvedValue({
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_abc",
        payment_intent: "pi_test_abc",
        amount_total: 2000,
        amount_subtotal: 2000,
        currency: "eur",
        total_details: { amount_tax: 0 },
        customer_details: { address: { country: "FR" } },
        metadata: {
          inspectionId: "insp-1",
          userId: "user-1",
          product: "dispute",
        },
      },
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "dispute_letters") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: maybySingleFn }) }),
          insert: disputeInsertFn,
        };
      }
      if (table === "payments") {
        return { insert: paymentsInsertFn };
      }
      if (table === "inspections") {
        return {
          update: () => ({ eq: inspectionUpdateFn }),
        };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    },
  }),
}));

describe("POST /api/webhooks/stripe — dispute idempotency", () => {
  beforeEach(() => {
    maybySingleFn.mockReset();
    disputeInsertFn.mockReset();
    disputeInsertFn.mockResolvedValue({ error: null });
    paymentsInsertFn.mockReset();
    paymentsInsertFn.mockResolvedValue({ error: null });
    inspectionUpdateFn.mockReset();
    inspectionUpdateFn.mockResolvedValue({ error: null });
  });

  it("inserts dispute_letters exactly once when the same event arrives twice", async () => {
    const { POST } = await import("./route");

    const makeRequest = () =>
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: "raw-body",
        headers: { "stripe-signature": "sig_test" },
      });

    // First call: no existing row → should insert
    maybySingleFn.mockResolvedValueOnce({ data: null });
    const res1 = await POST(makeRequest());
    expect(res1.status).toBe(200);

    // Second call: row already exists → should skip insert
    maybySingleFn.mockResolvedValueOnce({ data: { id: "dl-existing" } });
    const res2 = await POST(makeRequest());
    expect(res2.status).toBe(200);

    expect(disputeInsertFn).toHaveBeenCalledTimes(1);
  });
});
