import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Market } from "@/lib/serverMarket";

const h = vi.hoisted(() => ({
  marketByCode: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/serverMarket", () => ({ marketByCode: h.marketByCode }));
vi.mock("next/navigation", () => ({ notFound: h.notFound }));

import { createMarketSection } from "@/lib/marketSection";

function market(over: Partial<Market> = {}): Market {
  return {
    code: "SA", nameAr: "السعودية", slug: "saudi-arabia",
    cities: ["الرياض", "جدة"], count: 12, heroImage: null, heroCredit: "",
    ...over,
  };
}

const render = vi.fn((m: string) => <p data-market={m}>قسم {m}</p>);
const title = vi.fn((m: Market) => `خدمات في ${m.nameAr}`);
const description = vi.fn((m: Market, cities: string) => `وصف ${m.nameAr}: ${cities}`);
const section = createMarketSection({ slug: "services", title, description, render });
const params = (m: string) => ({ params: Promise.resolve({ market: m }) });

beforeEach(() => {
  h.marketByCode.mockReset();
  h.notFound.mockClear();
  render.mockClear();
  title.mockClear();
  description.mockClear();
});

describe("createMarketSection — generateStaticParams", () => {
  it("يبني صفحة لكل سوق من الأسواق الستّة بالرموز الصغيرة", () => {
    expect(section.generateStaticParams()).toEqual(
      ["ye", "sa", "jo", "eg", "iq", "om"].map((market) => ({ market })),
    );
  });
});

describe("createMarketSection — generateMetadata", () => {
  it("سوق غير معروف: بيانات وصفية فارغة بلا نداء للعنوان أو الوصف", async () => {
    h.marketByCode.mockResolvedValue(null);
    expect(await section.generateMetadata(params("zz"))).toEqual({});
    expect(h.marketByCode).toHaveBeenCalledWith("zz");
    expect(title).not.toHaveBeenCalled();
    expect(description).not.toHaveBeenCalled();
  });

  it("سوق فيه عقارات: مفهرس، برابط قانونيّ للقسم، والوصف يحمل مدن السوق", async () => {
    h.marketByCode.mockResolvedValue(market());
    const md = await section.generateMetadata(params("sa"));
    expect(md.robots).toBeUndefined();
    expect(md.title).toEqual({ absolute: "خدمات في السعودية | مسكني" });
    expect(md.description).toBe("وصف السعودية: الرياض وجدة");
    expect(md.alternates).toEqual({ canonical: "/sa/services" });
    expect(md.openGraph).toMatchObject({
      title: "خدمات في السعودية",
      description: "وصف السعودية: الرياض وجدة",
      url: "/sa/services",
      siteName: "مسكني",
    });
  });

  it("سوق بلا عقار واحد: noindex مع إبقاء follow", async () => {
    h.marketByCode.mockResolvedValue(market({ code: "OM", nameAr: "عُمان", count: 0 }));
    const md = await section.generateMetadata(params("om"));
    expect(md.robots).toEqual({ index: false, follow: true });
    expect(md.alternates).toEqual({ canonical: "/om/services" });
  });

  it("عتبة الفهرسة عقارٌ واحد: count=1 يُفهرَس", async () => {
    h.marketByCode.mockResolvedValue(market({ count: 1 }));
    expect((await section.generateMetadata(params("sa"))).robots).toBeUndefined();
  });

  it("سوق بلا مدن: يقع الوصف على اسم السوق", async () => {
    h.marketByCode.mockResolvedValue(market({ cities: [] }));
    const md = await section.generateMetadata(params("sa"));
    expect(md.description).toBe("وصف السعودية: السعودية");
  });
});

describe("createMarketSection — Page", () => {
  it("سوق غير معروف يستدعي notFound ولا يرسم القسم", async () => {
    h.marketByCode.mockResolvedValue(null);
    await expect(section.Page(params("zz"))).rejects.toThrow("NEXT_NOT_FOUND");
    expect(h.notFound).toHaveBeenCalledTimes(1);
    expect(render).not.toHaveBeenCalled();
  });

  it("سوق معروف يرسم cfg.render برمز السوق من المسار", async () => {
    h.marketByCode.mockResolvedValue(market({ code: "JO", nameAr: "الأردن" }));
    const el = await section.Page(params("jo"));
    expect(h.notFound).not.toHaveBeenCalled();
    expect(render).toHaveBeenCalledWith("jo");
    expect(renderToStaticMarkup(el)).toBe('<p data-market="jo">قسم jo</p>');
  });
});
