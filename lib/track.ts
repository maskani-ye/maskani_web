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

function send(body: Record<string, unknown>) {
  try {
    fetch(`${API}/analytics/track/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: visitorId(), platform: "web", ...body }),
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
  targetType?: "listing" | "service" | "request" | "job" | "user" | "report";
  targetId?: number | string;
  path?: string;
};

/** حدث تحويل/تفاعل (contact_click, whatsapp_click, chat_started, …). */
export function trackVisitEvent(eventName: string, opts?: TrackTarget) {
  send({
    kind: "event",
    event_name: eventName,
    path:
      opts?.path ?? (typeof location !== "undefined" ? location.pathname : ""),
    target_type: opts?.targetType,
    target_id: opts?.targetId,
  });
}
