import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// #T145 regression suite — scan/payment state machine.
// Pay-at-upload: POST /api/ai/scan must only run on a paid inspection
// (verified against the payments table, not the forgeable status column),
// must reject double scans idempotently, and must claim the inspection
// atomically so concurrent requests cannot double-spend on Haiku.

const { getUserFn, fromFn, scanAllRoomsFn } = vi.hoisted(() => {
  const getUserFn = vi.fn();
  const fromFn = vi.fn();
  const scanAllRoomsFn = vi.fn();
  return { getUserFn, fromFn, scanAllRoomsFn };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: getUserFn },
    from: fromFn,
  }),
}));

vi.mock("@/lib/ai/risk-scan", () => ({
  scanAllRooms: scanAllRoomsFn,
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
  renderAndUploadScanPdf: vi
    .fn()
    .mockResolvedValue({ url: "https://r2.example.com/report.pdf" }),
}));

// ── Minimal thenable supabase-js query chain ─────────────────────────
interface QueryResult {
  data: unknown;
  error: unknown;
}

interface Chain extends PromiseLike<QueryResult> {
  eq: (column: string, value: unknown) => Chain;
  in: (column: string, values: unknown[]) => Chain;
  order: (column: string) => Chain;
  limit: (count: number) => Chain;
  select: (columns?: string) => Chain;
  single: () => Promise<QueryResult>;
  maybeSingle: () => Promise<QueryResult>;
}

function makeChain(result: QueryResult): Chain {
  const chain: Chain = {
    eq: () => chain,
    in: () => chain,
    order: () => chain,
    limit: () => chain,
    select: () => chain,
    single: () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
    then: ((onfulfilled, onrejected) =>
      Promise.resolve(result).then(onfulfilled, onrejected)) as Chain["then"],
  };
  return chain;
}

interface TableConfig {
  select?: QueryResult;
  update?: QueryResult;
}

function wireTables(tables: Record<string, TableConfig>): void {
  fromFn.mockImplementation((table: string) => {
    const cfg = tables[table] ?? {};
    return {
      select: () => makeChain(cfg.select ?? { data: null, error: null }),
      update: () => makeChain(cfg.update ?? { data: [{ id: "x" }], error: null }),
    };
  });
}

const baseInspection = {
  id: "insp-1",
  user_id: "user-1",
  status: "paid",
  jurisdiction: "fr",
  address_formatted: "1 rue de la Paix, Paris",
  move_in_date: "2026-01-01",
  move_out_date: null,
  deposit_amount_cents: 150000,
  deposit_currency: "EUR",
};

const oneRoom = [
  { id: "room-1", room_type: "salon", label: "Salon", sort_order: 0 },
];

const scanSuccess = {
  rooms: [],
  overallRisk: "low",
  totalEstimatedDeduction: 0,
  scanTimestamp: new Date().toISOString(),
  costEur: 0.01,
  modelUsed: "claude-haiku",
  attemptCount: 1,
  v2: null,
};

function makeRequest(): Request {
  return new Request("http://localhost/api/ai/scan", {
    method: "POST",
    body: JSON.stringify({ inspectionId: "insp-1" }),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/ai/scan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scanAllRoomsFn.mockResolvedValue(scanSuccess);
    getUserFn.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when no authenticated user", async () => {
    getUserFn.mockResolvedValue({ data: { user: null } });

    const { POST } = await import("./route");
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 404 when inspection is not found", async () => {
    wireTables({
      inspections: { select: { data: null, error: null } },
    });

    const { POST } = await import("./route");
    const res = await POST(makeRequest());
    expect(res.status).toBe(404);
  });

  it("returns 402 and never calls the model when no completed payment exists (pay-at-upload)", async () => {
    wireTables({
      inspections: {
        select: { data: { ...baseInspection, status: "submitted" }, error: null },
      },
      payments: { select: { data: null, error: null } },
    });

    const { POST } = await import("./route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(402);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe("PAYMENT_REQUIRED");
    expect(scanAllRoomsFn).not.toHaveBeenCalled();
  });

  it("returns 400 when inspection has not been submitted yet", async () => {
    wireTables({
      inspections: {
        select: { data: { ...baseInspection, status: "capturing" }, error: null },
      },
    });

    const { POST } = await import("./route");
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
    expect(scanAllRoomsFn).not.toHaveBeenCalled();
  });

  it("returns 409 when inspection is already scanned (double-scan idempotency)", async () => {
    wireTables({
      inspections: {
        select: { data: { ...baseInspection, status: "scanned" }, error: null },
      },
    });

    const { POST } = await import("./route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(409);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe("ALREADY_SCANNED");
    expect(scanAllRoomsFn).not.toHaveBeenCalled();
  });

  it("returns 409 when a concurrent request already claimed the scan", async () => {
    wireTables({
      inspections: {
        select: { data: baseInspection, error: null },
        // Conditional claim UPDATE matches zero rows → lost the race.
        update: { data: [], error: null },
      },
      payments: { select: { data: { id: "pay-1" }, error: null } },
      rooms: { select: { data: oneRoom, error: null } },
      photos: { select: { data: [{ r2_url: "https://r2/p1.jpg" }], error: null } },
    });

    const { POST } = await import("./route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(409);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe("SCAN_IN_PROGRESS");
    expect(scanAllRoomsFn).not.toHaveBeenCalled();
  });

  it("runs the scan when status is 'paid' and a completed payment row exists", async () => {
    wireTables({
      inspections: {
        select: { data: baseInspection, error: null },
        update: { data: [{ id: "insp-1" }], error: null },
      },
      payments: { select: { data: { id: "pay-1" }, error: null } },
      rooms: {
        select: { data: oneRoom, error: null },
        update: { data: null, error: null },
      },
      photos: { select: { data: [{ r2_url: "https://r2/p1.jpg" }], error: null } },
    });

    const { POST } = await import("./route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    const body = (await res.json()) as { status?: string };
    expect(body.status).toBe("scanned");
    expect(scanAllRoomsFn).toHaveBeenCalledTimes(1);
  });

  it("allows a 'submitted' inspection through when the payment row exists (webhook status-flip failed)", async () => {
    wireTables({
      inspections: {
        select: { data: { ...baseInspection, status: "submitted" }, error: null },
        update: { data: [{ id: "insp-1" }], error: null },
      },
      payments: { select: { data: { id: "pay-1" }, error: null } },
      rooms: {
        select: { data: oneRoom, error: null },
        update: { data: null, error: null },
      },
      photos: { select: { data: [{ r2_url: "https://r2/p1.jpg" }], error: null } },
    });

    const { POST } = await import("./route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(scanAllRoomsFn).toHaveBeenCalledTimes(1);
  });

  it("SCAN_PAYMENT_GATE_BYPASS=1 skips the payment check (local testing only)", async () => {
    vi.stubEnv("SCAN_PAYMENT_GATE_BYPASS", "1");

    wireTables({
      inspections: {
        select: { data: { ...baseInspection, status: "submitted" }, error: null },
        update: { data: [{ id: "insp-1" }], error: null },
      },
      // No payment row — bypass must be the only reason this passes.
      payments: { select: { data: null, error: null } },
      rooms: {
        select: { data: oneRoom, error: null },
        update: { data: null, error: null },
      },
      photos: { select: { data: [{ r2_url: "https://r2/p1.jpg" }], error: null } },
    });

    const { POST } = await import("./route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(scanAllRoomsFn).toHaveBeenCalledTimes(1);
  });

  it("bypass defaults OFF: unset env still yields 402 without payment", async () => {
    // No stubEnv call — the default path must enforce payment.
    wireTables({
      inspections: {
        select: { data: { ...baseInspection, status: "submitted" }, error: null },
      },
      payments: { select: { data: null, error: null } },
    });

    const { POST } = await import("./route");
    const res = await POST(makeRequest());
    expect(res.status).toBe(402);
  });
});
