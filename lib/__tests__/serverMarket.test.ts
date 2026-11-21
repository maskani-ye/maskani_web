import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ headers: headersMock }));

import { detectMarket, marketByCode } from "@/lib/serverMarket";

const fetchMock = vi.fn();

const ROWS = [
  {
    code: "YE", name_ar: "اليمن", slug: "yemen", properties_count: 900,
    hero_image: "https://r2/ye.webp", hero_credit: "CC",
    cities: [{ name_ar: "صنعاء" }, { name_ar: "عدن" }, { name_ar: "تعز" }, { name_ar: "إب" }],
  },
  { code: "SA", name_ar: "السعودية", slug: "saudi-arabia" },
];

const ok = (rows: unknown[]) => new Response(JSON.stringify({ count: rows.length, results: rows }), { status: 200 });

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockReset();
  headersMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("marketByCode", () => {
  it("يطابق الرمز بلا حساسية للحالة ويأخذ ثلاث مدن", async () => {
    fetchMock.mockResolvedValueOnce(ok(ROWS));
    expect(await marketByCode("ye")).toEqual({
      code: "YE", nameAr: "اليمن", slug: "yemen", cities: ["صنعاء", "عدن", "تعز"],
      count: 900, heroImage: "https://r2/ye.webp", heroCredit: "CC",
    });
  });

  it("الحقول الغائبة تأخذ قيماً آمنة", async () => {
    fetchMock.mockResolvedValueOnce(ok(ROWS));
    expect(await marketByCode("SA")).toMatchObject({ cities: [], count: 0, heroImage: null, heroCredit: "" });
  });

  it("رمزٌ غير مفعّل في قائمة حقيقية = null (404 مشروع)", async () => {
    fetchMock.mockResolvedValueOnce(ok(ROWS));
    expect(await marketByCode("om")).toBeNull();
  });

  it("يجلب بعمر ساعة، والإعادة تكسر دمج fetch ببارامتر _r", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 502 })).mockResolvedValueOnce(ok(ROWS));
    const p = marketByCode("YE");
    await vi.advanceTimersByTimeAsync(1000);
    expect(await p).not.toBeNull();
    const [first, init] = fetchMock.mock.calls[0];
    expect(first).toMatch(/\/cities\/countries\/\?limit=100$/);
    expect(init).toEqual({ next: { revalidate: 3600 } });
    expect(fetchMock.mock.calls[1][0]).toMatch(/&_r=1$/);
  });

  it("القائمة الفارغة والاستثناء فشلٌ يُعاد بتراجع 1·2·4·8 ثوانٍ", async () => {
    fetchMock
      .mockResolvedValueOnce(ok([]))
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(new Response("not json", { status: 200 }))
      .mockResolvedValueOnce(ok(ROWS));
    const p = marketByCode("YE");
    const counts: number[] = [];
    for (const step of [1000, 2000, 4000]) {
      await vi.advanceTimersByTimeAsync(step - 1);
      counts.push(fetchMock.mock.calls.length);
      await vi.advanceTimersByTimeAsync(1);
    }
    expect(counts).toEqual([1, 2, 3]);
    expect((await p)?.code).toBe("YE");
  });

  it("يرمي بعد خمس محاولات فاشلة بدل خبز 404 لكل الأسواق", async () => {
    fetchMock.mockImplementation(async () => new Response("", { status: 503 }));
    const p = marketByCode("YE");
    const assertion = expect(p).rejects.toThrow(/خمس محاولات/);
    await vi.advanceTimersByTimeAsync(31_000);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
});

describe("detectMarket", () => {
  const withCountry = (code: string | null) =>
    headersMock.mockResolvedValue(new Headers(code ? { "cf-ipcountry": code } : {}));

  it("سوق الزائر من cf-ipcountry بأيّ حالة أحرف", async () => {
    withCountry("sa");
    fetchMock.mockResolvedValueOnce(ok(ROWS));
    expect((await detectMarket()).code).toBe("SA");
  });

  it("دولةٌ بلا سوق أو بلا ترويسة (الزاحف) تقع على أوّل سوق", async () => {
    withCountry("US");
    fetchMock.mockImplementation(async () => ok(ROWS));
    expect((await detectMarket()).code).toBe("YE");
    withCountry(null);
    expect((await detectMarket()).code).toBe("YE");
  });

  it("خارج سياق الطلب لا يرمي", async () => {
    headersMock.mockRejectedValue(new Error("outside request scope"));
    fetchMock.mockResolvedValueOnce(ok(ROWS));
    expect((await detectMarket()).code).toBe("YE");
  });

  it("تعذّر الجلب نهائياً يُسامَح بالسوق الاحتياطيّ لا شاشة بيضاء", async () => {
    withCountry("SA");
    fetchMock.mockImplementation(async () => new Response("", { status: 500 }));
    const p = detectMarket();
    await vi.advanceTimersByTimeAsync(31_000);
    expect(await p).toEqual({
      code: "YE", nameAr: "اليمن", slug: "yemen", cities: ["صنعاء", "عدن", "تعز"],
      count: 0, heroImage: null, heroCredit: "",
    });
  });
});
