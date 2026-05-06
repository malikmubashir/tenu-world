/**
 * Unit tests for FX conversion helpers — EX-5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { convertEurCentsToGbpCents } from "../fx";

describe("convertEurCentsToGbpCents", () => {
  it("converts 1500 EUR cents at rate 0.856 → 1284 GBP pence", () => {
    expect(convertEurCentsToGbpCents(1500, 0.856)).toBe(1284);
  });

  it("converts 2000 EUR cents at rate 0.856 → 1712 GBP pence", () => {
    expect(convertEurCentsToGbpCents(2000, 0.856)).toBe(1712);
  });

  it("rounds to nearest penny (0.5 rounds up)", () => {
    // 1001 * 0.5 = 500.5 → rounds to 501
    expect(convertEurCentsToGbpCents(1001, 0.5)).toBe(501);
  });

  it("handles rate of 1.0 (no conversion)", () => {
    expect(convertEurCentsToGbpCents(1500, 1.0)).toBe(1500);
  });

  it("handles 0 input", () => {
    expect(convertEurCentsToGbpCents(0, 0.856)).toBe(0);
  });
});

describe("calculatePriceWithFx", () => {
  // calculatePriceWithFx calls getLatestEurGbp which hits Supabase.
  // Mock the entire fx module to isolate the conversion logic.

  beforeEach(() => {
    vi.mock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({
        from: () => ({
          select: () => ({
            order: () => ({
              limit: () => ({
                single: async () => ({ data: { eur_gbp: 0.85 }, error: null }),
              }),
            }),
          }),
        }),
      }),
    }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("FR jurisdiction returns EUR with fxRate 1.0", async () => {
    const { calculatePriceWithFx } = await import("../calculate");
    const rooms = [{ type: "salon" }, { type: "cuisine" }];
    const result = await calculatePriceWithFx(rooms, "fr");

    expect(result.currency).toBe("eur");
    expect(result.fxRate).toBe(1.0);
    expect(result.totalReportPrice).toBe(1500);
  });

  it("UK jurisdiction converts EUR amounts to GBP pence", async () => {
    const { calculatePriceWithFx } = await import("../calculate");
    const rooms = [{ type: "salon" }, { type: "cuisine" }];
    const result = await calculatePriceWithFx(rooms, "uk");

    expect(result.currency).toBe("gbp");
    expect(result.fxRate).toBe(0.85);
    // 1500 * 0.85 = 1275
    expect(result.totalReportPrice).toBe(1275);
  });
});
