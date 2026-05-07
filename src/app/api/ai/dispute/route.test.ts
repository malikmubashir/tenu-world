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

vi.mock("@/lib/ai/dispute-letter", () => ({
  generateDisputeLetterV2: vi.fn().mockResolvedValue({
    locale: "fr",
    costEur: 0.05,
    modelUsed: "claude-sonnet",
    attemptCount: 1,
    v2: {
      locale: "fr",
      header: "Paris, le 7 mai 2026",
      body: "Madame, Monsieur,",
      items_table: [],
      closing: "Veuillez agréer…",
      disclaimer: "Ce courrier est…",
      meta: {},
    },
  }),
  DisputeError: class DisputeError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock("@/lib/email/notify", () => ({
  notifyDisputeReady: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("POST /api/ai/dispute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no authenticated user", async () => {
    getUserFn.mockResolvedValue({ data: { user: null } });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/ai/dispute", {
      method: "POST",
      body: JSON.stringify({ inspectionId: "insp-1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when inspectionId is missing from body", async () => {
    getUserFn.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/ai/dispute", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when request body is not valid JSON", async () => {
    getUserFn.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/ai/dispute", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
