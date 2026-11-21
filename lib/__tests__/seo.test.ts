import { describe, expect, it } from "vitest";
import {
  SITE_NAME,
  SITE_URL,
  blogPosting,
  breadcrumbList,
  citySlug,
  itemList,
  sectionMetadata,
} from "@/lib/seo";

describe("citySlug", () => {
  it("يبني معرّفاً بحروف صغيرة وشرطات من الاسم الإنجليزي", () => {
    expect(citySlug("Al Hudaydah")).toBe("al-hudaydah");
    expect(citySlug("  Aden  ")).toBe("aden");
    expect(citySlug("Ta'izz -- City")).toBe("ta-izz-city");
  });

  it("لا شرطة بادئة ولا لاحقة، والفارغ يبقى فارغاً", () => {
    expect(citySlug("-Riyadh!-")).toBe("riyadh");
    expect(citySlug("")).toBe("");
    expect(citySlug(undefined as unknown as string)).toBe("");
  });

  it("الاسم العربيّ لا يُنتج معرّفاً — يجب تمرير name_en", () => {
    expect(citySlug("صنعاء")).toBe("");
  });
});

describe("sectionMetadata", () => {
  it("كانونيكال نسبيّ وOpen Graph مطلق بالعنوان والوصف نفسهما", () => {
    const m = sectionMetadata("services");
    expect(m.alternates?.canonical).toBe("/services");
    const og = m.openGraph as { url: string; title: string; siteName: string };
    expect(og.url).toBe(`${SITE_URL}/services`);
    expect(og.title).toBe(m.title);
    expect(og.siteName).toBe(SITE_NAME);
    expect((m.twitter as { title: string }).title).toBe(m.title);
  });

  it("لكل قسم عنوانه الخاصّ", () => {
    const titles = (["properties", "services", "requests", "jobs", "reports"] as const).map(
      (k) => sectionMetadata(k).title,
    );
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("breadcrumbList", () => {
  it("مواضع تبدأ من 1 وروابط مطلقة", () => {
    const b = breadcrumbList([
      { name: "الرئيسية", path: "/" },
      { name: "عقارات", path: "/ye/properties" },
    ]);
    expect(b.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "عقارات", item: `${SITE_URL}/ye/properties` },
    ]);
  });
});

describe("itemList", () => {
  it("الرابط المطلق يمرّ كما هو والنسبيّ يُسبق بالموقع، والعدد = الطول", () => {
    const l = itemList("قائمة", ["/ye/properties/1", "https://cdn.example/x"]);
    expect(l.numberOfItems).toBe(2);
    expect(l.itemListElement.map((e) => e.url)).toEqual([
      `${SITE_URL}/ye/properties/1`,
      "https://cdn.example/x",
    ]);
    expect(l.itemListElement.map((e) => e.position)).toEqual([1, 2]);
  });

  it("القائمة الفارغة صالحة بعدد صفر", () => {
    expect(itemList("x", [])).toMatchObject({ numberOfItems: 0, itemListElement: [] });
  });
});

describe("blogPosting", () => {
  const base = { title: "عنوان", slug: "my-post", excerpt: "مقتطف" };

  it("بلا صورة يقع على صورة المشاركة، وبلا تاريخ نشر لا يُكتب datePublished", () => {
    const p = blogPosting(base);
    expect(p.image).toEqual([`${SITE_URL}/og.webp`]);
    expect("datePublished" in p).toBe(false);
    expect(p.dateModified).toBeUndefined();
    expect(p.author.name).toBe(SITE_NAME);
    expect(p.mainEntityOfPage["@id"]).toBe(`${SITE_URL}/blog/my-post`);
  });

  it("تاريخ التعديل يفضّل updated ثم يقع على published", () => {
    expect(blogPosting({ ...base, published: "2026-01-01", updated: "2026-02-01" }).dateModified).toBe("2026-02-01");
    const p = blogPosting({ ...base, published: "2026-01-01", updated: null, image: "https://i/x.webp", author: "فريق" });
    expect(p.dateModified).toBe("2026-01-01");
    expect(p).toMatchObject({ datePublished: "2026-01-01", image: ["https://i/x.webp"], author: { name: "فريق" } });
  });
});
