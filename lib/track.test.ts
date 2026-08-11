import { describe, it, expect } from "vitest";
import { utmFromSearch } from "./track";

describe("utmFromSearch", () => {
  it("extracts only the known utm params", () => {
    const sp = new URLSearchParams(
      "utm_source=fb&utm_medium=cpc&utm_campaign=eid&foo=bar&x=1",
    );
    expect(utmFromSearch(sp)).toEqual({
      utm_source: "fb",
      utm_medium: "cpc",
      utm_campaign: "eid",
    });
  });

  it("omits missing params (no empty keys)", () => {
    const sp = new URLSearchParams("utm_source=google");
    expect(utmFromSearch(sp)).toEqual({ utm_source: "google" });
  });

  it("returns an empty object for null or empty search", () => {
    expect(utmFromSearch(null)).toEqual({});
    expect(utmFromSearch(new URLSearchParams(""))).toEqual({});
  });
});
