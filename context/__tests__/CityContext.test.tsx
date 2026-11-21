// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type City = { id: number; name_ar: string };

const h = vi.hoisted(() => ({
  country: { code: "YE", loading: false } as { code: string; loading: boolean },
  auth: { user: null as null | { id: number; city: number | null }, refreshUser: vi.fn() },
  get: vi.fn(),
  patch: vi.fn(),
}));

vi.mock("@/context/CountryContext", () => ({ useCountry: () => h.country }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => h.auth }));
vi.mock("@/lib/api", () => ({ api: { get: h.get, patch: h.patch } }));

import { CityProvider, useCity } from "@/context/CityContext";

const STORAGE_KEY = "maskani_selected_city";

const CITIES: Record<string, City[]> = {
  YE: [{ id: 1, name_ar: "صنعاء" }, { id: 2, name_ar: "عدن" }],
  SA: [{ id: 10, name_ar: "الرياض" }, { id: 11, name_ar: "جدة" }],
  JO: [],
};

let ctx: ReturnType<typeof useCity> | null = null;
function Probe() {
  const c = useCity();
  ctx = c;
  return (
    <div>
      <span data-testid="id">{c.cityId}</span>
      <span data-testid="name">{c.cityName}</span>
      <span data-testid="count">{c.cities.length}</span>
      <span data-testid="loading">{String(c.loading)}</span>
    </div>
  );
}

const tree = () => (
  <CityProvider>
    <Probe />
  </CityProvider>
);
const text = (id: string) => screen.getByTestId(id).textContent;
const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
const save = (v: unknown) =>
  localStorage.setItem(STORAGE_KEY, typeof v === "string" ? v : JSON.stringify(v));
const cityCalls = () => h.get.mock.calls.filter(([u]) => u === "/cities/");

beforeEach(() => {
  ctx = null;
  localStorage.clear();
  h.country = { code: "YE", loading: false };
  h.auth = { user: null, refreshUser: vi.fn(() => Promise.resolve()) };
  h.get.mockReset();
  h.patch.mockReset();
  h.get.mockImplementation((_url: string, cfg: { params: { country: string } }) =>
    Promise.resolve({ data: { results: CITIES[cfg.params.country] ?? [] } }),
  );
  h.patch.mockImplementation(() => Promise.resolve({ data: {} }));
});

afterEach(() => cleanup());

describe("CityProvider — المدينة المحفوظة تُطابَق مع سوق الرابط", () => {
  it("مدينة محفوظة لسوقٍ آخر تُحذف قبل أيّ جلب ولا تُستبدل بعاصمة في أوّل زيارة", async () => {
    save({ id: 11, name: "جدة", country: "SA" });
    render(tree());

    // لا تُعرض جدة ولو لتصييرة واحدة على سوق اليمن.
    expect(text("id")).toBe("");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    await waitFor(() => expect(text("loading")).toBe("false"));
    expect(text("count")).toBe("2");
    // تبقى فارغة كي يظهر اختيار المدينة الإجباري.
    expect(text("id")).toBe("");
  });

  it("المحفوظ بصيغة ما قبل تعدّد الأسواق (بلا دولة) يُرفض", async () => {
    save({ id: 1, name: "صنعاء" });
    render(tree());
    await waitFor(() => expect(text("loading")).toBe("false"));
    expect(text("id")).toBe("");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("مدينة محفوظة لهذا السوق وموجودة في قائمته تبقى كما هي", async () => {
    save({ id: 2, name: "عدن", country: "YE" });
    render(tree());

    await waitFor(() => expect(text("count")).toBe("2"));
    expect(text("id")).toBe("2");
    expect(text("name")).toBe("عدن");
    expect(cityCalls()[0][1]).toEqual({ params: { limit: 100, country: "YE" } });
    // لا إعادة كتابة: المحفوظ يبقى كما هو.
    expect(stored()).toEqual({ id: 2, name: "عدن", country: "YE" });
  });

  it("مدينة محفوظة لهذا السوق لم تعد في قائمته تُستبدل بأولى مدنه (العاصمة)", async () => {
    save({ id: 99, name: "محذوفة", country: "YE" });
    render(tree());

    await waitFor(() => expect(text("id")).toBe("1"));
    expect(text("name")).toBe("صنعاء");
    expect(stored()).toEqual({ id: "1", name: "صنعاء", country: "YE" });
  });

  it("فشل جلب المدن يُبقي المحفوظ بدل إفراغ اختيار الزائر", async () => {
    save({ id: 2, name: "عدن", country: "YE" });
    h.get.mockImplementation(() => Promise.reject(new Error("offline")));
    render(tree());

    await waitFor(() => expect(text("loading")).toBe("false"));
    expect(text("id")).toBe("2");
    expect(stored()).toEqual({ id: 2, name: "عدن", country: "YE" });
  });
});

describe("CityProvider — تبديل السوق", () => {
  it("تبديل الدولة يمسح المدينة ثم ينتقي عاصمة السوق الجديد ويحفظها بانتمائها", async () => {
    save({ id: 2, name: "عدن", country: "YE" });
    const r = render(tree());
    await waitFor(() => expect(text("id")).toBe("2"));

    // قائمة السوق الجديد معلّقة: المسح يجب أن يقع قبل وصولها.
    let release!: () => void;
    h.get.mockImplementation(
      () =>
        new Promise((res) => {
          release = () => res({ data: { results: CITIES.SA } });
        }),
    );
    h.country = { code: "SA", loading: false };
    r.rerender(tree());

    await waitFor(() => expect(text("id")).toBe(""));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(cityCalls().at(-1)?.[1]).toEqual({ params: { limit: 100, country: "SA" } });

    await act(async () => release());
    expect(text("id")).toBe("10");
    expect(text("name")).toBe("الرياض");
    expect(stored()).toEqual({ id: "10", name: "الرياض", country: "SA" });
  });

  it("سوق بلا مدن بعد التبديل يُبقي المدينة فارغة", async () => {
    save({ id: 1, name: "صنعاء", country: "YE" });
    const r = render(tree());
    await waitFor(() => expect(text("id")).toBe("1"));

    h.country = { code: "JO", loading: false };
    r.rerender(tree());
    await waitFor(() => expect(text("count")).toBe("0"));
    expect(text("id")).toBe("");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("CityProvider — الانتظار والكتابة", () => {
  it("لا يجلب المدن ما دامت الدولة قيد التحديد، ثم يجلب حين تُعرف", async () => {
    h.country = { code: "", loading: true };
    const r = render(tree());
    await act(async () => {});
    expect(cityCalls()).toHaveLength(0);
    expect(text("loading")).toBe("true");

    h.country = { code: "SA", loading: false };
    r.rerender(tree());
    await waitFor(() => expect(text("count")).toBe("2"));
    expect(text("loading")).toBe("false");
  });

  it("بلا دولة معروفة ينتهي التحميل بلا جلب", async () => {
    h.country = { code: "", loading: false };
    render(tree());
    await waitFor(() => expect(text("loading")).toBe("false"));
    expect(cityCalls()).toHaveLength(0);
  });

  it("setCity يحفظ المدينة مع رمز السوق الحاليّ، والقيمة الفارغة تمسحها", async () => {
    h.country = { code: "SA", loading: false };
    render(tree());
    await waitFor(() => expect(text("loading")).toBe("false"));

    act(() => ctx!.setCity("11", "جدة"));
    expect(text("id")).toBe("11");
    expect(stored()).toEqual({ id: "11", name: "جدة", country: "SA" });

    act(() => ctx!.setCity("", ""));
    expect(text("id")).toBe("");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("CityProvider — مزامنة المدينة إلى الحساب", () => {
  it("مستخدم بلا مدينة في ملفّه: تُرسل المدينة المختارة مرّة ثم يُحدَّث الملف", async () => {
    h.auth.user = { id: 7, city: null };
    save({ id: 2, name: "عدن", country: "YE" });
    const r = render(tree());

    await waitFor(() => expect(h.auth.refreshUser).toHaveBeenCalledTimes(1));
    expect(h.patch).toHaveBeenCalledTimes(1);
    expect(h.patch).toHaveBeenCalledWith("/auth/me/", { city: 2 });

    // إعادة التصيير بالمدينة نفسها لا تكرّر الإرسال.
    r.rerender(tree());
    await act(async () => {});
    expect(h.patch).toHaveBeenCalledTimes(1);
  });

  it("لا يطغى على مدينةٍ ضبطها المستخدم في ملفّه", async () => {
    h.auth.user = { id: 7, city: 1 };
    save({ id: 2, name: "عدن", country: "YE" });
    render(tree());
    await waitFor(() => expect(text("count")).toBe("2"));
    expect(h.patch).not.toHaveBeenCalled();
  });
});

describe("useCity", () => {
  it("يرمي خارج CityProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow("useCity must be used within CityProvider");
    spy.mockRestore();
  });
});
