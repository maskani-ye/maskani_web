import { describe, expect, it } from "vitest";
import {
  ALL_UNITS,
  BASIS_LABEL,
  COUNTRIES,
  GLOBAL_UNITS,
  countryByCode,
  unitBySlug,
  unitsOfCountry,
} from "@/lib/areaUnits";

const m2 = (slug: string) => unitBySlug(slug)!.m2;

describe("سلامة الجدول", () => {
  it("كل slug فريد — كل وحدة صفحةٌ مستقلّة ولا تحجب أخرى", () => {
    const slugs = ALL_UNITS.map((u) => u.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const keys = ALL_UNITS.map((u) => u.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("كل وحدة محلّية تنتمي لدولة معروضة، وكل مساحة موجبة محدودة", () => {
    for (const u of ALL_UNITS) {
      expect(Number.isFinite(u.m2) && u.m2 > 0).toBe(true);
      expect(BASIS_LABEL[u.basis]).toBeTruthy();
      if (u.country !== "*") expect(countryByCode(u.country), u.key).toBeDefined();
    }
    expect(GLOBAL_UNITS.every((u) => u.country === "*")).toBe(true);
  });

  it("رموز الدول فريدة", () => {
    const codes = COUNTRIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("الاشتقاقات", () => {
  it("الفدان 24 قيراطاً والقيراط 24 سهماً، والفدان 4200.83 م²", () => {
    expect(m2("feddan")).toBeCloseTo(4200.8333, 3);
    expect(m2("qirat") * 24).toBeCloseTo(m2("feddan"), 9);
    expect(m2("sahm") * 24).toBeCloseTo(m2("qirat"), 9);
  });

  it("القصبة المصرية ضلعها 3.55 م فالفدان 333.3 قصبة", () => {
    expect(m2("qasabah-murabbaa")).toBeCloseTo(12.6025, 9);
    expect(m2("feddan") / m2("qasabah-murabbaa")).toBeCloseTo(333.33, 1);
  });

  it("الفدان الإنجليزي ليس المصريّ — الفارق نحو 154 م²", () => {
    expect(Math.round(m2("feddan") - m2("acre"))).toBe(154);
  });

  it("المعاد 100 لبنة صنعاني والتهاميّ 98", () => {
    expect(m2("maad")).toBeCloseTo(m2("libnah-sanaani") * 100, 9);
    expect(m2("maad-tihami")).toBeCloseTo(m2("libnah-sanaani") * 98, 9);
  });

  it("الدونم العراقي ضعفا المتريّ ونصف، والأولك 1/100 منه", () => {
    expect(m2("dunam-iraqi") / m2("dunam")).toBe(2.5);
    expect(m2("ulk") * 100).toBe(m2("dunam-iraqi"));
  });

  it("اشتقاقات اليمن بقيم مختلفة لا رقمٌ واحد", () => {
    const libnah = unitsOfCountry("YE").filter((u) => u.key.startsWith("libnah_")).map((u) => u.m2);
    expect(new Set(libnah).size).toBe(libnah.length);
    expect(libnah.length).toBeGreaterThan(1);
  });
});

describe("البحث", () => {
  it("unitsOfCountry تُرجع وحدات الدولة المحلّية وحدها", () => {
    const eg = unitsOfCountry("EG");
    expect(eg.length).toBeGreaterThan(0);
    expect(eg.every((u) => u.country === "EG")).toBe(true);
    expect(unitsOfCountry("ZZ")).toEqual([]);
  });

  it("unitBySlug يجد الوحدات المحلّية والمعياريّة ويُرجع undefined للمجهول", () => {
    expect(unitBySlug("hectare")?.m2).toBe(10_000);
    expect(unitBySlug("libnah-dhamari")?.region).toBe("ذمار");
    expect(unitBySlug("nope")).toBeUndefined();
  });
});
