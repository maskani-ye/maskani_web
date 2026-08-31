"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { formatRelativeTime, formatPrice, propertyTypeName } from "@/lib/utils";
import { RequestCard } from "@/components/requests/RequestCard";
import type { ClientRequest, PaginatedResponse, City, PropertyTypeItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { BrowseToolbar } from "@/components/browse/BrowseToolbar";
import { RequestsTabs } from "@/components/layout/RequestsTabs";
import { PenNewSquare, AddCircle, MapPoint, Bed, Dollar, ClockCircle, AltArrowRight } from "@solar-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { useCity } from "@/context/CityContext";
import { useCountry } from "@/context/CountryContext";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbList, sectionLabel } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { toast } from "sonner";

export default function RequestsPage() {
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const { cityId, setCity } = useCity();
  // كل قائمة محصورة بدولة الزائر: سوق واحد في الشاشة لا خليط أسواق.
  const { code: countryCode } = useCountry();
  const router = useRouter();
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [filters, setFilters] = useState({ property_type: "", offer_type: "" });
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // الأنواع من الجدول الذي تديره اللوحة — نفس مصدر نموذج النشر، فلا ينحرف
  // ما يستطيع الباحث فلترته عمّا يستطيع الناشر عرضه.
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeItem[]>([]);

  useEffect(() => {
    api
      .get<{ results: PropertyTypeItem[] }>(endpoints.propertyTypes, { params: { limit: 100 } })
      .then(({ data }) => setPropertyTypes(data.results ?? []))
      .catch(() => setPropertyTypes([]));
  }, []);

  const propertyTypeOpts = useMemo(
    () => [
      { value: "any", label: "أي نوع" },
      ...propertyTypes.map((p) => ({ value: p.slug, label: p.name_ar })),
    ],
    [propertyTypes]
  );

  useEffect(() => {
    api.get("/cities/", { params: countryCode ? { country: countryCode } : {} })
      .then((r) => setCities(r.data.results ?? [])).catch(() => {});
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { offset: "0", limit: "20" };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      if (cityId) params.city = cityId;
      if (countryCode) params.country = countryCode;
      const { data } = await api.get<PaginatedResponse<ClientRequest>>("/requests/", { params });
      setRequests(data.results);
      setTotal(data.count);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [filters, cityId, countryCode]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const offerTypeLabels: Record<string, string> = {
    sale: "للشراء", rent_monthly: "إيجار شهري", rent_yearly: "إيجار سنوي", any: "أي نوع",
  };

  const chips = [
    ...(cityId ? [{ key: "city", label: cities.find((c) => String(c.id) === cityId)?.name_ar ?? "المدينة", clear: () => setCity("", "") }] : []),
    ...(filters.property_type ? [{ key: "pt", label: propertyTypeOpts.find((o) => o.value === filters.property_type)?.label ?? "النوع", clear: () => setFilters((p) => ({ ...p, property_type: "" })) }] : []),
    ...(filters.offer_type ? [{ key: "ot", label: filters.offer_type, clear: () => setFilters((p) => ({ ...p, offer_type: "" })) }] : []),
  ];

  return (
    // ⚠️ نفس تخطيط العقارات بلا خريطة: الطلب **نيّة** لا موقع — «أبحث عن شقة
    // في إب» لا نقطة على الأرض، فالخريطة له تَعِد بما لا يوجد.
    <div className="w-full px-3 sm:px-5 lg:px-6 py-6">
      <JsonLd data={breadcrumbList([{ name: "الرئيسية", path: "/" }, { name: sectionLabel("requests"), path: "/requests" }])} />
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: sectionLabel("requests") }]} />
      <RequestsTabs active="property" />

      <BrowseToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="ابحث في الطلبات…"
        chips={chips}
        onOpenFilters={() => setShowFilters((v) => !v)}
        filterCount={chips.length}
        count={total}
        loading={loading}
        unitLabel="طلب نشط"
        actions={
          <button
            onClick={() => requireAuth(() => router.push("/requests/create"))}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gold px-4 text-caption font-bold text-ink transition-colors hover:bg-gold/90"
          >
            <AddCircle className="h-4 w-4" /> نشر طلب
          </button>
        }
      >
        {showFilters && (
          <div className="grid gap-3 border-t border-ink/[0.07] p-3 sm:grid-cols-3 sm:p-5">
            <Select
              label="المدينة"
              options={cities.map((c) => ({ value: c.id, label: c.name_ar }))}
              value={cityId}
              onChange={(e) => {
                const id = e.target.value;
                setCity(id, cities.find((c) => String(c.id) === id)?.name_ar ?? "");
              }}
              placeholder="كل المدن"
            />
            <Select
              label="نوع العقار"
              options={propertyTypeOpts}
              value={filters.property_type}
              onChange={(e) => setFilters((p) => ({ ...p, property_type: e.target.value }))}
              placeholder="الكل"
            />
            <Select
              label="نوع العرض"
              options={[
                { value: "sale", label: "للشراء" }, { value: "rent_monthly", label: "إيجار شهري" },
                { value: "rent_yearly", label: "إيجار سنوي" }, { value: "any", label: "أي نوع" },
              ]}
              value={filters.offer_type}
              onChange={(e) => setFilters((p) => ({ ...p, offer_type: e.target.value }))}
              placeholder="الكل"
            />
          </div>
        )}

        <div className="p-3 sm:p-5">
          {loading ? (
            <div className="grid grid-cols-cards gap-x-4 gap-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-cream" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-body font-semibold text-ink">لا توجد طلبات حالياً</p>
              <p className="mt-1 text-caption text-muted">كن أوّل من ينشر طلبه</p>
            </div>
          ) : (
            <div className="grid grid-cols-cards gap-x-4 gap-y-6">
              {requests
                .filter((r) => !search || (r.title ?? "").includes(search))
                .map((req) => (
                  <RequestCard key={req.id} request={req} />
                ))}
            </div>
          )}
        </div>
      </BrowseToolbar>
    </div>
  );
}
