import { describe, it, expect } from "vitest";
import {
  propertyTypeName,
  propertyTypeLabels,
  CURRENCY_SYMBOLS,
  offerTypeLabels,
  formatPrice,
  cn,
} from "./utils";

describe("propertyTypeName", () => {
  it("reads name_ar from a nested object", () => {
    expect(propertyTypeName({ id: 1, name_ar: "شقة فاخرة" })).toBe("شقة فاخرة");
  });
  it("maps a known slug to its Arabic label", () => {
    expect(propertyTypeName("apartment")).toBe(propertyTypeLabels.apartment);
    expect(propertyTypeName("land")).toBe("أرض");
  });
  it("returns the raw string for an unknown slug", () => {
    expect(propertyTypeName("villa-xyz")).toBe("villa-xyz");
  });
  it("never renders an object; falls back to — for null/number", () => {
    expect(propertyTypeName(null)).toBe("—");
    expect(propertyTypeName(42)).toBe("—");
  });
});

describe("label/symbol maps", () => {
  it("has the expected currency symbols", () => {
    expect(CURRENCY_SYMBOLS.SAR).toBe("ر.س");
    expect(CURRENCY_SYMBOLS.YER).toBe("ر.ي");
    expect(CURRENCY_SYMBOLS.USD).toBe("$");
  });
  it("has offer-type labels", () => {
    expect(offerTypeLabels.sale).toBeTruthy();
    expect(offerTypeLabels.rent_monthly).toBeTruthy();
  });
});

describe("formatPrice (USD, deterministic locale)", () => {
  it("includes the amount and the $ sign", () => {
    const out = formatPrice(100, "USD");
    expect(out).toContain("100");
    expect(out).toContain("$");
  });
});

describe("cn", () => {
  it("merges class names and drops falsy values", () => {
    expect(cn("a", false, "b", undefined, "c")).toBe("a b c");
  });
});
