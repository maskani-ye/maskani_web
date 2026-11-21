// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getToken = vi.hoisted(() => vi.fn<() => string | undefined>());
vi.mock("@/lib/auth", () => ({ getToken }));

import {
  targetFromPath,
  trackPageview,
  trackVisitEvent,
  utmFromSearch,
  visitorId,
} from "@/lib/track";

const fetchMock = vi.fn();

beforeEach(() => {
  localStorage.clear();
  getToken.mockReset();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const sent = () => {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return { url, init, body: JSON.parse(init.body as string) };
};

describe("targetFromPath — نسبة المشاهدة إلى كيانها", () => {
  it("يستنبط النوع والمعرّف، ويتخطّى بادئة السوق والاستعلام", () => {
    expect(targetFromPath("/properties/12")).toEqual({ target_type: "property", target_id: 12 });
    expect(targetFromPath("/sa/properties/12?ref=wa")).toEqual({ target_type: "property", target_id: 12 });
    expect(targetFromPath("/ye/jobs/3/edit")).toEqual({ target_type: "job", target_id: 3 });
    expect(targetFromPath("/users/5")).toEqual({ target_type: "user", target_id: 5 });
  });

  it("المسارات الوصفية والقوائم بلا كيان", () => {
    for (const p of ["/properties/city/riyadh", "/properties", "/ye", "/", "/properties/12abc", "/blog/how-to"]) {
      expect(targetFromPath(p), p).toEqual({});
    }
  });
});

describe("utmFromSearch", () => {
  it("يأخذ مفاتيح الحملة الثلاثة غير الفارغة وحدها", () => {
    const sp = new URLSearchParams("utm_source=fb&utm_medium=&utm_campaign=eid&utm_term=x&q=1");
    expect(utmFromSearch(sp)).toEqual({ utm_source: "fb", utm_campaign: "eid" });
    expect(utmFromSearch(null)).toEqual({});
  });
});

describe("visitorId", () => {
  it("ثابت عبر النداءات ومحفوظ", () => {
    const a = visitorId();
    expect(a).toBeTruthy();
    expect(visitorId()).toBe(a);
    expect(localStorage.getItem("mk_vid")).toBe(a);
  });

  it("التخزين المحجوب يُرجع نصّاً فارغاً لا استثناء", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(visitorId()).toBe("");
  });
});

describe("trackPageview", () => {
  it("POST مع keepalive بجلسة ومنصّة ويب ونسبة الكيان", () => {
    trackPageview("/ye/properties/7");
    const { url, init, body } = sent();
    expect(url).toMatch(/\/analytics\/track\/$/);
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    expect(body).toMatchObject({
      session_id: visitorId(),
      platform: "web",
      target_type: "property",
      target_id: 7,
      path: "/ye/properties/7",
      referrer: "",
    });
  });

  it("ترويسة المصادقة حين يوجد توكن وحده (عطل ٥٢٬٩٠٢ زيارة بلا نسبة)", () => {
    getToken.mockReturnValue("knox1");
    trackPageview("/");
    expect((sent().init.headers as Record<string, string>).Authorization).toBe("Token knox1");

    fetchMock.mockClear();
    getToken.mockReturnValue(undefined);
    trackPageview("/");
    expect(sent().init.headers).not.toHaveProperty("Authorization");
  });

  it("المدينة المختارة تُرسَل، والمخزَّن المعطوب يُتجاهل", () => {
    localStorage.setItem("maskani_selected_city", JSON.stringify({ id: 4, name: "عدن" }));
    trackPageview("/");
    expect(sent().body.city_id).toBe("4");

    fetchMock.mockClear();
    localStorage.setItem("maskani_selected_city", "{broken");
    trackPageview("/");
    expect(sent().body).not.toHaveProperty("city_id");
  });

  it("الإضافات تغلب الحقول المستنبطة", () => {
    trackPageview("/properties/1", { referrer: "https://google.com", utm_source: "g" });
    expect(sent().body).toMatchObject({ referrer: "https://google.com", utm_source: "g" });
  });

  it("فشل الجلب لا يكسر الواجهة ولا يترك رفضاً معلّقاً", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    expect(() => trackPageview("/")).not.toThrow();
    fetchMock.mockImplementationOnce(() => {
      throw new TypeError("sync");
    });
    expect(() => trackPageview("/")).not.toThrow();
    await Promise.resolve();
  });
});

describe("trackVisitEvent", () => {
  it("حدث باسمه وهدفه وخصائصه", () => {
    trackVisitEvent("whatsapp_click", { targetType: "property", targetId: 9, path: "/ye/properties/9", props: { q: "شقة" } });
    expect(sent().body).toMatchObject({
      kind: "event",
      event_name: "whatsapp_click",
      path: "/ye/properties/9",
      target_type: "property",
      target_id: 9,
      props: { q: "شقة" },
    });
  });

  it("المسار الافتراضي من الصفحة الحالية، وبلا props لا يُرسل المفتاح", () => {
    window.history.pushState({}, "", "/sa/services/3");
    trackVisitEvent("contact_click");
    const { body } = sent();
    expect(body.path).toBe("/sa/services/3");
    expect(body).not.toHaveProperty("props");
  });
});
