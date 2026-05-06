/**
 * Unit tests for Stripe webhook idempotency — EX-5
 *
 * Focuses on the dispute_letters pre-insert guard: a duplicate webhook
 * replay must NOT insert a second row. All Supabase + Stripe calls are mocked.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Configurable mock state ─────────────────────────────────────────────────

let disputeLetterExists = false;
const mockInsertDispute = vi.fn();
const mockInsertPayment = vi.fn();
const mockUpdateInspection = vi.fn();

function buildMockSupabase() {
  return {
    from: (table: string) => {
      if (table === "dispute_letters") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: disputeLetterExists ? { id: "existing-id" } : null,
              }),
            }),
          }),
          insert: mockInsertDispute,
        };
      }
      if (table === "payments") {
        return { insert: mockInsertPayment };
      }
      if (table === "inspections") {
        return {
          update: () => ({
            eq: () => mockUpdateInspection(),
          }),
        };
      }
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      };
    },
  };
}

// ─── Module mocks ────────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => buildMockSupabase(),
}));

const mockVerify = vi.fn();
vi.mock("@/lib/payments/stripe", () => ({
  verifyWebhookSignature: mockVerify,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEvent(product: string, overrides: Record<string, unknown> = {}) {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_abc123",
        payment_intent: "pi_test_xyz",
        amount_total: 2000,
        amount_subtotal: 2000,
        currency: "eur",
        total_details: { amount_tax: 0 },
        customer_details: { address: { country: "FR" } },
        metadata: {
          inspectionId: "insp-uuid-001",
          userId: "user-uuid-001",
          product,
          waiverConsentId: "consent-uuid-001",
        },
        ...overrides,
      },
    },
  };
}

function makeRequest(body: string, signature = "t=1,v1=sig") {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": signature, "content-type": "application/json" },
    body,
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Stripe webhook — missing / invalid signature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    disputeLetterExists = false;
  });

  it("returns 400 when stripe-signature header is absent", async () => {
    const { POST } = await import("../stripe/route");
    const req = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/missing signature/i);
  });

  it("returns 400 when verifyWebhookSignature throws", async () => {
    mockVerify.mockRejectedValueOnce(new Error("Signature mismatch"));
    const { POST } = await import("../stripe/route");
    const res = await POST(makeRequest("{}", "bad-sig"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/signature mismatch/i);
  });
});

describe("Stripe webhook — report product", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    disputeLetterExists = false;
    mockInsertPayment.mockResolvedValue({ error: null });
    mockUpdateInspection.mockResolvedValue({ error: null });
  });

  it("records payment and marks inspection paid on checkout.session.completed", async () => {
    mockVerify.mockResolvedValue(makeEvent("report"));
    const { POST } = await import("../stripe/route");
    const res = await POST(makeRequest(JSON.stringify(makeEvent("report"))));
    expect(res.status).toBe(200);
    expect(mockInsertPayment).toHaveBeenCalledOnce();
    expect(mockInsertDispute).not.toHaveBeenCalled();
  });

  it("returns 400 when metadata is missing inspectionId", async () => {
    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_noid",
          metadata: { userId: "u1", product: "report" },
        },
      },
    };
    mockVerify.mockResolvedValue(event);
    const { POST } = await import("../stripe/route");
    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/missing metadata/i);
  });
});

describe("Stripe webhook — dispute idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    disputeLetterExists = false;
    mockInsertPayment.mockResolvedValue({ error: null });
    mockInsertDispute.mockResolvedValue({ error: null });
    mockUpdateInspection.mockResolvedValue({ error: null });
  });

  it("inserts dispute_letters row on first webhook delivery", async () => {
    mockVerify.mockResolvedValue(makeEvent("dispute"));
    const { POST } = await import("../stripe/route");
    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);
    expect(mockInsertDispute).toHaveBeenCalledOnce();
    expect(mockInsertDispute).toHaveBeenCalledWith(
      expect.objectContaining({
        inspection_id: "insp-uuid-001",
        stripe_payment_id: "cs_test_abc123",
        status: "pending",
      }),
    );
  });

  it("skips dispute_letters insert on duplicate webhook replay", async () => {
    disputeLetterExists = true; // simulate existing row
    mockVerify.mockResolvedValue(makeEvent("dispute"));
    const { POST } = await import("../stripe/route");
    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);
    expect(mockInsertDispute).not.toHaveBeenCalled();
  });

  it("still sets dispute_purchased flag even on replay (idempotent update)", async () => {
    disputeLetterExists = true;
    mockVerify.mockResolvedValue(makeEvent("dispute"));
    const { POST } = await import("../stripe/route");
    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);
    // updateInspection called for dispute_purchased flag — idempotent
    expect(mockUpdateInspection).toHaveBeenCalled();
  });

  it("inserts dispute row for report_and_dispute product", async () => {
    mockVerify.mockResolvedValue(makeEvent("report_and_dispute"));
    const { POST } = await import("../stripe/route");
    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);
    expect(mockInsertDispute).toHaveBeenCalledOnce();
    expect(mockInsertPayment).toHaveBeenCalledOnce();
  });
});
