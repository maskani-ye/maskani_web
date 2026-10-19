"use client";

import { useEffect, useState } from "react";
import {
  detectPlatform, fetchCampaign, isShown, markShown, onShownChange,
  type Campaign, type CampaignPlacement,
} from "@/lib/campaigns";
import { CampaignCard } from "./CampaignCard";

/**
 * موضع إعلان — يجلب في المتصفّح ما اختاره المشرف لهذا الموضع وسوقه وجهاز الزائر،
 * ولا يرسم شيئاً إن لم يوجد.
 */
export function CampaignSlot({
  placement,
  country,
  city,
  topic,
  className,
  siteWide = false,
}: {
  placement: CampaignPlacement;
  country?: string | null;
  city?: number | null;
  /** نصّ الصفحة (عنوان، وسوم) — يطابق «كلمات الموضوع» في الإعلان */
  topic?: (string | null | undefined)[];
  className?: string;
  /** موضع «كل الصفحات»: يختفي إن عرض موضعٌ آخر في الصفحة الإعلانَ نفسه */
  siteWide?: boolean;
}) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [dup, setDup] = useState(false);
  const topicKey = (topic ?? []).filter(Boolean).join(" ");

  useEffect(() => {
    let alive = true;
    setCampaign(null);
    fetchCampaign(placement, { country, city, topic: [topicKey], platform: detectPlatform() })
      .then((c) => alive && setCampaign(c));
    return () => {
      alive = false;
    };
  }, [placement, country, city, topicKey]);

  // المواضع العادية تعلن ما تعرضه؛ «كل الصفحات» يراقب ولا يعلن.
  useEffect(() => {
    if (!campaign) return;
    if (!siteWide) return markShown(campaign.id);
    const check = () => setDup(isShown(campaign.id));
    check();
    return onShownChange(check);
  }, [campaign, siteWide]);

  if (!campaign || dup) return null;
  return <CampaignCard campaign={campaign} className={className} />;
}
