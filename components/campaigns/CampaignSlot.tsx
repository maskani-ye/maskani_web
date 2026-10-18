import { fetchCampaign, type CampaignPlacement } from "@/lib/campaigns";
import { CampaignCard } from "./CampaignCard";

/** موضع إعلان — يجلب في الخادم ما اختاره المشرف لهذا الموضع، ولا يرسم شيئاً إن لم يوجد. */
export async function CampaignSlot({
  placement,
  country,
  city,
  topic,
  className,
}: {
  placement: CampaignPlacement;
  country?: string | null;
  city?: number | null;
  /** نصّ الصفحة (عنوان، وسوم) — يطابق «كلمات الموضوع» في الإعلان */
  topic?: (string | null | undefined)[];
  className?: string;
}) {
  const c = await fetchCampaign(placement, { country, city, topic });
  return c ? <CampaignCard campaign={c} className={className} /> : null;
}
