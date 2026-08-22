"use client";

import Link from "next/link";
import { formatPrice, formatRelativeTime, propertyTypeName, offerTypeLabels } from "@/lib/utils";
import { MapPoint, Dollar, Bed, ClockCircle, AltArrowRight } from "@solar-icons/react";

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
  return (
    <Link href={`/requests/${req.id}`}>
      <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 p-5 cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                {(req.property_type_name || propertyTypeName(req.property_type))}
              </span>
              {req.offer_type && (
                <span className="text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-full font-semibold">
                  {offerTypeLabels[req.offer_type] || req.offer_type}
                </span>
              )}
            </div>
            <p className="font-bold text-gray-800 mb-2 line-clamp-1">{req.title || `${req.client_name} يبحث عن عقار`}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><MapPoint className="h-3.5 w-3.5 text-primary" /> {req.city_name}{req.neighborhood && ` — ${req.neighborhood}`}</span>
              {req.budget_max && <span className="flex items-center gap-1"><Dollar className="h-3.5 w-3.5 text-gold" /> حتى {formatPrice(req.budget_max, req.currency)}</span>}
              {req.rooms_needed != null && <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {req.rooms_needed} غرف</span>}
            </div>
            {req.additional_specs && (
              <p className="text-xs text-gray-400 mt-2 line-clamp-1">{req.additional_specs}</p>
            )}
          </div>
          <div className="text-left shrink-0">
            <div className="text-sm font-bold text-primary">{req.offers_count ?? 0} عرض</div>
            {req.created_at && (
              <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                <ClockCircle className="h-3.5 w-3.5" />
                {formatRelativeTime(req.created_at)}
              </div>
            )}
            <AltArrowRight className="h-4 w-4 text-gray-300 mt-2 mr-auto" />
          </div>
        </div>
      </div>
    </Link>
  );
}
