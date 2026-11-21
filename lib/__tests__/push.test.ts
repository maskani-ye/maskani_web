import { describe, expect, it, vi } from "vitest";

// الوحدة تستورد Firebase وsonner عند التحميل — لا يلزمان لمنطق التوجيه.
vi.mock("firebase/messaging", () => ({ getToken: vi.fn(), onMessage: vi.fn() }));
vi.mock("sonner", () => ({ toast: vi.fn() }));
vi.mock("@/lib/firebase", () => ({ getMessagingIfSupported: vi.fn(), VAPID_KEY: "" }));

const { routeForData } = await import("@/lib/push");

describe("routeForData — نقرة الإشعار تفتح صفحته (مرآة راوتر فلاتر)", () => {
  it("رابطٌ داخليّ صريح يفوز، والخارجيّ أو «#» يُتجاهل", () => {
    expect(routeForData({ url: "/properties/9", type: "new_message" })).toBe("/properties/9");
    expect(routeForData({ url: "https://evil.example/x", type: "new_message", conversation_id: "4" }))
      .toBe("/chat/4");
    expect(routeForData({ url: "#", type: "verification_approved" })).toBe("/profile");
  });

  it("كل نوع إلى كيانه بمعرّفه، وإلى قائمته حين يغيب المعرّف", () => {
    const cases: [Record<string, string>, string][] = [
      [{ type: "new_message", conversation_id: "7" }, "/chat/7"],
      [{ type: "new_message" }, "/chat"],
      [{ type: "property_interest", property_id: "12" }, "/properties/12"],
      [{ type: "demand_match", property: "13" }, "/properties/13"],
      [{ type: "new_comment" }, "/properties"],
      [{ type: "new_offer", request_id: "5", request_kind: "client" }, "/requests/5"],
      [{ type: "report_updated", report_id: "3" }, "/reports/3"],
      [{ type: "fraud_report_update", fraud_report_id: "8" }, "/reports/8"],
      [{ type: "new_follower", follower_id: "21" }, "/users/21"],
      [{ type: "new_rating" }, "/notifications"],
      [{ type: "verification_rejected" }, "/profile"],
    ];
    for (const [data, route] of cases) expect(routeForData(data), JSON.stringify(data)).toBe(route);
  });

  it("إشعارات طلب الخدمة تفتح الطلب في /jobs لا طلب العقار في /requests", () => {
    // الحمولات كما يرسلها الباك اند (jobs/api/v1/views.py).
    const kind = { request_kind: "service" };
    expect(routeForData({ type: "request_offer", service_request_id: "44", ...kind })).toBe("/jobs/44");
    expect(routeForData({ type: "offer_accepted", service_request_id: "44", ...kind })).toBe("/jobs/44");
    expect(routeForData({ type: "new_service_request", service_request_id: "45", ...kind })).toBe("/jobs/45");
    expect(routeForData({ type: "offer_accepted", ...kind })).toBe("/jobs");
    // طلب العقار لم يتغيّر.
    expect(routeForData({ type: "offer_accepted", request_id: "9", request_kind: "client" })).toBe("/requests/9");
  });

  it("النوع المجهول أو الغائب إلى صفحة الإشعارات لا إلى لا شيء", () => {
    expect(routeForData({ type: "broadcast" })).toBe("/notifications");
    expect(routeForData({})).toBe("/notifications");
  });
});
