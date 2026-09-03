"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { formatPrice } from "@/lib/utils";
import { UsersGroupRounded, AltArrowLeft } from "@solar-icons/react";

interface MatchingRequest {
  id: number;
  title?: string;
  city_name?: string;
  neighborhood?: string;
  budget_min?: string | null;
  budget_max?: string | null;
  currency?: string;
  rooms_needed?: number | null;
  match_reason?: string;
}

/** «باحثون عن عقار مثل عقارك» — الاتجاه المعاكس للمطابقة.
 *
 *  يظهر لصاحب العقار وحده: المالك لا يتصفّح الطلبات، فنعرض عليه من يبحث عمّا
 *  ينشره. صامت تماماً إن لم توجد مطابقات — لا يشغل مساحة بلا فائدة. */
export function MatchingRequests({ propertyId }: { propertyId: number }) {
  const [matches, setMatches] = useState<MatchingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get<{ matches: MatchingRequest[] }>(endpoints.propertyMatchingRequests(propertyId))
      .then((r) => { if (alive) setMatches(r.data.matches ?? []); })
      .catch(() => { if (alive) setMatches([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [propertyId]);

  if (loading || matches.length === 0) return null;

  const budget = (m: MatchingRequest) =>
    m.budget_min && m.budget_max
      ? `${formatPrice(m.budget_min, m.currency)} — ${formatPrice(m.budget_max, m.currency)}`
      : m.budget_max
        ? `حتى ${formatPrice(m.budget_max, m.currency)}`
        : m.budget_min
          ? `من ${formatPrice(m.budget_min, m.currency)}`
          : "ميزانية مفتوحة";

  return (
    <div className="bg-white rounded-2xl card-shadow p-5">
      <div className="flex items-center gap-2 mb-1">
        <UsersGroupRounded className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-ink">
          {matches.length === 1 ? "باحث واحد يطابق عقارك" : `${matches.length} باحثين يطابقون عقارك`}
        </h2>
      </div>
      <p className="text-caption text-muted mb-4">تواصل معهم مباشرة — هم يبحثون عمّا نشرته.</p>

      <div className="space-y-2">
        {matches.map((m) => (
          <Link
            key={m.id}
            href={`/requests/${m.id}`}
            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-muted-100 hover:border-primary/40 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-body font-semibold text-ink truncate">
                {m.title || "طلب عقاري"}
              </p>
              <p className="text-caption text-muted-500 truncate">
                {[m.city_name, m.neighborhood].filter(Boolean).join(" · ")}
              </p>
              <p className="text-caption font-bold text-primary mt-0.5">{budget(m)}</p>
              {m.match_reason && (
                <p className="text-[11px] text-muted mt-0.5 truncate">{m.match_reason}</p>
              )}
            </div>
            <AltArrowLeft className="h-4 w-4 text-muted-200 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
