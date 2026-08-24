"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, offerTypeLabels, propertyTypeName, PRICE_ON_REQUEST, NUMERIC_LOCALE } from "@/lib/utils";
import {
  Buildings2, Heart, MapPoint, Bed, Bath, Ruler, CheckCircle,
} from "@solar-icons/react";

/** بيانات بطاقة العقار — الحدّ الأدنى الذي تحتاجه البطاقة (متوافق بنيوياً مع كائنات العقار في الصفحات). */
export interface PropertyCardData {
  id: number;
  title: string;
  price?: string | number | null;
  currency?: string | null;
  offer_type?: string;
  property_type?: unknown;
  city_name?: string | null;
  neighborhood?: string | null;
  main_image?: string | null;
  rooms?: number | null;
  bathrooms?: number | null;
  area?: string | number | null;
  views_count?: number;
  is_promoted?: boolean;
  price_reduced?: boolean;
  user_verified?: boolean;
}

/**
 * بطاقة عرض عقار موحّدة — مصدر واحد لكل الصفحات (القائمة/الرئيسية/المفضّلة/
 * البروفايل/المدينة). ❌ لا تُكرّرها.
 *
 * ─── ما أُصلح في مراجعة 2026-08-24 ولماذا ────────────────────────────────
 * • **التراتبية كانت مقلوبة**: العنوان 14px والسعر 16px — فرقٌ لا تراه العين،
 *   فتتحوّل البطاقة إلى كتلة نصٍّ متساوٍ. السعر هو محور المسح البصري في كل
 *   منصّة عقارية (زيلو/بيوت يجعلانه 20–24px)، فصار `text-price` وصار العنوان
 *   `text-body` تحته.
 * • **العنوان بسطرين لا سطر**: عناوين العقارات العربية طويلة («شقة ٣ غرف
 *   للإيجار في شارع الستين») و`line-clamp-1` كان يبترها دائماً.
 * • **لون واحد للأكسنت**: كانت خمسة ألوان تتنافس (بنفسجي · ذهبي · أحمران ·
 *   رماديان) وثلاث فقاعات عائمة فوق صورة واحدة. الانضباط اللوني هو ما يجعل
 *   البطاقة تبدو مصقولة.
 * • **نصف القطر المتداخل صحيح رياضياً**: الحاوية 16px والحشو 8px ← الصورة
 *   8px (كان 12px، أي ضِعف الصحيح، فيُنتج انحناءً «مشدوداً» يشعر به المستخدم
 *   ولا يعرف مصدره).
 * • **حدّ يفصلها عن الصفحة**: خلفية الصفحة #F6F6FB والبطاقة بيضاء — فرقٌ لا
 *   يكاد يُرى، والظلّ وحده بشفافية 8% لم يكن يفصلها.
 * • **شارة توثيق مصمَّمة**: كانت `· موثّق ✓` — محرف Unicode بحجم 12px وشفافية
 *   70%. التوثيق جوهر قيمة المنصّة، فلا يجوز أن يكون محرفاً.
 * • **سعر المتر**: مشتقّ من السعر والمساحة (بلا تغيير في الـAPI) — معيار في
 *   المنصّات المحترفة لأنه وحدة المقارنة الحقيقية بين عقارين.
 */
/**
 * سطح بديل الصورة — مُشترَك بين كل البطاقات التي قد تأتي بلا وسائط.
 *
 * ⚠️ كان لوحاً بتدرّج بنفسجيّ **مشبع** وأيقونة بيضاء بحجم 56 بكسل: أربع بطاقات
 * متجاورة تصير أربعة طوب بنفسجية تسحق ما حولها. المعالجة ليست حذف الكتلة —
 * الكتلة تمنح البطاقة حضورها وتُحاذيها مع بطاقات الصور — بل **تهدئتها**: سطح
 * فاتح من عائلة اللون، نقشٌ قطريّ خفيف يمنحه عمقاً، وأيقونة صغيرة باهتة.
 */
export function PlaceholderSurface({
  Icon,
  tone = "primary",
}: {
  Icon: React.ComponentType<{ className?: string; weight?: "Bold" | "Linear" }>;
  tone?: "primary" | "gold";
}) {
  const surface = tone === "gold" ? "bg-gold-50" : "bg-primary-50";
  const ink = tone === "gold" ? "text-gold-700/45" : "text-primary/30";
  const stripe = tone === "gold" ? "rgba(255,160,0,.10)" : "rgba(79,35,150,.08)";
  return (
    <div className={`relative w-full h-full ${surface} flex items-center justify-center`}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(135deg, ${stripe} 0 1px, transparent 1px 10px)`,
        }}
      />
      <Icon weight="Linear" className={`relative h-9 w-9 ${ink}`} />
    </div>
  );
}

export function PropertyCard({
  property,
  favorited,
  onToggleFavorite,
  variant = "default",
}: {
  property: PropertyCardData;
  favorited?: boolean;
  onToggleFavorite?: (id: number, e: React.MouseEvent) => void;
  /** `featured` = بطاقة الصدارة في الشبكة التحريرية (صورة أطول وسعر أكبر) */
  variant?: "default" | "featured";
}) {
  const featured = variant === "featured";
  const area = typeof property.area === "string" ? parseFloat(property.area) : property.area;
  const price = typeof property.price === "string" ? parseFloat(property.price) : property.price;
  // سعر المتر يُعرض فقط حين يكون له معنى: بيعٌ بمساحة معلومة. حسابه على إيجار
  // شهري يُنتج رقماً مضلّلاً لا مقارنة.
  const perMeter =
    property.offer_type === "sale" && price && area && area > 0
      ? formatPrice(Math.round(price / area), property.currency)
      : null;

  const priceText = formatPrice(property.price, property.currency);

  // ⚠️ رابط صورة معطوب (رصدنا 404 على R2 لأحد العقارات) كان يسكب النصّ البديل
  // عبر البطاقة — سطران من الوصف فوق مساحة فارغة. الفشل يسقط إلى نفس عنصر
  // «بلا صورة» فيبقى الصفّ متّسقاً مهما تعطّل رابط.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!property.main_image && !imageFailed;

  const specs = [
    property.rooms != null && { Icon: Bed, value: property.rooms, label: "غرف" },
    property.bathrooms != null && { Icon: Bath, value: property.bathrooms, label: "حمّامات" },
    // ⚠️ الأرقام: الأسعار تخرج من Intl بأرقام هندية (٣٥٠٠) والمساحة كانت خامّاً
    // (3111م²) — نظامان على البطاقة نفسها. التوطين هنا يوحّدهما.
    area != null && {
      Icon: Ruler,
      value: `${area.toLocaleString(NUMERIC_LOCALE)}م²`,
      label: "المساحة",
    },
  ].filter(Boolean) as Array<{ Icon: typeof Bed; value: React.ReactNode; label: string }>;

  return (
    <Link href={`/properties/${property.id}`} className="group block h-full">
      <article className="h-full flex flex-col bg-white rounded-2xl p-2 ring-1 ring-ink/[0.06] shadow-e1 hover:shadow-e3 hover:ring-ink/[0.10] transition-[box-shadow,transform] duration-200 group-hover:-translate-y-0.5">
        {/* ─── الوسائط ─────────────────────────────────────────── */}
        <div className={`relative ${featured ? "aspect-[4/3] lg:aspect-auto lg:flex-1 lg:min-h-[280px]" : "aspect-[3/2]"} rounded-lg overflow-hidden bg-primary-50`}>
          {showImage ? (
            <Image
              src={property.main_image!}
              alt={`${property.title} — ${propertyTypeName(property.property_type)}${property.city_name ? " في " + property.city_name : ""}`}
              fill
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 320px"
              className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <PlaceholderSurface Icon={Buildings2} tone="primary" />
          )}

          {/* تدرّج سفليّ خفيف: يضمن قراءة الشارة فوق أي صورة مهما كانت فاتحة. */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink/45 to-transparent pointer-events-none" />

          {/* شارة نوع العرض — محايدة عمداً: البنفسجي محجوز للسعر وحده. */}
          {property.offer_type && (
            <span className="absolute bottom-2 start-2 text-caption font-bold px-2.5 py-1 rounded-md bg-white/95 text-ink backdrop-blur-sm">
              {offerTypeLabels[property.offer_type]}
            </span>
          )}

          {property.price_reduced && (
            <span className="absolute bottom-2 end-2 text-caption font-bold px-2.5 py-1 rounded-md bg-danger text-white">
              انخفض السعر
            </span>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite?.(property.id, e);
            }}
            className="absolute top-2 start-2 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-e1 hover:scale-110 active:scale-95 transition-transform"
            aria-label={favorited ? "إزالة من المفضّلة" : "أضِف إلى المفضّلة"}
            aria-pressed={!!favorited}
          >
            <Heart
              weight={favorited ? "Bold" : "Linear"}
              className={`h-5 w-5 ${favorited ? "text-danger" : "text-muted"}`}
            />
          </button>
        </div>

        {/* ─── المحتوى ─────────────────────────────────────────── */}
        {/* ⚠️ في بطاقة الصدارة **الصورة** تمتصّ الارتفاع الزائد لا المحتوى: حين
            كان للاثنين `flex-1` اقتسما الفراغ، فيهبط صفّ التذييل إلى القاع
            تاركاً ٢٥٠ بكسل بياضاً وسط البطاقة. */}
        <div className={`px-1.5 pt-3 pb-1 flex flex-col ${featured ? "" : "flex-1"}`}>
          {/* السعر أوّلاً — هو ما تبحث عنه العين، لا العنوان. */}
          <div className="flex items-baseline justify-between gap-2">
            {/* ⚠️ حين لا سعر معلن يعود `formatPrice` بجملة «السعر عند التواصل».
                عرضها بمقاس السعر (22px بنفسجي ثقيل) يجعل **غياب** المعلومة أبرز
                ما في البطاقة — رأيناها تبتلع بطاقتين من ثلاث. الغياب يُعرض
                هامساً: مقاس الجسد ولونٌ محايد. */}
            {priceText === PRICE_ON_REQUEST ? (
              <span className={`${featured ? "text-body-lg" : "text-body"} font-semibold text-muted`}>
                {priceText}
              </span>
            ) : (
              <span className={`${featured ? "text-h2" : "text-price"} text-primary`}>
                {priceText}
              </span>
            )}
            {perMeter && (
              <span className="text-caption text-muted whitespace-nowrap">
                {perMeter}/م²
              </span>
            )}
          </div>

          <h3 className={`${featured ? "text-h3" : "text-body font-semibold"} text-ink mt-1.5 line-clamp-2 leading-snug`}>
            {property.title}
          </h3>

          <div className="flex items-center gap-1.5 text-caption text-muted mt-1.5">
            <MapPoint className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">
              {property.city_name}
              {property.neighborhood && ` — ${property.neighborhood}`}
            </span>
          </div>

          {/* المواصفات في صفّها الخاصّ: كانت محشورة مع النوع وشارة التوثيق في
              صفٍّ واحد بـ12 بكسل — درجٌ للمهملات لا تراتبية. */}
          <div className="mt-auto pt-2.5 flex items-center gap-3 border-t border-ink/[0.06]">
            <span className="text-caption font-bold text-primary">
              {propertyTypeName(property.property_type)}
            </span>
            {specs.length > 0 && (
              <span className="ms-auto flex items-center gap-3 text-caption text-muted">
                {specs.map(({ Icon, value, label }) => (
                  <span key={label} className="flex items-center gap-1" title={label}>
                    <Icon className="h-4 w-4" aria-hidden />
                    <span className="tabular-nums">{value}</span>
                  </span>
                ))}
              </span>
            )}
          </div>

          {property.user_verified && (
            <span className="mt-2 inline-flex items-center gap-1 self-start rounded-md bg-success-50 px-2 py-0.5 text-caption font-bold text-success-700">
              <CheckCircle weight="Bold" className="h-3.5 w-3.5" />
              مالك موثّق
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
