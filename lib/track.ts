// تتبّع طرف-أوّل موحّد (يغذّي لوحة تحليلات الإدارة): مشاهدات + أحداث تحويل.
// خفيف: fetch مع keepalive، بلا مصادقة إلزامية، fire-and-forget لا يكسر الواجهة.

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

/** معرّف زائر ثابت لكل متصفّح (يبقى عبر الجلسات) → عدّ دقيق بلا تكرار. */
export function visitorId(): string {
  try {
    let id = localStorage.getItem("mk_vid");
    if (!id) {
      id =
        crypto.randomUUID?.() ??
        `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("mk_vid", id);
    }
    return id;
  } catch {
    return "";
  }
}

/** المدينة (المحافظة) المختارة عالميًا من localStorage — أدقّ جغرافيا من IP
 *  لتطبيق أحادي الدولة (IP يُخطئ توطين مستخدمي اليمن). المفتاح نفسه في CityContext. */
function selectedCityId(): string {
  try {
    const raw = localStorage.getItem("maskani_selected_city");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed && parsed.id != null ? String(parsed.id) : "";
  } catch {
    return "";
  }
}

function send(body: Record<string, unknown>) {
  try {
    const cityId = selectedCityId();
    fetch(`${API}/analytics/track/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: visitorId(),
        platform: "web",
        ...(cityId ? { city_id: cityId } : {}),
        ...body,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* أفضل-جهد */
  }
}

/** استخرج utm_* من باراميترات الرابط (لإسناد الحملات). */
export function utmFromSearch(
  sp: URLSearchParams | null,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!sp) return out;
  for (const k of ["utm_source", "utm_medium", "utm_campaign"]) {
    const v = sp.get(k);
    if (v) out[k] = v;
  }
  return out;
}

/** مشاهدة صفحة. */
export function trackPageview(path: string, extra?: Record<string, unknown>) {
  send({
    path,
    referrer: (typeof document !== "undefined" ? document.referrer : "") || "",
    ...extra,
  });
}

export type TrackTarget = {
  targetType?: "property" | "service" | "request" | "job" | "user" | "report";
  targetId?: number | string;
  path?: string;
  /** خصائص حرّة (مثل نصّ البحث، نطاق السعر) — يُعقّمها الخادم ويحدّ حجمها. */
  props?: Record<string, string | number | boolean>;
};

/** حدث تحويل/تفاعل (contact_click, whatsapp_click, chat_started, search, …). */
export function trackVisitEvent(eventName: string, opts?: TrackTarget) {
  send({
    kind: "event",
    event_name: eventName,
    path:
      opts?.path ?? (typeof location !== "undefined" ? location.pathname : ""),
    target_type: opts?.targetType,
    target_id: opts?.targetId,
    ...(opts?.props ? { props: opts.props } : {}),
  });
}
