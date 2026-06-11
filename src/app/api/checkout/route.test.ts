import { describe, it, expect, vi, beforeEach } from "vitest";

// #T156 — POST /api/checkout must accept the Capacitor shell's
// Authorization: Bearer auth (cookies don't cross the app / tenu.world
// origin boundary) while keeping the web cookie path and the L221-28 1°
// waiver gate intact. The Stripe session URL the route returns is opened
// by the app in the system browser — it needs no Tenu session.

import { WAIVER_TEXT_VERSION } from "@/lib/legal/withdrawal-waiver";

const { getUserFn, fromFn, createClientFn, createCheckoutSessionFn } =
  vi.hoisted(() => ({
    getUserFn: vi.fn(),
    fromFn: vi.fn(),
    createClientFn: vi.fn(),
    createCheckoutSessionFn: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientFn,
}));

vi.mock("@/lib/payments/stripe", async (importOriginal) => {
  // Keep calculatePrice (pure pricing logic) real; stub the Stripe call.
  const actual = await importOriginal<typeof import("@/lib/payments/stripe")>();
  return {
    ...actual,
    createCheckoutSession: createCheckoutSessionFn,
  };
});

vi.mock("@/lib/analytics/funnel", () => ({
  recordFunnelEvent: vi.fn(),
}));

// ── Minimal thenable supabase-js query chain ─────────────────────────
interface QueryResult {
  data: unknown;
  error: unknown;
}

function makeChain(result: QueryResult) {
  const chain = {
    eq: () => chain,
    in: () => chain,
    order: () => chain,
    limit: () => chain,
    select: () => chain,
    insert: () => chain,
    single: () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
    then: (
      onfulfilled?: (value: QueryResult) => unknown,
      onrejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(onfulfilled, onrejected),
  };
  return chain;
}

function wireTables(tables: Record<string, QueryResult>): void {
  fromFn.mockImplementation((table: string) => {
    const result = tables[table] ?? { data: null, error: null };
    return {
      select: () => makeChain(result),
      insert: () => makeChain(result),
    };
  });
}

const inspectionRow = {
  id: "insp-1",
  user_id: "user-1",
  jurisdiction: "fr",
  risk_score: null,
};

const roomRows = [
  { room_type: "salon", label: "Salon" },
  { room_type: "cuisine", label: "Cuisine" },
];

const validWaiver = {
  priorConsent: true,
  waiver: true,
  locale: "fr",
  textVersion: WAIVER_TEXT_VERSION,
};

function makeRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost/api/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
  });
}

const baseBody = {
  product: "report",
  inspectionId: "insp-1",
  successUrl:
    "https://tenu.world/inspection/insp-1/payment-return?status=paid&from=app",
  cancelUrl:
    "https://tenu.world/inspection/insp-1/payment-return?status=cancelled&from=app",
  waiverConsent: validWaiver,
};

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClientFn.mockResolvedValue({
      auth: { getUser: getUserFn },
      from: fromFn,
    });
    getUserFn.mockResolvedValue({ data: { user: { id: "user-1" } } });
    createCheckoutSessionFn.mockResolvedValue({
      sessionId: "cs_test_1",
      url: "https://checkout.stripe.com/c/pay/cs_test_1",
    });
    wireTables({
      inspections: { data: inspectionRow, error: null },
      rooms: { data: roomRows, error: null },
      consents: { data: { id: "consent-1" }, error: null },
    });
  });

  it("returns 401 when there is no session and no bearer token", async () => {
    getUserFn.mockResolvedValue({ data: { user: null } });

    const { POST } = await import("./route");
    const res = await POST(makeRequest(baseBody));
    expect(res.status).toBe(401);
    expect(createCheckoutSessionFn).not.toHaveBeenCalled();
  });

  it("authenticates a Bearer token: validates it and forwards it to the Supabase client (RLS)", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest(baseBody, { Authorization: "Bearer app-access-token" }),
    );

    expect(res.status).toBe(200);
    // Token is what gets validated…
    expect(getUserFn).toHaveBeenCalledWith("app-access-token");
    // …and what scopes the PostgREST queries (RLS as the user, not anon).
    expect(createClientFn).toHaveBeenCalledWith({
      bearerToken: "app-access-token",
    });
  });

  it("keeps the cookie path unchanged when no Authorization header is sent", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest(baseBody));

    expect(res.status).toBe(200);
    expect(createClientFn).toHaveBeenCalledWith(undefined);
    expect(getUserFn).toHaveBeenCalledWith();
  });

  it("refuses to create a session without the L221-28 waiver, even with a valid bearer token", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest(
        { ...baseBody, waiverConsent: undefined },
        { Authorization: "Bearer app-access-token" },
      ),
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe("WAIVER_MISSING");
    expect(createCheckoutSessionFn).not.toHaveBeenCalled();
  });

  it("rejects a stale waiver text version (legal copy is frozen + versioned)", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest(
        {
          ...baseBody,
          waiverConsent: { ...validWaiver, textVersion: "v0.9-old" },
        },
        { Authorization: "Bearer app-access-token" },
      ),
    );

    expect(res.status).toBe(400);
    expect(createCheckoutSessionFn).not.toHaveBeenCalled();
  });

  it("returns the Stripe session URL for an app-initiated exit_only purchase", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest(
        { ...baseBody, product: "exit_only" },
        { Authorization: "Bearer app-access-token" },
      ),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { url?: string; sessionId?: string };
    expect(body.url).toBe("https://checkout.stripe.com/c/pay/cs_test_1");
    expect(body.sessionId).toBe("cs_test_1");
    expect(createCheckoutSessionFn).toHaveBeenCalledWith(
      expect.objectContaining({
        product: "exit_only",
        inspectionId: "insp-1",
        userId: "user-1",
        waiverConsentId: "consent-1",
      }),
    );
  });

  it("404s when the inspection belongs to another user", async () => {
    wireTables({
      inspections: {
        data: { ...inspectionRow, user_id: "someone-else" },
        error: null,
      },
      rooms: { data: roomRows, error: null },
    });

    const { POST } = await import("./route");
    const res = await POST(
      makeRequest(baseBody, { Authorization: "Bearer app-access-token" }),
    );
    expect(res.status).toBe(404);
    expect(createCheckoutSessionFn).not.toHaveBeenCalled();
  });
});
