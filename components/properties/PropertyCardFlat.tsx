"use client";

/**
 * بطاقة عقار **مسطّحة** — لشاشة التصفّح وحدها، مطابقة للمرجع المعتمد.
 *
 * ⚠️ **بلا إطار ولا ظلّ ولا سطح**: البطاقة في المرجع صورةٌ ونصٌّ يقفان مباشرةً
 * على أرضية بيضاء. كل إطارٍ إضافي حول أربع بطاقات بجانب خريطة يُنتج شبكة خطوط
 * تتنافس مع خطوط الخريطة، فتبدو الشاشة مزدحمة. الفراغ هو ما يفصل، لا الخطوط.
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

export function PropertyCardFlat({ property }: { property: Property }) {
  const imgs = (property.images ?? []).map((i) => i.image).filter(Boolean);
  const cover = property.main_image || imgs[0] || PLACEHOLDER;
  const dots = Math.min(imgs.length, 5);
  const place = [property.neighborhood_name || property.neighborhood, property.city_name]
    .filter(Boolean)
    .join(" — ");

  return (
    <Link href={`/properties/${property.id}`} className="group block">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-cream">
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

      <p className="mt-3 text-h3 font-extrabold text-ink">
        {formatPrice(property.price, property.currency)}
      </p>

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
    </Link>
  );
}

export default PropertyCardFlat;
