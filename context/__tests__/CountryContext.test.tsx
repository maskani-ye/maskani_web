// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Country } from "@/types";
import { endpoints as ep } from "@/lib/endpoints";

const h = vi.hoisted(() => ({
  pathname: "/" as string,
  push: vi.fn(),
  get: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => h.pathname,
  useRouter: () => ({ push: h.push, replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@/lib/api", () => ({ api: { get: h.get } }));

import { CountryProvider, useCountry } from "@/context/CountryContext";

const STORAGE_KEY = "maskani_selected_country";

function mk(id: number, code: string, name_ar: string): Country {
  return {
    id, code, name_ar, name_en: code, slug: code.toLowerCase(),
    flag_emoji: "", phone_code: "", default_currency: "USD",
  };
}
const YE = mk(1, "YE", "اليمن");
const SA = mk(2, "SA", "السعودية");
const JO = mk(3, "JO", "الأردن");
const ALL = [YE, SA, JO];

type Snapshot = { code: string; country: string | null; loading: boolean; count: number };
let renders: Snapshot[] = [];
let ctx: ReturnType<typeof useCountry> | null = null;

function Probe() {
  const c = useCountry();
  ctx = c;
  renders.push({ code: c.code, country: c.country?.code ?? null, loading: c.loading, count: c.countries.length });
  return (
    <div>
      <span data-testid="code">{c.code}</span>
      <span data-testid="country">{c.country?.code ?? "null"}</span>
      <span data-testid="loading">{String(c.loading)}</span>
      <span data-testid="count">{c.countries.length}</span>
    </div>
  );
}

function mount() {
  return render(
    <CountryProvider>
      <Probe />
    </CountryProvider>,
  );
}

const text = (id: string) => screen.getByTestId(id).textContent;

/** ينفّذ نداءات الـAPI حسب المسار: قائمة الدول، والكشف. */
function apiRoutes(opts: {
  countries?: Promise<unknown>;
  detect?: Promise<unknown>;
}) {
  h.get.mockImplementation((url: string) => {
    if (url === ep.countries) return opts.countries ?? Promise.resolve({ data: { results: ALL } });
    if (url === ep.detectCountry)
      return opts.detect ?? Promise.resolve({ data: { supported: true, country: JO } });
    return Promise.reject(new Error(`unexpected ${url}`));
  });
}

const never = () => new Promise<never>(() => {});
const detectCalls = () => h.get.mock.calls.filter(([u]) => u === ep.detectCountry).length;
const save = (c: Country) => localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")?.code ?? null;

beforeEach(() => {
  renders = [];
  ctx = null;
  localStorage.clear();
  h.pathname = "/";
  h.push.mockReset();
  h.get.mockReset();
  apiRoutes({});
});

afterEach(() => cleanup());

describe("CountryProvider — رابط السوق يملك الدولة", () => {
  it("على /ye مع «السعودية» محفوظة والطلب معلّق: الرمز YE من أوّل تصيير ولا تُكشف السعودية أبداً", async () => {
    h.pathname = "/ye";
    save(SA);
    apiRoutes({ countries: never() });
    mount();

    expect(renders[0]).toEqual({ code: "YE", country: null, loading: false, count: 0 });
    // نعطي التأثيرات وكل المهامّ الدقيقة فرصتها كاملةً.
    await act(async () => {});
    expect(renders.length).toBeGreaterThan(0);
    expect(renders.every((r) => r.code === "YE" && r.country !== "SA")).toBe(true);
    expect(text("country")).toBe("null");
    expect(text("loading")).toBe("false");
    // المحفوظ يبقى كما هو — الرابط لا يمسح اختيار الزائر.
    expect(saved()).toBe("SA");
  });

  it("على /ye مع «السعودية» محفوظة وفشل جلب القائمة: تبقى الدولة null لا السعودية", async () => {
    h.pathname = "/ye/properties";
    save(SA);
    apiRoutes({ countries: Promise.reject(new Error("offline")) });
    mount();

    await waitFor(() => expect(h.get).toHaveBeenCalledWith(ep.countries, expect.anything()));
    await act(async () => {});
    expect(renders.every((r) => r.code === "YE" && r.country !== "SA")).toBe(true);
    expect(text("country")).toBe("null");
    expect(text("count")).toBe("0");
  });

  it("على /ye مع «السعودية» محفوظة ووصول القائمة: تُطابَق الدولة باليمن بلا مرور بالسعودية", async () => {
    h.pathname = "/ye";
    save(SA);
    mount();

    await waitFor(() => expect(text("country")).toBe("YE"));
    expect(text("count")).toBe("3");
    expect(renders.some((r) => r.country === "SA")).toBe(false);
    expect(detectCalls()).toBe(0);
  });

  it("على /sa مع «السعودية» محفوظة: تُكشف السعودية قبل وصول القائمة", async () => {
    h.pathname = "/sa/services";
    save(SA);
    apiRoutes({ countries: never() });
    mount();

    await waitFor(() => expect(text("country")).toBe("SA"));
    expect(text("code")).toBe("SA");
    expect(text("loading")).toBe("false");
  });

  it("داخل سوق بلا محفوظ لا يُسأل الخادم عن بلد الزائر", async () => {
    h.pathname = "/jo";
    mount();

    await waitFor(() => expect(text("country")).toBe("JO"));
    expect(detectCalls()).toBe(0);
    expect(saved()).toBeNull();
  });
});

describe("CountryProvider — البوّابة / بلا سوق", () => {
  it("الاختيار المحفوظ يفوز ولا يُستدعى الكشف", async () => {
    save(JO);
    apiRoutes({ detect: Promise.resolve({ data: { supported: true, country: SA } }) });
    mount();

    await waitFor(() => expect(text("loading")).toBe("false"));
    expect(text("country")).toBe("JO");
    expect(text("code")).toBe("JO");
    expect(detectCalls()).toBe(0);
    expect(saved()).toBe("JO");
  });

  it("الرمز فارغ وloading صحيح قبل اكتمال التحديد", () => {
    apiRoutes({ countries: never() });
    mount();
    expect(renders[0]).toEqual({ code: "", country: null, loading: true, count: 0 });
  });

  it("بلا محفوظ: يكشف مرّة واحدة ويحفظ النتيجة", async () => {
    apiRoutes({ detect: Promise.resolve({ data: { supported: true, country: SA } }) });
    mount();

    await waitFor(() => expect(text("country")).toBe("SA"));
    expect(text("loading")).toBe("false");
    expect(detectCalls()).toBe(1);
    expect(saved()).toBe("SA");
  });

  it("بلا محفوظ وكشفٌ بلا دولة مدعومة: يقع على أوّل دولة في القائمة ويحفظها", async () => {
    apiRoutes({ detect: Promise.resolve({ data: { supported: false, country: null } }) });
    mount();

    await waitFor(() => expect(text("country")).toBe("YE"));
    expect(saved()).toBe("YE");
  });

  it("قيمة محفوظة تالفة تُعامَل كغياب الاختيار فيجري الكشف", async () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    mount();

    await waitFor(() => expect(text("country")).toBe("JO"));
    expect(detectCalls()).toBe(1);
  });

  it("فشل الكشف لا يُعلّق الواجهة: loading يصير false بلا دولة", async () => {
    apiRoutes({ detect: Promise.reject(new Error("offline")) });
    mount();

    await waitFor(() => expect(text("loading")).toBe("false"));
    expect(text("country")).toBe("null");
    expect(saved()).toBeNull();
  });
});

describe("CountryProvider — setCountry", () => {
  it("داخل سوق: ينقل إلى رابط السوق الجديد بنفس القسم ويحفظ الاختيار", async () => {
    h.pathname = "/ye/services/12";
    mount();
    await waitFor(() => expect(text("country")).toBe("YE"));

    act(() => ctx!.setCountry(JO));
    expect(h.push).toHaveBeenCalledTimes(1);
    expect(h.push).toHaveBeenCalledWith("/jo/services/12");
    expect(saved()).toBe("JO");
    // العنوان لم يتغيّر بعد (الانتقال لم يقع) — فلا تُكشف دولة تخالفه، وتُعاد
    // مطابقة الكائن بسوق الرابط.
    expect(text("code")).toBe("YE");
    expect(text("country")).toBe("YE");
    expect(renders.some((r) => r.country === "JO")).toBe(false);
  });

  it("من واجهة السوق /ye ينقل إلى /sa بلا لاحقة", async () => {
    h.pathname = "/ye";
    mount();
    await waitFor(() => expect(text("count")).toBe("3"));

    act(() => ctx!.setCountry(SA));
    expect(h.push).toHaveBeenCalledWith("/sa");
  });

  it("اختيار سوق الرابط نفسه لا يُطلق انتقالاً", async () => {
    h.pathname = "/sa/properties";
    mount();
    await waitFor(() => expect(text("country")).toBe("SA"));

    act(() => ctx!.setCountry(SA));
    expect(h.push).not.toHaveBeenCalled();
  });

  it("بعد التنقّل داخل التطبيق تُحسب الوجهة من المسار **الحاليّ** لا من أوّل تحميل", async () => {
    // دخل على /ye ثم انتقل إلى صفحة اختيار الموقع (بلا سوق في الرابط): لا انتقال.
    h.pathname = "/ye";
    const view = mount();
    await waitFor(() => expect(text("count")).toBe("3"));
    h.pathname = "/location";
    view.rerender(<CountryProvider><Probe /></CountryProvider>);
    act(() => ctx!.setCountry(SA));
    expect(h.push).not.toHaveBeenCalled();
    cleanup();

    // دخل على / ثم انتقل إلى /ye/services: الاختيار يفتح القسم نفسه في السوق الآخر.
    h.pathname = "/";
    const view2 = mount();
    await waitFor(() => expect(text("count")).toBe("3"));
    h.pathname = "/ye/services";
    view2.rerender(<CountryProvider><Probe /></CountryProvider>);
    act(() => ctx!.setCountry(SA));
    expect(h.push).toHaveBeenCalledWith("/sa/services");
  });

  it("على / يغيّر الدولة في مكانها بلا انتقال ويحفظها", async () => {
    save(YE);
    mount();
    await waitFor(() => expect(text("loading")).toBe("false"));

    act(() => ctx!.setCountry(SA));
    expect(h.push).not.toHaveBeenCalled();
    expect(text("country")).toBe("SA");
    expect(text("code")).toBe("SA");
    expect(saved()).toBe("SA");
  });
});

describe("useCountry", () => {
  it("يرمي خارج CountryProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow("useCountry must be used within CountryProvider");
    spy.mockRestore();
  });
});
