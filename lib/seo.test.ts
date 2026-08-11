import { describe, it, expect } from "vitest";
import { citySlug, breadcrumbList, itemList, blogPosting, SITE_URL } from "./seo";

describe("citySlug", () => {
  it("lowercases and hyphenates a normal name", () => {
    expect(citySlug("Sanaa")).toBe("sanaa");
    expect(citySlug("Al Hudaydah")).toBe("al-hudaydah");
  });
  it("strips non-alphanumerics and collapses separators", () => {
    expect(citySlug("  Aden!! City  ")).toBe("aden-city");
    expect(citySlug("Ta'izz")).toBe("ta-izz");
  });
  it("trims leading/trailing hyphens", () => {
    expect(citySlug("--Ibb--")).toBe("ibb");
  });
  it("handles empty/undefined safely", () => {
    expect(citySlug("")).toBe("");
    // @ts-expect-error runtime guard for null
    expect(citySlug(null)).toBe("");
  });
});

describe("breadcrumbList", () => {
  it("builds absolute items with 1-based positions", () => {
    const b = breadcrumbList([
      { name: "الرئيسية", path: "/" },
      { name: "العقارات", path: "/properties" },
    ]);
    expect(b["@type"]).toBe("BreadcrumbList");
    expect(b.itemListElement).toHaveLength(2);
    expect(b.itemListElement[0]).toMatchObject({ position: 1, item: `${SITE_URL}/` });
    expect(b.itemListElement[1]).toMatchObject({ position: 2, item: `${SITE_URL}/properties` });
  });
});

describe("itemList", () => {
  it("counts items and makes relative urls absolute", () => {
    const l = itemList("عقارات صنعاء", ["/properties/1", "https://x.test/2"]);
    expect(l.numberOfItems).toBe(2);
    expect(l.itemListElement[0].url).toBe(`${SITE_URL}/properties/1`);
    // absolute urls are kept as-is
    expect(l.itemListElement[1].url).toBe("https://x.test/2");
  });
});

describe("blogPosting", () => {
  it("produces valid BlogPosting JSON-LD with fallbacks", () => {
    const p = blogPosting({ title: "دليل", slug: "guide", excerpt: "ملخّص" });
    expect(p["@type"]).toBe("BlogPosting");
    expect(p.headline).toBe("دليل");
    // no image → falls back to branded og
    expect(p.image).toEqual([`${SITE_URL}/og.webp`]);
    expect(p.mainEntityOfPage["@id"]).toBe(`${SITE_URL}/blog/guide`);
  });
  it("uses the provided image when present", () => {
    const p = blogPosting({ title: "t", slug: "s", excerpt: "e", image: "https://img/x.webp" });
    expect(p.image).toEqual(["https://img/x.webp"]);
  });
});
