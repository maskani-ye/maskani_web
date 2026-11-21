import { afterEach, describe, expect, it, vi } from "vitest";
import { isAdFreePath, isManualAdsPath } from "@/lib/ads";

describe("isAdFreePath — قائمة سماح لا قائمة منع", () => {
  it("المسارات المؤهَّلة وحدها: البوّابة والأدوات والمدونة", () => {
    for (const p of ["/", "/tools", "/tools/area-converter", "/blog", "/blog/some-article"]) {
      expect(isAdFreePath(p)).toBe(false);
    }
  });

  it("كل صفحةٍ جديدة تولد بلا إعلان: الأسواق والعقارات والخدمات والبلاغات", () => {
    for (const p of [
      "/ye", "/sa/properties", "/properties/5", "/properties/city/sanaa", "/market/ye",
      "/services", "/requests", "/reports", "/download", "/location",
    ]) {
      expect(isAdFreePath(p)).toBe(true);
    }
  });

  it("البادئة المشابهة لا تتسلّل إلى القائمة", () => {
    expect(isAdFreePath("/toolsx")).toBe(true);
    expect(isAdFreePath("/blogger")).toBe(true);
    expect(isAdFreePath("/ye/tools")).toBe(true);
  });

  it("المسار المجهول أو الفارغ بلا إعلان", () => {
    expect(isAdFreePath(null)).toBe(true);
    expect(isAdFreePath("")).toBe(true);
  });
});

describe("isManualAdsPath — المدونة تقرّر من بياناتها", () => {
  it("قائمة المدونة ومقالاتها لا يُحمَّل فيها السكربت من الجذر", () => {
    expect(isManualAdsPath("/blog")).toBe(true);
    expect(isManualAdsPath("/blog/article")).toBe(true);
  });

  it("ما سوى المدونة ليس يدوياً", () => {
    for (const p of [null, "", "/", "/tools", "/blogger", "/ye/blog"]) {
      expect(isManualAdsPath(p)).toBe(false);
    }
  });
});

describe("adsEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  const load = async (value: string | undefined) => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_ADS_ENABLED", value as string);
    return (await import("@/lib/ads")).adsEnabled;
  };

  it("تُطفأ بالقيمة false حرفياً وحدها", async () => {
    expect(await load("false")).toBe(false);
  });

  it("تبقى عاملة لأيّ قيمة أخرى أو عند الغياب", async () => {
    expect(await load(undefined)).toBe(true);
    expect(await load("0")).toBe(true);
    expect(await load("true")).toBe(true);
  });

  it("الشريحة غير المضبوطة فارغة فلا يُرسم مربّع إعلان", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_SLOT_LIST", "");
    const { AD_SLOTS } = await import("@/lib/ads");
    expect(AD_SLOTS.listBottom).toBe("");
  });
});
