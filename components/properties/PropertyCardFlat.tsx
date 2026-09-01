"use client";

/**
 * بطاقة عقار شاشة التصفّح — **وهيكلها العظميّ من الملفّ نفسه**.
 *
 * ⚠️ **الهيكل كان يَعِد بشكلٍ وتأتي البطاقة بشكلٍ آخر.** أثناء التحميل تظهر
 * بطاقةٌ بيضاء بظلٍّ وحشو، ثم تحلّ محلّها بطاقةٌ مسطّحة بلا سطح: فيرى الزائر
 * الشبكة **تتغيّر تحت عينه** في كل صفحة. وكان ذلك حتمياً لأنّ الهيكل مكتوبٌ
 * بيده داخل صفحة القائمة والبطاقة في ملفّ آخر — نسختان تتباعدان مع كل تعديل.
 *
 * الآن `PropertyCardFlatSkeleton` يُصدَّر من هنا ويستعمل **ثوابت الغلاف نفسها**
 * (`SHELL` · `MEDIA` · `PAD`)، فلا يمكن أن يفترقا: تعديل شكل البطاقة يُعدّل
 * هيكلها في اللحظة نفسها.
 *
 * ⚠️ **ولا شارات فوق الصورة**: كانت البطاقة القديمة تحمل «للبيع» و«مالك موثّق»
 * و«انخفض السعر» — ثلاث رسائل تسبق السعر نفسه. المرجع يضع **السعر أوّلاً** لأنه
 * أوّل ما يقرّر به الباحث، والباقي في صفحة العقار.
 *
 * ⚠️ **`PropertyCard` الأصلية تبقى كما هي** لبقيّة الشاشات (الرئيسية، المفضّلة،
 * ملفّ المستخدم): تسطيحُ بطاقةٍ مشتركة أفسد شكل الخدمات والطلبات سابقاً.
 */

import Link from "next/link";
import Image from "next/image";
import { MapPoint, Bed, Bath, Ruler } from "@solar-icons/react";
import type { Property } from "@/types";
import { formatPrice, formatNumber, propertyTypeName } from "@/lib/utils";

const PLACEHOLDER = "/placeholder.webp";

/** غلاف البطاقة — سطحٌ أبيض بظلٍّ خفيف وزوايا كبيرة. */
const SHELL =
  "block overflow-hidden rounded-2xl bg-white shadow-e1 ring-1 ring-ink/[0.06] transition-all";
/** كتلة الصورة — نسبة ٣:٢ لا ارتفاعاً ثابتاً: الثابت يشوّه الصورة على العروض المختلفة. */
const MEDIA = "relative aspect-[3/2] w-full overflow-hidden bg-cream";
/** حشو المحتوى — واحدٌ للبطاقة وهيكلها. */
const PAD = "p-4";

export function PropertyCardFlat({ property }: { property: Property }) {
  const imgs = (property.images ?? []).map((i) => i.image).filter(Boolean);
  const cover = property.main_image || imgs[0] || PLACEHOLDER;
  const dots = Math.min(imgs.length, 5);
  // سعرٌ حقيقيّ = رقم موجب. الصفر والفراغ يعنيان «لم يُذكر» لا «مجّاناً».
  const hasPrice = Number(property.price) > 0;
  const place = [property.neighborhood_name || property.neighborhood, property.city_name]
    .filter(Boolean)
    .join(" — ");

  return (
    <Link href={`/properties/${property.id}`} className={`group ${SHELL} hover:shadow-e3`}>
      {/* ⚠️ **٣:٢ لا ارتفاعاً ثابتاً**: الارتفاع الثابت يقصّ الصورة قصّاً
          مختلفاً على كل عرض شاشة، والنسبة تُبقيها متّسقة — وتُبقي **موضع
          السعر واحداً** في كل البطاقات، وهو محور المسح البصريّ. */}
      <div className={MEDIA}>
        <Image
          src={cover}
          alt={property.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {/* نقاط الصور — إشارةٌ إلى وجود معرض، كما في المرجع. لا تظهر لصورة واحدة
            كي لا تَعِد بما لا يوجد. */}
        {dots > 1 && (
          <span className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
            {Array.from({ length: dots }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </span>
        )}
      </div>

      {/* ⚠️ **«السعر عند التواصل» ليس سعراً** — إظهاره بمقاس السعر البارز يمنح
          غيابَ المعلومة وزنَ المعلومة، ويجعل أربع بطاقات متطابقة بصرياً. حين
          لا رقم: سطرٌ هادئ بحجم النصّ العادي، والعنوان يأخذ الصدارة بدلاً منه. */}
      <div className={PAD}>
      {hasPrice ? (
        <p className="text-h3 font-extrabold text-ink">
          {formatPrice(property.price, property.currency)}
        </p>
      ) : (
        <p className="text-body font-bold text-ink line-clamp-1">{property.title}</p>
      )}
      {hasPrice ? null : (
        <p className="mt-0.5 text-caption text-muted">السعر عند التواصل</p>
      )}

      <p className="mt-1 flex items-center gap-1.5 text-caption text-ink/70">
        <MapPoint className="h-4 w-4 shrink-0 text-muted" />
        <span className="truncate">{place || property.city_name}</span>
      </p>

      {/* سطر التفاصيل بفواصل نقطية — نفس ترتيب المرجع: غرف · حمّامات · مساحة */}
      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted">
        {property.rooms != null && (
          <span className="inline-flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" /> {formatNumber(property.rooms)} غرف
          </span>
        )}
        {property.rooms != null && property.bathrooms != null && <span aria-hidden>·</span>}
        {property.bathrooms != null && (
          <span className="inline-flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" /> {formatNumber(property.bathrooms)} حمّام
          </span>
        )}
        {property.area && (
          <>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" /> {formatNumber(Number(property.area))} م²
            </span>
          </>
        )}
        {!property.rooms && !property.bathrooms && !property.area && (
          <span>{propertyTypeName(property.property_type)}</span>
        )}
      </p>
      </div>
    </Link>
  );
}

/**
 * هيكل البطاقة — **نفس الغلاف والنسبة والحشو**، فلا قفزة تخطيط عند الوصول.
 *
 * ⚠️ لا تنسخه إلى صفحةٍ أخرى: استورده. النسخة المنسوخة هي ما جعل الهيكل
 * والبطاقة شكلين مختلفين أصلاً.
 */
export function PropertyCardFlatSkeleton() {
  return (
    <div className={`${SHELL} animate-pulse`} aria-hidden>
      <div className={MEDIA} />
      <div className={PAD}>
        {/* الأشرطة بارتفاع أسطر البطاقة الحقيقية وترتيبها: سعر · موقع · تفاصيل */}
        <div className="h-7 w-1/2 rounded bg-ink/[0.07]" />
        <div className="mt-1 h-4 w-3/4 rounded bg-ink/[0.06]" />
        <div className="mt-1.5 h-4 w-2/3 rounded bg-ink/[0.06]" />
      </div>
    </div>
  );
}

export default PropertyCardFlat;
