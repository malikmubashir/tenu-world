import { describe, it, expect, vi, beforeEach } from "vitest";

const { getUserFn, fromFn } = vi.hoisted(() => {
  const getUserFn = vi.fn();
  const fromFn = vi.fn();
  return { getUserFn, fromFn };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: getUserFn },
    from: fromFn,
  }),
}));

vi.mock("@/lib/ai/risk-scan", () => ({
  scanAllRooms: vi.fn().mockResolvedValue({
    rooms: [],
    overallRisk: "low",
    totalEstimatedDeduction: 0,
    scanTimestamp: new Date().toISOString(),
    costEur: 0.01,
    modelUsed: "claude-haiku",
    attemptCount: 1,
    v2: null,
  }),
  ScanError: class ScanError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock("@/lib/email/notify", () => ({
  notifyScanComplete: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/pdf/render-and-upload", () => ({
  renderAndUploadScanPdf: vi.fn().mockResolvedValue({ url: "https://r2.example.com/report.pdf" }),
}));

describe("POST /api/ai/scan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no authenticated user", async () => {
    getUserFn.mockResolvedValue({ data: { user: null } });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/ai/scan", {
      method: "POST",
      body: JSON.stringify({ inspectionId: "insp-1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 404 when inspection is not found", async () => {
    getUserFn.mockResolvedValue({ data: { user: { id: "user-1" } } });
    fromFn.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => ({ data: null }) }) }),
    });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/ai/scan", {
      method: "POST",
      body: JSON.stringify({ inspectionId: "nonexistent" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("returns 400 when inspection status is not 'submitted'", async () => {
    getUserFn.mockResolvedValue({ data: { user: { id: "user-1" } } });
    fromFn.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => ({
            data: {
              id: "insp-1",
              user_id: "user-1",
              status: "scanned",
              jurisdiction: "fr",
              address_formatted: "1 rue de la Paix, Paris",
              move_in_date: "2025-01-01",
              move_out_date: null,
              deposit_amount_cents: 150000,
              deposit_currency: "EUR",
            },
          }),
        }),
      }),
    });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/ai/scan", {
      method: "POST",
      body: JSON.stringify({ inspectionId: "insp-1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
