"use client";

/**
 * بطاقة طلب خدمة — أُعيد بناؤها من الصفر (2026-09-01).
 *
 * ⚠️ نفس أعطال بطاقة الطلب العقاريّ: صفٌّ أفقيّ في عمودٍ ضيّق، و«٠ عرض» أبرز
 * عنصر، والميزانية أصغر سطر، وسهمٌ معلّق بلا وظيفة، وارتفاعاتٌ متفاوتة.
 *
 * وهي **أخت** بطاقة الطلب العقاريّ في التخطيط عمداً: القسمان يجيبان السؤال
 * نفسه (من يطلب، ماذا، بكم) — واختلاف شكلهما كان يجعل الانتقال بينهما يبدو
 * انتقالاً بين موقعين. ما يفرّقهما لون المرساة وأيقونتها لا بنيتهما.
 */

import Link from "next/link";
import { MapPoint, ClockCircle, CaseMinimalistic } from "@solar-icons/react";

import {
  CARD_FOOT,
  CARD_PAD,
  CARD_SHELL,
  CardIcon,
  Chip,
  OffersLine,
} from "@/components/cards/shell";
import { formatPrice, formatRelativeTime } from "@/lib/utils";

/** بيانات بطاقة طلب الخدمة (job) — متوافق بنيوياً مع كائنات jobs. */
export interface JobCardData {
  id: number;
  title?: string;
  category?: { name_ar?: string } | null;
  city_name?: string | null;
  budget_min?: string | number | null;
  budget_max?: string | number | null;
  currency?: string | null;
  offers_count?: number;
  created_at?: string;
}

/**
 * بطاقة طلب خدمة موحّدة — مصدر واحد لكل الصفحات (القائمة/الرئيسية).
 * ❌ لا تُكرّر بطاقة طلب خدمة في أي صفحة.
 */
export function JobCard({ job: req }: { job: JobCardData }) {
  const hasBudget = Number(req.budget_max) > 0;

  return (
    <Link href={`/jobs/${req.id}`} className={CARD_SHELL}>
      <div className={CARD_PAD}>
        <div className="flex items-start gap-3">
          <CardIcon Icon={CaseMinimalistic} tone="gold" />
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 min-h-[2.6em] text-body font-bold leading-snug text-ink">
              {req.title || "طلب خدمة"}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-caption text-ink/70">
              <MapPoint className="h-4 w-4 shrink-0 text-muted" />
              <span className="truncate">{req.city_name || "غير محدّد"}</span>
            </p>
          </div>
        </div>

        <p className="mt-3.5">
          {hasBudget ? (
            <>
              <span className="text-caption text-muted">الميزانية حتى </span>
              <span className="text-h3 font-extrabold text-ink">
                {formatPrice(req.budget_max, req.currency)}
              </span>
            </>
          ) : (
            <span className="text-body font-bold text-ink">الميزانية مفتوحة</span>
          )}
        </p>

        {req.category?.name_ar && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Chip tone="gold">{req.category.name_ar}</Chip>
          </div>
        )}

        <div className={CARD_FOOT}>
          <OffersLine count={req.offers_count ?? 0} />
          {req.created_at && (
            <span className="inline-flex items-center gap-1 text-caption text-muted">
              <ClockCircle className="h-3.5 w-3.5" />
              {formatRelativeTime(req.created_at)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default JobCard;
