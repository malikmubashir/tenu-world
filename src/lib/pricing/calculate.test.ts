import { describe, it, expect } from "vitest";
import { calculatePrice } from "@/lib/payments/stripe";

describe("calculatePrice — 5-tier grid + add-ons", () => {
  it("returns correct tier and report price for all 5 tiers", () => {
    const t1 = calculatePrice([{ type: "salon" }], "fr");
    expect(t1.tier).toBe("t1");
    expect(t1.totalReportPrice).toBe(1500);

    const t2 = calculatePrice([{ type: "salon" }, { type: "chambre" }], "fr");
    expect(t2.tier).toBe("t2");
    expect(t2.totalReportPrice).toBe(2000);

    const t3 = calculatePrice(
      [{ type: "salon" }, { type: "chambre" }, { type: "chambre" }],
      "fr",
    );
    expect(t3.tier).toBe("t3");
    expect(t3.totalReportPrice).toBe(2500);

    const t4 = calculatePrice(
      [{ type: "salon" }, { type: "chambre" }, { type: "chambre" }, { type: "salle_a_manger" }],
      "fr",
    );
    expect(t4.tier).toBe("t4");
    expect(t4.totalReportPrice).toBe(3000);

    const t5 = calculatePrice(
      [
        { type: "salon" },
        { type: "chambre" },
        { type: "chambre" },
        { type: "chambre" },
        { type: "salle_a_manger" },
      ],
      "fr",
    );
    expect(t5.tier).toBe("t5_maison");
    expect(t5.totalReportPrice).toBe(3500);
  });

  it("exit_only price is flat €25 (2500 cents) regardless of tier", () => {
    const t1 = calculatePrice([{ type: "salon" }], "fr");
    const t5 = calculatePrice(
      [{ type: "salon" }, { type: "chambre" }, { type: "chambre" }, { type: "chambre" }, { type: "salle_a_manger" }],
      "fr",
    );
    expect(t1.exitOnlyPrice).toBe(2500);
    expect(t5.exitOnlyPrice).toBe(2500);
  });

  it("dispute add-on is flat €20 (2000 cents) regardless of tier", () => {
    const t1 = calculatePrice([{ type: "salon" }], "fr");
    const t5 = calculatePrice(
      [{ type: "salon" }, { type: "chambre" }, { type: "chambre" }, { type: "chambre" }, { type: "salle_a_manger" }],
      "fr",
    );
    expect(t1.disputeLetterPrice).toBe(2000);
    expect(t5.disputeLetterPrice).toBe(2000);
  });
});
