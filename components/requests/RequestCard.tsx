"use client";

/**
 * بطاقة طلب عقاريّ — أُعيد بناؤها من الصفر (2026-09-01).
 *
 * ⚠️ **ما كان**: صفٌّ أفقيّ محشورٌ في عمودٍ ضيّق. العنوان يُقصّ عند عشرين حرفاً
 * فتقول خمس بطاقات «عبدالرحمن يبحث…» ولا يُفرَّق بينها، و**«٠ عرض» أبرز عنصر**
 * فيها، و**الميزانية — وهي أهمّ رقم — أصغر سطر وفي الأسفل**، وسهمٌ معلّق بلا
 * وظيفة، وارتفاعاتٌ غير متساوية تكسر الصفّ.
 *
 * ⚠️ **الترتيب هنا ترتيب القرار**: من يقرأ طلباً يسأل بهذا التتابع — *ماذا
 * يريد؟* (النوع والعرض) ثمّ *أين؟* ثمّ **بكم؟** ثمّ *هل الطلب حيّ؟*. فالميزانية
 * بطلة البطاقة بمقاس `h3`، والعنوان **سطران محجوزان** (`min-h`) فلا يُقصّ
 * ولا تختلف الارتفاعات.
 */

import Link from "next/link";
import {
  MapPoint,
  Bed,
  ClockCircle,
  ClipboardList,
} from "@solar-icons/react";

import {
  CARD_FOOT,
  CARD_PAD,
  CARD_SHELL,
  CardIcon,
  Chip,
  OffersLine,
} from "@/components/cards/shell";
import {
  formatPrice,
  formatNumber,
  formatRelativeTime,
  propertyTypeName,
  offerTypeLabels,
} from "@/lib/utils";

/** بيانات بطاقة الطلب العقاري — متوافق بنيوياً مع كائنات الطلب في الصفحات. */
export interface RequestCardData {
  id: number;
  title?: string;
  client_name?: string;
  property_type?: unknown;
  /** الاسم العربيّ الجاهز من الخادم — يغطّي الأنواع التي تديرها اللوحة. */
  property_type_name?: string;
  offer_type?: string;
  city_name?: string | null;
  neighborhood?: string | null;
  budget_min?: string | number | null;
  budget_max?: string | number | null;
  currency?: string | null;
  rooms_needed?: number | null;
  additional_specs?: string | null;
  offers_count?: number;
  created_at?: string;
}

/**
 * بطاقة طلب عقاري موحّدة — مصدر واحد لكل الصفحات (القائمة/الرئيسية/الملف).
 * ❌ لا تُكرّر بطاقة طلب في أي صفحة.
 */
export function RequestCard({ request: req }: { request: RequestCardData }) {
  const type = req.property_type_name || propertyTypeName(req.property_type);
  const offer = req.offer_type ? offerTypeLabels[req.offer_type] || req.offer_type : "";
  const place = [req.city_name, req.neighborhood].filter(Boolean).join(" — ");
  // ميزانيةٌ حقيقية = رقم موجب. الصفر والفراغ يعنيان «مفتوحة» لا «بلا مقابل».
  const hasBudget = Number(req.budget_max) > 0;

  return (
    <Link href={`/requests/${req.id}`} className={CARD_SHELL}>
      <div className={CARD_PAD}>
        <div className="flex items-start gap-3">
          <CardIcon Icon={ClipboardList} tone="primary" />
          <div className="min-w-0 flex-1">
            {/* ⚠️ **سطران محجوزان لا سطرٌ مقصوص**: عناوين الطلبات تبدأ متشابهة
                («عبدالرحمن يبحث عن…»)، فالقصّ عند سطرٍ واحد يمحو ما يفرّقها.
                والحجز يجعل كل البطاقات بارتفاع واحد. */}
            <h3 className="line-clamp-2 min-h-[2.6em] text-body font-bold leading-snug text-ink">
              {req.title || `${req.client_name ?? "باحث"} يبحث عن عقار`}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-caption text-ink/70">
              <MapPoint className="h-4 w-4 shrink-0 text-muted" />
              <span className="truncate">{place || "غير محدّد"}</span>
            </p>
          </div>
        </div>

        {/* البطل: كم يدفع الباحث. */}
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

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {type && <Chip>{type}</Chip>}
          {offer && <Chip tone="gold">{offer}</Chip>}
          {req.rooms_needed != null && (
            <span className="inline-flex items-center gap-1 text-caption text-muted">
              <Bed className="h-3.5 w-3.5" /> {formatNumber(req.rooms_needed)} غرف
            </span>
          )}
        </div>

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

export default RequestCard;
