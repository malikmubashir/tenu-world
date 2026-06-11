import { describe, it, expect } from "vitest";

// #T156 — mobile payment handoff helpers. Pure logic feeding the
// SubmitFlow payment stage: SKU mapping, Stripe return URLs and the
// awaiting-payment poll loop (backoff + status classification).

import {
  appPaymentReturnUrls,
  classifyPolledStatus,
  nextPollDelayMs,
  PAYMENT_POLL_BASE_MS,
  PAYMENT_POLL_MAX_MS,
  scanProductForDraftType,
} from "./payment";

describe("scanProductForDraftType", () => {
  it("maps an entrée draft to the tier-priced report SKU", () => {
    expect(scanProductForDraftType("entree")).toBe("report");
  });

  it("maps a sortie draft to the flat exit_only SKU", () => {
    expect(scanProductForDraftType("sortie")).toBe("exit_only");
  });

  it("defaults to report when the draft type is missing", () => {
    expect(scanProductForDraftType(undefined)).toBe("report");
  });
});

describe("appPaymentReturnUrls", () => {
  it("always targets tenu.world (never the Capacitor shell origin) and tags from=app", () => {
    const { successUrl, cancelUrl } = appPaymentReturnUrls("insp-123");
    expect(successUrl).toBe(
      "https://tenu.world/inspection/insp-123/payment-return?status=paid&from=app",
    );
    expect(cancelUrl).toBe(
      "https://tenu.world/inspection/insp-123/payment-return?status=cancelled&from=app",
    );
  });
});

describe("nextPollDelayMs", () => {
  it("starts at the 5s base", () => {
    expect(nextPollDelayMs(0)).toBe(PAYMENT_POLL_BASE_MS);
  });

  it("backs off geometrically (×1.5 per attempt)", () => {
    expect(nextPollDelayMs(1)).toBe(7500);
    expect(nextPollDelayMs(2)).toBe(11250);
  });

  it("caps at 30s so an abandoned payment still resolves eventually", () => {
    expect(nextPollDelayMs(10)).toBe(PAYMENT_POLL_MAX_MS);
    expect(nextPollDelayMs(100)).toBe(PAYMENT_POLL_MAX_MS);
  });

  it("never returns a negative or zero delay", () => {
    expect(nextPollDelayMs(-3)).toBe(PAYMENT_POLL_BASE_MS);
  });
});

describe("classifyPolledStatus", () => {
  it("fires the scan exactly when the webhook has flipped status to paid", () => {
    expect(classifyPolledStatus("paid")).toBe("run_scan");
  });

  it("waits while the payment has not landed yet", () => {
    expect(classifyPolledStatus("submitted")).toBe("keep_waiting");
    expect(classifyPolledStatus("capturing")).toBe("keep_waiting");
    expect(classifyPolledStatus(null)).toBe("keep_waiting");
    expect(classifyPolledStatus(undefined)).toBe("keep_waiting");
  });

  it("does not double-fire when another surface already claimed the scan", () => {
    expect(classifyPolledStatus("scanning")).toBe("scan_in_progress");
  });

  it("goes straight to the result for terminal states", () => {
    expect(classifyPolledStatus("scanned")).toBe("scan_done");
    expect(classifyPolledStatus("disputed")).toBe("scan_done");
    expect(classifyPolledStatus("closed")).toBe("scan_done");
  });
});
