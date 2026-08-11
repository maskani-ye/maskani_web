import { describe, it, expect } from "vitest";
import { endpoints } from "./endpoints";

// حارس انحدار لمسارات الـAPI المركزية (سبق أن سبّبت مساراتٌ خاطئة أخطاء 404).
describe("endpoints path builders", () => {
  it("builds public property paths with trailing slash", () => {
    expect(endpoints.property(7)).toBe("/properties/7/");
    expect(endpoints.similarProperties(7)).toBe("/properties/7/similar/");
    expect(endpoints.service(3)).toBe("/services/3/");
    expect(endpoints.request(9)).toBe("/requests/9/");
  });

  it("keeps string ids intact", () => {
    expect(endpoints.property("abc")).toBe("/properties/abc/");
  });

  it("public list endpoints do not start with the admin prefix", () => {
    expect(endpoints.properties.startsWith("/admin")).toBe(false);
    expect(endpoints.services.startsWith("/admin")).toBe(false);
  });

  it("every builder returns an absolute API path (leading slash, no host)", () => {
    const samples = [
      endpoints.property(1),
      endpoints.similarProperties(1),
      endpoints.service(1),
      endpoints.request(1),
    ];
    for (const p of samples) {
      expect(p.startsWith("/")).toBe(true);
      expect(p.includes("http")).toBe(false);
      expect(p.endsWith("/")).toBe(true);
    }
  });
});
