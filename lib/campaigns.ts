// إعلانات مسكني الخاصّة — تُدار من /admin/campaigns (الخادم: تطبيق campaigns).
// ⚠️ الاسم «campaign» لا «ad/banner/promo» في المسارات والأصناف: مانعات الإعلانات
// تحجب تلك الكلمات فيختفي الإعلان ويختفي عدّاده.

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

export type CampaignPlacement =
  | "blog_article"
  | "tool_page"
  | "property_detail"
  | "properties_list"
  | "app_home";

export interface Campaign {
  id: number;
  label: string;
  advertiser: string;
  headline: string;
  body: string;
  cta_label: string;
  image: string | null;
  target_url: string;
}

/** النقرة تمرّ بالخادم ليعدّها ثم يحوّل إلى وجهة الإعلان. */
export const campaignClickUrl = (id: number) => `${API}/campaigns/${id}/click/`;
export const campaignImpressionUrl = (id: number) => `${API}/campaigns/${id}/impression/`;

/**
 * الإعلان المختار لموضعٍ وسوقٍ وموضوع — في الخادم، مخزَّناً عشر دقائق.
 * ⚠️ **لا يرمي أبداً:** إعلانٌ تعذّر جلبه يعني صفحةً بلا إعلان، لا صفحةً ساقطة
 * (انظر build-throttle → baked 404).
 */
export async function fetchCampaign(
  placement: CampaignPlacement,
  opts: { country?: string | null; city?: number | null; topic?: (string | null | undefined)[] } = {},
): Promise<Campaign | null> {
  const q = new URLSearchParams({ placement });
  if (opts.country) q.set("country", opts.country.toUpperCase());
  else if (opts.city) q.set("city", String(opts.city)); // الخادم يشتقّ السوق من المدينة
  const topic = (opts.topic ?? []).filter(Boolean).join(" ").slice(0, 400);
  if (topic) q.set("topic", topic);
  try {
    const res = await fetch(`${API}/campaigns/serve/?${q}`, { next: { revalidate: 600 } });
    if (res.status !== 200) return null;
    return (await res.json()) as Campaign;
  } catch {
    return null;
  }
}
