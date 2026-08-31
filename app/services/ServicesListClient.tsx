"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "@/components/nav/MarketLink";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import type { ServiceProvider, PaginatedResponse, City, ServiceCategoryItem } from "@/types";
import { Select } from "@/components/ui/Select";
import { ServiceCard } from "@/components/services/ServiceCard";
import { BrowseToolbar } from "@/components/browse/BrowseToolbar";
import { FilterPanel } from "@/components/browse/FilterPanel";
import { StarRating } from "@/components/ui/StarRating";
import { Settings, User, CheckCircle, MapPoint, Phone } from "@solar-icons/react";
import { toast } from "sonner";
import { useCity } from "@/context/CityContext";
import { useCountry } from "@/context/CountryContext";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbList, sectionLabel } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export default function ServicesPage() {
  const { user } = useAuth();
  const { cityId, setCity } = useCity();
  // كل قائمة محصورة بدولة الزائر: سوق واحد في الشاشة لا خليط أسواق.
  const { code: countryCode } = useCountry();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryItem[]>([]);
  const [filters, setFilters] = useState({ category: "", search: "" });
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    api.get("/cities/", { params: countryCode ? { country: countryCode } : {} })
      .then((r) => setCities(r.data.results ?? [])).catch(() => {});
    // التصنيفات من المرجع المُدار (نفس مصدر التطبيق) — نفلتر بالمعرّف (id).
    api.get<PaginatedResponse<ServiceCategoryItem> | ServiceCategoryItem[]>(ep.serviceCategories)
      .then((r) => setCategories(Array.isArray(r.data) ? r.data : r.data.results ?? []))
      .catch(() => {});
  }, []);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { offset: "0", limit: "20" };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      if (cityId) params.city = cityId;
      if (countryCode) params.country = countryCode;
      const { data } = await api.get<PaginatedResponse<ServiceProvider>>("/services/", { params });
      setProviders(data.results);
      setTotal(data.count ?? data.results.length);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [filters, cityId, countryCode]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const chips = [
    ...(cityId
      ? [{ key: "city", label: cities.find((c) => String(c.id) === cityId)?.name_ar ?? "المدينة", clear: () => setCity("", "") }]
      : []),
    ...(filters.category
      ? [{
          key: "category",
          label: categories.find((c) => String(c.id) === filters.category)?.name_ar ?? "التصنيف",
          clear: () => setFilters((p) => ({ ...p, category: "" })),
        }]
      : []),
  ];

  return (
    // ⚠️ **نفس تخطيط العقارات بلا خريطة**: الخدمة يقدّمها مزوّد يتنقّل بين
    // المدن، فموضعها على الخريطة يَعِد بدقّةٍ لا نملكها.
    <div className="w-full px-3 sm:px-5 lg:px-6 py-6">
      <JsonLd data={breadcrumbList([{ name: "الرئيسية", path: "/" }, { name: sectionLabel("services"), path: "/services" }])} />
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: sectionLabel("services") }]} />

      <BrowseToolbar
        search={filters.search}
        onSearch={(v) => setFilters((p) => ({ ...p, search: v }))}
        searchPlaceholder="ابحث عن مقاول أو فنّي أو مكتب…"
        chips={chips}
        onOpenFilters={() => setShowFilters((v) => !v)}
        filterCount={chips.length}
        count={total}
        loading={loading}
        unitLabel="مزوّد خدمة"
        actions={
          user?.is_service_provider ? (
            <Link href="/services/my" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gold px-4 text-caption font-bold text-ink transition-colors hover:bg-gold/90">
              إدارة خدمتي
            </Link>
          ) : null
        }
      >
        {showFilters && (
          <FilterPanel cols={2}>
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
              label="التصنيف"
              options={categories.map((c) => ({ value: String(c.id), label: c.name_ar }))}
              value={filters.category}
              onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
              placeholder="كل التصنيفات"
            />
          </FilterPanel>
        )}

        <div className="p-3 sm:p-5">
          {loading ? (
            <div className="grid grid-cols-cards gap-x-4 gap-y-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-2xl bg-cream" />
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-body font-semibold text-ink">لا مزوّدي خدمات مطابقين</p>
              <p className="mt-1 text-caption text-muted">جرّب تغيير المدينة أو التصنيف</p>
            </div>
          ) : (
            <div className="grid grid-cols-cards gap-x-4 gap-y-6">
              {providers
                .filter((p) => !filters.search || p.title.includes(filters.search))
                .map((p) => (
                  <ServiceCard key={p.id} provider={p} />
                ))}
            </div>
          )}
        </div>
      </BrowseToolbar>
    </div>
  );
}
