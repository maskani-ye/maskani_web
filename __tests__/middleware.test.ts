import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { NextFetchEvent } from "next/server";
import { config, middleware } from "@/middleware";

const ORIGIN = "https://maskani.homes";
const HUMAN_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const GOOGLEBOT_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

function makeEvent() {
  const waitUntil = vi.fn();
  return { event: { waitUntil } as unknown as NextFetchEvent, waitUntil };
}

function run(path: string, headers: Record<string, string> = {}) {
  const { event, waitUntil } = makeEvent();
  const req = new NextRequest(`${ORIGIN}${path}`, {
    headers: { "user-agent": HUMAN_UA, ...headers },
  });
  return { res: middleware(req, event), waitUntil };
}

/** وجهة التحويل كمسار + استعلام (الأصل ثابت في كل الطلبات). */
function location(res: Response): string {
  const loc = res.headers.get("location");
  expect(loc).toBeTruthy();
  const u = new URL(loc as string);
  expect(u.origin).toBe(ORIGIN);
  return u.pathname + u.search;
}

function rewriteTarget(res: Response): string | null {
  const r = res.headers.get("x-middleware-rewrite");
  return r ? new URL(r).pathname : null;
}

function isPassThrough(res: Response): boolean {
  return (
    res.headers.get("x-middleware-next") === "1" &&
    !res.headers.get("location") &&
    !res.headers.get("x-middleware-rewrite")
  );
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(() => Promise.resolve(new Response("{}", { status: 200 })));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("middleware — مسارات الأسواق", () => {
  it("يحوّل /market/xx القديم تحويلاً دائماً 308 إلى /xx", () => {
    for (const path of ["/market/ye", "/market/sa"]) {
      const { res } = run(path);
      expect(res.status).toBe(308);
      expect(location(res)).toBe(`/${path.split("/")[2]}`);
    }
  });

  it("لا يحوّل /market/<رمز غير معروف> ولا يعيد كتابته", () => {
    const { res } = run("/market/zz");
    expect(isPassThrough(res)).toBe(true);
  });

  it("يعيد كتابة كل سوق صالح /xx إلى /market/xx مع إبقاء الرابط الظاهر", () => {
    for (const code of ["ye", "sa", "jo", "eg", "iq", "om"]) {
      const { res } = run(`/${code}`);
      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
      expect(rewriteTarget(res)).toBe(`/market/${code}`);
    }
  });

  it("لا يعيد كتابة رمز من حرفين ليس سوقاً ولا رمزاً بأحرف كبيرة", () => {
    for (const path of ["/xx", "/us", "/YE"]) {
      const { res } = run(path);
      expect(isPassThrough(res)).toBe(true);
    }
  });

  it("لا يلمس أقسام السوق نفسها (/ye/properties) ولا البوّابة /", () => {
    for (const path of ["/ye/properties", "/sa/services", "/"]) {
      expect(isPassThrough(run(path).res)).toBe(true);
    }
  });
});

describe("middleware — الأقسام القديمة بلا بادئة سوق", () => {
  it("يحوّل كل قسم قديم 308 إلى /ye/<القسم> حين لا كعكة سوق", () => {
    for (const section of ["properties", "services", "requests", "jobs"]) {
      const { res } = run(`/${section}`);
      expect(res.status).toBe(308);
      expect(location(res)).toBe(`/ye/${section}`);
    }
  });

  it("يقرأ الوجهة من كعكة mk_market (بأيّ حالة أحرف) ويحفظ الاستعلام", () => {
    const { res } = run("/properties?offer_type=sale&offset=20", {
      cookie: "mk_market=SA",
    });
    expect(res.status).toBe(308);
    expect(location(res)).toBe("/sa/properties?offer_type=sale&offset=20");
  });

  it("يقع على السوق الافتراضي حين تحمل الكعكة رمزاً غير معروف", () => {
    const { res } = run("/jobs", { cookie: "mk_market=zz" });
    expect(location(res)).toBe("/ye/jobs");
  });

  it("لا يحوّل صفحات التفاصيل تحت الأقسام القديمة (/properties/<id>)", () => {
    for (const path of ["/properties/123", "/services/7/edit"]) {
      expect(isPassThrough(run(path, { cookie: "mk_market=sa" }).res)).toBe(true);
    }
  });
});

describe("middleware — تسجيل مشاهدات الزواحف", () => {
  it("يسجّل مشاهدة الزاحف عبر waitUntil بنداء واحد لنقطة التحليلات", async () => {
    const { res, waitUntil } = run("/ye/properties", {
      "user-agent": GOOGLEBOT_UA,
      referer: "https://www.google.com/",
    });
    expect(isPassThrough(res)).toBe(true);
    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url.endsWith("/analytics/track/")).toBe(true);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      path: "/ye/properties",
      user_agent: GOOGLEBOT_UA,
      platform: "web",
      kind: "view",
      referrer: "https://www.google.com/",
    });
    await expect(waitUntil.mock.calls[0][0]).resolves.toBeInstanceOf(Response);
  });

  it("يتعرّف على زواحف المشاركة والذكاء الاصطناعي لا محرّكات البحث وحدها", () => {
    for (const ua of ["WhatsApp/2.23.20.0", "Mozilla/5.0 (compatible; GPTBot/1.2)", "ClaudeBot/1.0"]) {
      const { waitUntil } = run("/", { "user-agent": ua });
      expect(waitUntil).toHaveBeenCalledTimes(1);
    }
  });

  it("لا يسجّل شيئاً للزائر البشري ولا لطلب بلا user-agent", () => {
    const human = run("/ye");
    expect(human.waitUntil).not.toHaveBeenCalled();
    const { event, waitUntil } = makeEvent();
    middleware(new NextRequest(`${ORIGIN}/ye`), event);
    expect(waitUntil).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("فشل نداء التحليلات لا يرمي ولا يغيّر استجابة الزاحف", async () => {
    fetchMock.mockImplementation(() => Promise.reject(new Error("offline")));
    const { res, waitUntil } = run("/properties", { "user-agent": GOOGLEBOT_UA });
    expect(res.status).toBe(308);
    expect(location(res)).toBe("/ye/properties");
    await expect(waitUntil.mock.calls[0][0]).resolves.toBeUndefined();
  });

  it("يسجّل الزاحف بالمسار الأصلي قبل التحويل أو إعادة الكتابة", () => {
    run("/market/sa", { "user-agent": GOOGLEBOT_UA });
    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.path).toBe("/market/sa");
  });
});

describe("middleware — نطاق المطابقة (config.matcher)", () => {
  const matcher = new RegExp(`^${config.matcher[0]}$`);

  it("يستثني الأصول الثابتة والـAPI ولوحة الإدارة وملفّات الزحف", () => {
    for (const path of [
      "/_next/static/chunks/main.js",
      "/_next/image",
      "/favicon.ico",
      "/robots.txt",
      "/sitemap.xml",
      "/manifest.webmanifest",
      "/api/revalidate",
      "/admin",
      "/admin/properties",
    ]) {
      expect(matcher.test(path), path).toBe(false);
    }
  });

  it("يشمل صفحات المحتوى والأسواق والأقسام القديمة", () => {
    for (const path of ["/", "/ye", "/market/ye", "/properties", "/sa/properties/12", "/blog/x"]) {
      expect(matcher.test(path), path).toBe(true);
    }
  });
});
