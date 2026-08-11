"use client";

import Link from "next/link";
import { StarRating } from "@/components/ui/StarRating";
import { User, CheckCircle, MapPoint, Phone } from "@solar-icons/react";

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
  cat && typeof cat === "object" ? ((cat as { name_ar?: string }).name_ar ?? "") : (typeof cat === "string" ? cat : "");

/**
 * بطاقة مزوّد خدمة موحّدة — مصدر واحد لكل الصفحات (القائمة/الرئيسية/الملف).
 * ❌ لا تُكرّر بطاقة خدمة في أي صفحة.
 */
export function ServiceCard({ provider: p }: { provider: ServiceCardData }) {
  return (
    <Link href={`/services/${p.id}`}>
      <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 p-5 cursor-pointer h-full">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {p.user_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.user_avatar} alt={p.title || "مزوّد خدمة"} className="w-full h-full object-cover" />
            ) : (
              <User className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-bold text-gray-900 text-sm truncate">{p.user_name}</span>
              {p.user_verified && <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />}
            </div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {categoryName(p.category)}
            </span>
          </div>
        </div>
        <p className="font-semibold text-gray-800 text-sm mb-1 line-clamp-1">{p.title}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          {p.experience_years != null && <span>{p.experience_years} سنة خبرة</span>}
          {p.cities_names && p.cities_names.length > 0 && (
            <span className="flex items-center gap-0.5"><MapPoint className="h-3 w-3 text-primary" />{p.cities_names.slice(0, 2).join("، ")}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {p.average_rating ? (
              <>
                <StarRating rating={p.average_rating} size="sm" />
                <span className="text-xs text-gray-400">({p.reviews_count})</span>
              </>
            ) : (
              <span className="text-xs text-gray-400">لا يوجد تقييم بعد</span>
            )}
          </div>
          {p.contact_phone && (
            <a href={`tel:${p.contact_phone}`} onClick={(e) => e.stopPropagation()} className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline">
              <Phone className="h-3 w-3" /> تواصل
            </a>
          )}
        </div>
      </div>
    </Link>
  );
}
