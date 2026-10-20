// إعلانات مسكني الخاصّة — تُدار من /admin/campaigns (الخادم: تطبيق campaigns).
// ⚠️ الاسم «campaign» لا «ad/banner/promo» في المسارات والأصناف: مانعات الإعلانات
// تحجب تلك الكلمات فيختفي الإعلان ويختفي عدّاده.

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

export type CampaignPlacement =
  | "blog_article"
  | "tool_page"
  | "property_detail"
  | "properties_list"
  | "app_home"
  | "site_wide"
  | "spotlight";

export type CampaignPlatform = "android" | "ios" | "desktop";

/** جهاز الزائر من متصفّحه — إعلان تطبيق أندرويد لا يُعرض على آيفون أو كمبيوتر. */
export function detectPlatform(): CampaignPlatform {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  // iPadOS يقدّم نفسه «Macintosh» — اللمس يكشفه.
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  return "desktop";
}

export interface Campaign {
  id: number;
  label: string;
  advertiser: string;
  headline: string;
  body: string;
  cta_label: string;
  image: string | null;
  target_url: string;
  /** النافذة المنبثقة: لا تُعاد على الزائر نفسه قبل هذه الساعات */
  spotlight_every_hours?: number;
}

/** النقرة تمرّ بالخادم ليعدّها ثم يحوّل إلى وجهة الإعلان. */
export const campaignClickUrl = (id: number) => `${API}/campaigns/${id}/click/`;
export const campaignImpressionUrl = (id: number) => `${API}/campaigns/${id}/impression/`;

/**
 * الإعلان المختار لموضعٍ وسوقٍ وموضوعٍ وجهاز — يُجلب **في المتصفّح**.
 *
 * ⚠️ لماذا لا في الخادم: الجهاز لا يُعرف إلا من المتصفّح، والصفحات مخزَّنة (ISR)
 * فلا تختلف لكل زائر. وجلبٌ في الخادم بعمرٍ قصير كان يُقصّر عمر الصفحة كلها.
 * **لا يرمي أبداً:** تعذّر الجلب = لا إعلان، لا صفحة ساقطة.
 */
export async function fetchCampaign(
  placement: CampaignPlacement,
  opts: {
    country?: string | null;
    city?: number | null;
    topic?: (string | null | undefined)[];
    platform?: CampaignPlatform;
  } = {},
): Promise<Campaign | null> {
  const q = new URLSearchParams({ placement });
  if (opts.country) q.set("country", opts.country.toUpperCase());
  else if (opts.city) q.set("city", String(opts.city)); // الخادم يشتقّ السوق من المدينة
  const topic = (opts.topic ?? []).filter(Boolean).join(" ").slice(0, 400);
  if (topic) q.set("topic", topic);
  if (opts.platform) q.set("platform", opts.platform);
  try {
    const res = await fetch(`${API}/campaigns/serve/?${q}`);
    if (res.status !== 200) return null;
    return (await res.json()) as Campaign;
  } catch {
    return null;
  }
}

// ─── منع التكرار ───────────────────────────────────────────────────────────
// موضع «كل الصفحات» يقع أسفل كل صفحة؛ إن عرض موضعٌ آخر في الصفحة نفسها الإعلانَ
// ذاته اختفى هو — لا يرى الزائر البطاقة نفسها مرّتين.
const shown = new Map<number, number>();
const listeners = new Set<() => void>();

export function markShown(id: number): () => void {
  shown.set(id, (shown.get(id) ?? 0) + 1);
  listeners.forEach((l) => l());
  return () => {
    const n = (shown.get(id) ?? 1) - 1;
    if (n <= 0) shown.delete(id);
    else shown.set(id, n);
    listeners.forEach((l) => l());
  };
}

export const isShown = (id: number) => shown.has(id);

export function onShownChange(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
