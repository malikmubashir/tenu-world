/**
 * Unit tests for zone tendue detection + related helpers — EX-5
 */

import { describe, it, expect } from "vitest";
import {
  isZoneTendue,
  extractPostalCode,
  getNoticePeriodMonths,
  getDepositReturnDeadlineMonths,
} from "../zone-tendue";

describe("extractPostalCode", () => {
  it("extracts 5-digit postal code from a French address", () => {
    expect(extractPostalCode("12 Rue de la Paix, 75002 Paris")).toBe("75002");
  });

  it("extracts postal code at start of string", () => {
    expect(extractPostalCode("75001 Paris")).toBe("75001");
  });

  it("returns null for address with no postal code", () => {
    expect(extractPostalCode("Rue de la Paix, Paris")).toBeNull();
  });

  it("ignores 4-digit sequences", () => {
    expect(extractPostalCode("Flat 1234, London")).toBeNull();
  });
});

describe("isZoneTendue", () => {
  it("Paris 1st (75001) is zone tendue", () => {
    expect(isZoneTendue("75001")).toBe(true);
  });

  it("Paris 20th (75020) is zone tendue", () => {
    expect(isZoneTendue("75020")).toBe(true);
  });

  it("Lyon (69001) is zone tendue", () => {
    expect(isZoneTendue("69001")).toBe(true);
  });

  it("Marseille (13001) is zone tendue", () => {
    expect(isZoneTendue("13001")).toBe(true);
  });

  it("small rural commune is NOT zone tendue", () => {
    // 01400 — L'Abergement-Clémenciat, Ain — not in the decree list
    expect(isZoneTendue("01400")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isZoneTendue("")).toBe(false);
  });
});

describe("getNoticePeriodMonths", () => {
  it("zone tendue + unfurnished = 1 month", () => {
    expect(getNoticePeriodMonths(true, false)).toBe(1);
  });

  it("zone tendue + furnished = 1 month", () => {
    expect(getNoticePeriodMonths(true, true)).toBe(1);
  });

  it("non-tendue + unfurnished = 3 months", () => {
    expect(getNoticePeriodMonths(false, false)).toBe(3);
  });

  it("non-tendue + furnished = 1 month", () => {
    expect(getNoticePeriodMonths(false, true)).toBe(1);
  });
});

describe("getDepositReturnDeadlineMonths", () => {
  it("returns 1 month when no deductions", () => {
    expect(getDepositReturnDeadlineMonths(false)).toBe(1);
  });

  it("returns 2 months when deductions exist", () => {
    expect(getDepositReturnDeadlineMonths(true)).toBe(2);
  });
});
