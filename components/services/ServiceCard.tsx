"use client";

/**
 * بطاقة مزوّد خدمة — أُعيد بناؤها من الصفر (2026-09-01).
 *
 * ⚠️ **الترتيب كان مقلوباً**: الاسم («عبدالرحمن») أبرز من الخدمة («مقاول
 * بناء»). ومن يتصفّح هذه الشاشة يبحث عن **خدمة** لا عن شخص — لا يعرف الأسماء
 * أصلاً. فالخدمة صارت العنوان، والاسم سطراً ثانوياً تحته.
 *
 * ⚠️ **وتكرارٌ ظاهر**: شارة «مقاول» تحت الاسم، ثمّ «مقاول بناء» سطراً تحتها —
 * المعلومة نفسها مرّتين في بطاقةٍ لا تتّسع لمرّة.
 *
 * ⚠️ **و«لا يوجد تقييم بعد» بلونٍ باهت** في موضع التقييم: جملةٌ سلبية تُقال
 * لكل مزوّدٍ جديد. الغياب لا يُعلَن — يُترك المكان لما ينفع (الخبرة والمدن).
 *
 * ⚠️ **وزرّ «تواصل» كان نصّاً صغيراً في زاوية**: وهو **الفعل الوحيد** الذي
 * تريده البطاقة. صار زرّاً كامل العرض في الذيل.
 */

import Link from "next/link";
import { User, CheckCircle, MapPoint, Phone, Star } from "@solar-icons/react";

import { CARD_FOOT, CARD_PAD, CARD_SHELL } from "@/components/cards/shell";
import { formatNumber } from "@/lib/utils";

/** بيانات بطاقة مزوّد الخدمة — متوافق بنيوياً مع كائنات الخدمة في الصفحات. */
export interface ServiceCardData {
  id: number;
  title?: string | null;
  user_name?: string;
  user_avatar?: string | null;
  user_verified?: boolean;
  category?: unknown; // كائن {name_ar} أو سلسلة
  experience_years?: number | null;
  cities_names?: string[];
  average_rating?: number | null;
  reviews_count?: number;
  contact_phone?: string;
}

const categoryName = (cat: unknown): string =>
  cat && typeof cat === "object"
    ? ((cat as { name_ar?: string }).name_ar ?? "")
    : typeof cat === "string"
      ? cat
      : "";

/**
 * بطاقة مزوّد خدمة موحّدة — مصدر واحد لكل الصفحات (القائمة/الرئيسية/الملف).
 * ❌ لا تُكرّر بطاقة خدمة في أي صفحة.
 */
export function ServiceCard({ provider: p }: { provider: ServiceCardData }) {
  const cat = categoryName(p.category);
  const rated = Number(p.average_rating) > 0;

  return (
    <Link href={`/services/${p.id}`} className={CARD_SHELL}>
      <div className={CARD_PAD}>
        <div className="flex items-start gap-3">
          {/* الصورة الشخصية مرساةُ البطاقة — وهي الكيان الوحيد هنا الذي قد
              تكون له صورة حقيقية، فتُستعمل حين توجد. */}
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-50 text-primary-400">
            {p.user_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.user_avatar}
                alt=""
                aria-hidden
                className="h-full w-full object-cover"
              />
            ) : (
              <User weight="Bold" className="h-5 w-5" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            {/* **الخدمة هي العنوان** — لا اسم صاحبها. */}
            <h3 className="line-clamp-2 min-h-[2.6em] text-body font-bold leading-snug text-ink">
              {p.title || cat || "مزوّد خدمة"}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-caption text-ink/70">
              <span className="truncate">{p.user_name}</span>
              {p.user_verified && (
                <CheckCircle
                  weight="Bold"
                  className="h-3.5 w-3.5 shrink-0 text-primary-400"
                  aria-label="حساب موثّق"
                />
              )}
            </p>
          </div>
        </div>

        {/* ما يفرّق مزوّداً عن آخر: تخصّصه وخبرته وأين يعمل. */}
        <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {cat && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-primary-50 px-2.5 py-1 text-caption font-bold text-primary-400">
              {cat}
            </span>
          )}
          {p.experience_years != null && p.experience_years > 0 && (
            <span className="text-caption text-muted">
              {formatNumber(p.experience_years)} سنة خبرة
            </span>
          )}
        </div>

        {p.cities_names && p.cities_names.length > 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-caption text-muted">
            <MapPoint className="h-4 w-4 shrink-0" />
            <span className="truncate">{p.cities_names.slice(0, 3).join(" · ")}</span>
          </p>
        )}

        <div className={CARD_FOOT}>
          {/* التقييم يظهر حين يوجد فقط — غيابه لا يُعلَن. */}
          {rated ? (
            <span className="inline-flex items-center gap-1 text-caption font-bold text-ink">
              <Star weight="Bold" className="h-3.5 w-3.5 text-gold-600" />
              {Number(p.average_rating).toFixed(1)}
              <span className="font-normal text-muted">
                ({formatNumber(p.reviews_count ?? 0)})
              </span>
            </span>
          ) : (
            <span aria-hidden />
          )}

          {p.contact_phone && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-caption font-bold text-white transition-colors group-hover:bg-primary-600">
              <Phone weight="Bold" className="h-4 w-4" />
              تواصل
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default ServiceCard;
