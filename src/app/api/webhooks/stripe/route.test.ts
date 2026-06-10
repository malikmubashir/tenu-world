import { describe, it, expect, vi, beforeEach } from "vitest";

// #T145 regression suite — Stripe webhook idempotency + state machine.
// Stripe delivers events at-least-once: the payments insert and the
// inspections paid-flip must both be replay-safe, and the paid-flip must
// be forward-only (a retry must never knock scanning/scanned back to paid).

const {
  verifyFn,
  disputeMaybeSingleFn,
  disputeInsertFn,
  paymentsMaybeSingleFn,
  paymentsInsertFn,
  inspectionEqFn,
  inspectionInFn,
} = vi.hoisted(() => {
  return {
    verifyFn: vi.fn(),
    disputeMaybeSingleFn: vi.fn(),
    disputeInsertFn: vi.fn(),
    paymentsMaybeSingleFn: vi.fn(),
    paymentsInsertFn: vi.fn(),
    inspectionEqFn: vi.fn(),
    inspectionInFn: vi.fn(),
  };
});

vi.mock("@/lib/payments/stripe", () => ({
  verifyWebhookSignature: verifyFn,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "dispute_letters") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: disputeMaybeSingleFn }) }),
          insert: disputeInsertFn,
        };
      }
      if (table === "payments") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: paymentsMaybeSingleFn }) }),
          insert: paymentsInsertFn,
        };
      }
      if (table === "inspections") {
        return {
          update: () => ({
            eq: (...args: unknown[]) => {
              const result = inspectionEqFn(...args) as Promise<{
                error: unknown;
              }>;
              return {
                in: inspectionInFn,
                then: ((onfulfilled, onrejected) =>
                  result.then(onfulfilled, onrejected)) as Promise<{
                  error: unknown;
                }>["then"],
              };
            },
          }),
        };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    },
  }),
}));

function makeEvent(product: string) {
  return {
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
          product,
        },
      },
    },
  };
}

function makeRequest(): Request {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body: "raw-body",
    headers: { "stripe-signature": "sig_test" },
  });
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    disputeInsertFn.mockResolvedValue({ error: null });
    paymentsInsertFn.mockResolvedValue({ error: null });
    inspectionEqFn.mockResolvedValue({ error: null });
    inspectionInFn.mockResolvedValue({ error: null });
    paymentsMaybeSingleFn.mockResolvedValue({ data: null });
    disputeMaybeSingleFn.mockResolvedValue({ data: null });
  });

  it("inserts dispute_letters exactly once when the same event arrives twice", async () => {
    verifyFn.mockResolvedValue(makeEvent("dispute"));
    const { POST } = await import("./route");

    // First delivery: nothing exists yet.
    paymentsMaybeSingleFn.mockResolvedValueOnce({ data: null });
    disputeMaybeSingleFn.mockResolvedValueOnce({ data: null });
    const res1 = await POST(makeRequest());
    expect(res1.status).toBe(200);

    // Retry: payment + dispute rows already exist.
    paymentsMaybeSingleFn.mockResolvedValueOnce({ data: { id: "pay-1" } });
    disputeMaybeSingleFn.mockResolvedValueOnce({ data: { id: "dl-existing" } });
    const res2 = await POST(makeRequest());
    expect(res2.status).toBe(200);

    expect(disputeInsertFn).toHaveBeenCalledTimes(1);
  });

  it("inserts payments exactly once when the same event arrives twice (#T145)", async () => {
    verifyFn.mockResolvedValue(makeEvent("report"));
    const { POST } = await import("./route");

    paymentsMaybeSingleFn.mockResolvedValueOnce({ data: null });
    const res1 = await POST(makeRequest());
    expect(res1.status).toBe(200);

    paymentsMaybeSingleFn.mockResolvedValueOnce({ data: { id: "pay-1" } });
    const res2 = await POST(makeRequest());
    expect(res2.status).toBe(200);

    expect(paymentsInsertFn).toHaveBeenCalledTimes(1);
  });

  it("paid-flip is forward-only: conditional on pre-payment statuses (#T145)", async () => {
    verifyFn.mockResolvedValue(makeEvent("report"));
    const { POST } = await import("./route");

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);

    // The status update must be guarded so a Stripe replay can never
    // regress scanning/scanned/disputed back to 'paid'.
    expect(inspectionInFn).toHaveBeenCalledWith("status", [
      "draft",
      "capturing",
      "submitted",
    ]);
  });

  it("exit_only follows the same paid-flip path (#T145)", async () => {
    verifyFn.mockResolvedValue(makeEvent("exit_only"));
    const { POST } = await import("./route");

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(inspectionInFn).toHaveBeenCalledWith("status", [
      "draft",
      "capturing",
      "submitted",
    ]);
  });
});
