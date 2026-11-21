import { afterEach, describe, expect, it, vi } from "vitest";
import { BLOG_CATEGORIES, categoryLabel, getBlogCategories } from "@/lib/blogCategories";

const respond = (body: unknown, ok = true) =>
  vi.fn().mockResolvedValue({ ok, json: async () => body } as Response);

afterEach(() => vi.unstubAllGlobals());

describe("getBlogCategories", () => {
  it("يحوّل تصنيفات الخادم {value,label} إلى {slug,label,description}", async () => {
    vi.stubGlobal("fetch", respond([{ value: "rent", label: "الإيجار", description: "دليل" }, { value: "law", label: "قانون" }]));
    expect(await getBlogCategories()).toEqual([
      { slug: "rent", label: "الإيجار", description: "دليل" },
      { slug: "law", label: "قانون", description: "" },
    ]);
  });

  it("يقع على القائمة الثابتة عند ردّ فاشل أو فارغ أو شكلٍ غير متوقّع أو عطل شبكة", async () => {
    for (const f of [respond({}, false), respond([]), respond({ results: [] }),
      vi.fn().mockRejectedValue(new TypeError("fetch failed"))]) {
      vi.stubGlobal("fetch", f);
      expect(await getBlogCategories()).toBe(BLOG_CATEGORIES);
    }
  });
});

describe("categoryLabel", () => {
  it("اسم التصنيف المعروف، والمعرّف نفسه لمجهول بدل فراغ", () => {
    const known = BLOG_CATEGORIES[0];
    expect(categoryLabel(known.slug)).toBe(known.label);
    expect(categoryLabel("غير-موجود")).toBe("غير-موجود");
  });
});
