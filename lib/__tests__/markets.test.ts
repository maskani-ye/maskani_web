import { describe, expect, it } from "vitest";
import {
  DEFAULT_MARKET,
  MARKETS,
  MARKET_NAMES,
  isMarket,
  marketPath,
  splitMarket,
} from "@/lib/markets";

describe("isMarket", () => {
  it("يقبل رموز الأسواق الستّة بأيّ حالة أحرف", () => {
    for (const m of MARKETS) {
      expect(isMarket(m)).toBe(true);
      expect(isMarket(m.toUpperCase())).toBe(true);
    }
  });

  it("يرفض الفارغ والمجهول وما يشبه الرمز", () => {
    for (const bad of [null, undefined, "", "xx", "y", "yem", "ye ", "sd"]) {
      expect(isMarket(bad)).toBe(false);
    }
  });

  it("الافتراضي سوقٌ صالح ولكل سوق اسمٌ عربيّ", () => {
    expect(isMarket(DEFAULT_MARKET)).toBe(true);
    for (const m of MARKETS) expect(MARKET_NAMES[m]).toBeTruthy();
  });
});

describe("marketPath", () => {
  it("يبني مسار القسم تحت بادئة السوق ويزيل الشرطات البادئة", () => {
    expect(marketPath("ye", "properties")).toBe("/ye/properties");
    expect(marketPath("sa", "/properties/12")).toBe("/sa/properties/12");
    expect(marketPath("jo", "///services")).toBe("/jo/services");
  });

  it("المسار الفارغ أو الشرطة وحدها = صفحة السوق نفسها بلا شرطة زائدة", () => {
    expect(marketPath("eg")).toBe("/eg");
    expect(marketPath("eg", "")).toBe("/eg");
    expect(marketPath("eg", "/")).toBe("/eg");
  });
});

describe("splitMarket", () => {
  it("يفصل السوق عن باقي المسار ويطبّع حالة الأحرف", () => {
    expect(splitMarket("/ye/properties/5")).toEqual({ market: "ye", rest: "/properties/5" });
    expect(splitMarket("/SA")).toEqual({ market: "sa", rest: "" });
    expect(splitMarket("/om/")).toEqual({ market: "om", rest: "/" });
  });

  it("مسارٌ بلا سوق صالح يُعاد كما هو", () => {
    for (const p of ["/properties", "/xx/properties", "/yemen", "/", "/blog/ye"]) {
      expect(splitMarket(p)).toEqual({ market: null, rest: p });
    }
  });

  it("مبدّل الدولة يفتح القسم نفسه في السوق الآخر", () => {
    const { rest } = splitMarket("/ye/properties/12");
    expect(marketPath("iq", rest)).toBe("/iq/properties/12");
    expect(marketPath("iq", splitMarket("/ye").rest)).toBe("/iq");
  });
});
