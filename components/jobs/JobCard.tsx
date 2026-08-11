"use client";

import Link from "next/link";
import { formatPrice, formatRelativeTime } from "@/lib/utils";
import { MapPoint, Dollar, ClockCircle, AltArrowRight } from "@solar-icons/react";

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
  return (
    <Link href={`/jobs/${req.id}`}>
      <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 p-5 cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {req.category?.name_ar && (
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  {req.category.name_ar}
                </span>
              </div>
            )}
            <p className="font-bold text-gray-800 mb-2 truncate">{req.title}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><MapPoint className="h-3.5 w-3.5 text-primary" /> {req.city_name}</span>
              {req.budget_max && <span className="flex items-center gap-1"><Dollar className="h-3.5 w-3.5 text-gold" /> حتى {formatPrice(req.budget_max, req.currency)}</span>}
            </div>
          </div>
          <div className="text-left shrink-0">
            <div className="text-sm font-bold text-primary">{req.offers_count ?? 0} عرض</div>
            {req.created_at && (
              <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                <ClockCircle className="h-3.5 w-3.5" /> {formatRelativeTime(req.created_at)}
              </div>
            )}
            <AltArrowRight className="h-4 w-4 text-gray-300 mt-2 mr-auto" />
          </div>
        </div>
      </div>
    </Link>
  );
}
