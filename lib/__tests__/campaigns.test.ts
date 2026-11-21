import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  campaignClickUrl,
  detectPlatform,
  fetchCampaign,
  isShown,
  markShown,
  onShownChange,
} from "@/lib/campaigns";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const servedQuery = () => new URL(fetchMock.mock.calls[0][0] as string).searchParams;

describe("fetchCampaign", () => {
  it("يطلب serve بالموضع والدولة بحروف كبيرة، والدولة تغلب المدينة", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
    await fetchCampaign("blog_article", { country: "ye", city: 5, platform: "android" });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/campaigns/serve/?");
    const q = servedQuery();
    expect(q.get("placement")).toBe("blog_article");
    expect(q.get("country")).toBe("YE");
    expect(q.has("city")).toBe(false);
    expect(q.get("platform")).toBe("android");
  });

  it("بلا دولة تُرسَل المدينة ليشتقّ الخادم السوق", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
    await fetchCampaign("properties_list", { city: 12 });
    expect(servedQuery().get("city")).toBe("12");
    expect(servedQuery().has("country")).toBe(false);
  });

  it("الموضوع يُسقط الفارغ ويُجمع بمسافات ويُقصّ عند 400 حرف", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    await fetchCampaign("tool_page", { topic: ["دونم", null, "", undefined, "فدان"] });
    expect(servedQuery().get("topic")).toBe("دونم فدان");

    fetchMock.mockClear();
    await fetchCampaign("tool_page", { topic: ["أ".repeat(500)] });
    expect(servedQuery().get("topic")).toHaveLength(400);

    fetchMock.mockClear();
    await fetchCampaign("tool_page", { topic: [null] });
    expect(servedQuery().has("topic")).toBe(false);
  });

  it("200 يُرجع الإعلان، وأيّ حالة أخرى = لا إعلان", async () => {
    const c = { id: 3, headline: "h" };
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(c), { status: 200 }));
    expect(await fetchCampaign("app_home")).toEqual(c);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    expect(await fetchCampaign("app_home")).toBeNull();
    fetchMock.mockResolvedValueOnce(new Response("err", { status: 500 }));
    expect(await fetchCampaign("app_home")).toBeNull();
  });

  it("لا يرمي أبداً: فشل الشبكة أو JSON معطوب = null", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("blocked"));
    expect(await fetchCampaign("site_wide")).toBeNull();
    fetchMock.mockResolvedValueOnce(new Response("not json", { status: 200 }));
    expect(await fetchCampaign("site_wide")).toBeNull();
  });

  it("رابط النقرة يمرّ بالخادم ليعدّها", () => {
    expect(campaignClickUrl(9)).toMatch(/\/campaigns\/9\/click\/$/);
  });
});

describe("detectPlatform", () => {
  const ua = (userAgent: string, maxTouchPoints = 0) =>
    vi.stubGlobal("navigator", { userAgent, maxTouchPoints });

  it("أندرويد وآيفون من وكيل المتصفّح", () => {
    ua("Mozilla/5.0 (Linux; Android 14; Pixel 8)");
    expect(detectPlatform()).toBe("android");
    ua("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)");
    expect(detectPlatform()).toBe("ios");
  });

  it("آيباد يتنكّر Macintosh فيكشفه اللمس، والماك بلا لمس كمبيوتر", () => {
    ua("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5);
    expect(detectPlatform()).toBe("ios");
    ua("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0);
    expect(detectPlatform()).toBe("desktop");
    ua("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    expect(detectPlatform()).toBe("desktop");
  });
});

describe("منع التكرار", () => {
  it("عدّاد مرجعيّ: يبقى ظاهراً حتى يُحرَّر آخر موضع", () => {
    const releaseA = markShown(101);
    const releaseB = markShown(101);
    expect(isShown(101)).toBe(true);
    releaseA();
    expect(isShown(101)).toBe(true);
    releaseB();
    expect(isShown(101)).toBe(false);
  });

  it("المستمعون يُبلَّغون عند العرض والتحرير ويتوقّفون بعد إلغاء الاشتراك", () => {
    const l = vi.fn();
    const off = onShownChange(l);
    const release = markShown(202);
    release();
    expect(l).toHaveBeenCalledTimes(2);
    off();
    markShown(203)();
    expect(l).toHaveBeenCalledTimes(2);
    expect(isShown(202)).toBe(false);
  });
});
