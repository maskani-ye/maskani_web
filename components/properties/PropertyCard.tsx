"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPrice, offerTypeLabels, propertyTypeName } from "@/lib/utils";
import { Buildings2, Heart, MapPoint, Bed, Bath, Ruler } from "@solar-icons/react";

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
 * بطاقة عرض عقار موحّدة بأسلوب Gathern — صورة كبيرة بحواف دائرية، قلب مفضّلة،
 * شارة العرض، ثم محتوى نظيف: نوع/مواصفات، عنوان، موقع، وسعر بارز.
 * مصدر واحد لكل الصفحات (القائمة/الرئيسية/المفضّلة/البروفايل/المدينة). ❌ لا تُكرّرها.
 */
export function PropertyCard({
  property,
  favorited,
  onToggleFavorite,
}: {
  property: PropertyCardData;
  favorited?: boolean;
  onToggleFavorite?: (id: number, e: React.MouseEvent) => void;
}) {
  const isSale = property.offer_type === "sale";
  return (
    <Link href={`/properties/${property.id}`}>
      <div className="bg-white rounded-2xl p-2.5 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer group h-full flex flex-col">
        {/* ─── الوسائط ─────────────────────────────────────────── */}
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
          {property.main_image ? (
            <Image
              src={property.main_image}
              alt={`${property.title} — ${propertyTypeName(property.property_type)}${property.city_name ? " في " + property.city_name : ""}`}
              fill
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 300px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-700 to-primary">
              <Buildings2 weight="Bold" className="h-14 w-14 text-white/70" />
            </div>
          )}

          {/* قلب المفضّلة (يظهر دائماً — بأسلوب Gathern) */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite?.(property.id, e);
            }}
            className="absolute top-2.5 left-2.5 w-9 h-9 bg-white/95 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform"
            aria-label="المفضّلة"
          >
            <Heart weight={favorited ? "Bold" : "Linear"} className={`h-[18px] w-[18px] ${favorited ? "text-red-500" : "text-gray-500"}`} />
          </button>

          {/* شارة نوع العرض */}
          {property.offer_type && (
            <span className={`absolute top-2.5 right-2.5 text-xs font-bold px-3 py-1 rounded-full backdrop-blur shadow-sm ${isSale ? "bg-primary/95 text-white" : "bg-gold/95 text-gray-900"}`}>
              {offerTypeLabels[property.offer_type]}
            </span>
          )}
          {property.price_reduced && (
            <span className="absolute bottom-2.5 right-2.5 text-xs font-bold px-2.5 py-1 rounded-full bg-red-500 text-white shadow">
              انخفض السعر
            </span>
          )}
        </div>

        {/* ─── المحتوى ─────────────────────────────────────────── */}
        <div className="px-1.5 pt-3 pb-1 flex flex-col flex-1">
          <div className="flex items-center gap-2 text-xs mb-1.5">
            <span className="font-bold text-primary">{propertyTypeName(property.property_type)}</span>
            {property.user_verified && <span className="text-primary/70">· موثّق ✓</span>}
            {(property.rooms != null || property.bathrooms != null || property.area != null) && (
              <span className="mr-auto flex items-center gap-2.5 text-gray-400">
                {property.rooms != null && <span className="flex items-center gap-0.5"><Bed className="h-3.5 w-3.5" />{property.rooms}</span>}
                {property.bathrooms != null && <span className="flex items-center gap-0.5"><Bath className="h-3.5 w-3.5" />{property.bathrooms}</span>}
                {property.area != null && <span className="flex items-center gap-0.5"><Ruler className="h-3.5 w-3.5" />{property.area}م²</span>}
              </span>
            )}
          </div>

          <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{property.title}</h3>

          <div className="flex items-center gap-1 text-gray-400 text-xs mb-2.5">
            <MapPoint className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{property.city_name}{property.neighborhood && ` — ${property.neighborhood}`}</span>
          </div>

          <div className="mt-auto pt-2.5 border-t border-gray-100">
            <span className="text-primary font-extrabold text-base">{formatPrice(property.price, property.currency)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
