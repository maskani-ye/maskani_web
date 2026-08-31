"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { formatRelativeTime, formatPrice } from "@/lib/utils";
import { JobCard } from "@/components/jobs/JobCard";
import type { PaginatedResponse, City } from "@/types";
import { Button } from "@/components/ui/Button";
import { BrowseToolbar } from "@/components/browse/BrowseToolbar";
import { FilterPanel } from "@/components/browse/FilterPanel";
import { RequestsTabs } from "@/components/layout/RequestsTabs";
import { Select } from "@/components/ui/Select";
import { Settings, AddCircle, MapPoint, Dollar, ClockCircle, AltArrowRight } from "@solar-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { useCity } from "@/context/CityContext";
import { useCountry } from "@/context/CountryContext";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbList, sectionLabel } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { toast } from "sonner";

interface ServiceCategory { id: number; name_ar: string }
interface ServiceRequestItem {
  id: number;
  title: string;
  category: { id: number; name_ar: string } | null;
  city_name: string;
  client_name: string;
  budget_max: string | null;
  currency: string;
  offers_count: number;
  created_at: string;
}

export default function JobsPage() {
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const { cityId, setCity } = useCity();
  // كل قائمة محصورة بدولة الزائر: سوق واحد في الشاشة لا خليط أسواق.
  const { code: countryCode } = useCountry();
  const router = useRouter();
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    api.get("/cities/", { params: countryCode ? { country: countryCode } : {} })
      .then((r) => setCities(r.data.results ?? [])).catch(() => {});
    api.get("/services/categories/").then((r) => setCategories(r.data.results ?? r.data ?? [])).catch(() => {});
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { offset: "0", limit: "20" };
      if (category) params.category = category;
      if (cityId) params.city = cityId;
      if (countryCode) params.country = countryCode;
      const { data } = await api.get<PaginatedResponse<ServiceRequestItem>>("/jobs/", { params });
      setRequests(data.results);
      setTotal(data.count);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [category, cityId, countryCode]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const chips = [
    ...(cityId ? [{ key: "city", label: cities.find((c) => String(c.id) === cityId)?.name_ar ?? "المدينة", clear: () => setCity("", "") }] : []),
    ...(category ? [{ key: "cat", label: categories.find((c) => String(c.id) === category)?.name_ar ?? "التخصص", clear: () => setCategory("") }] : []),
  ];

  return (
    // نفس تخطيط الأقسام — بلا خريطة (طلب الخدمة نيّة لا موقع).
    <div className="w-full px-3 sm:px-5 lg:px-6 py-6">
      <JsonLd data={breadcrumbList([{ name: "الرئيسية", path: "/" }, { name: sectionLabel("jobs"), path: "/jobs" }])} />
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: sectionLabel("jobs") }]} />
      <RequestsTabs active="service" />

      <BrowseToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="ابحث في طلبات الخدمات…"
        chips={chips}
        onOpenFilters={() => setShowFilters((v) => !v)}
        filterCount={chips.length}
        count={total}
        loading={loading}
        unitLabel="طلب نشط"
        actions={
          <button
            onClick={() => requireAuth(() => router.push("/jobs/create"))}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gold px-4 text-caption font-bold text-ink transition-colors hover:bg-gold/90"
          >
            <AddCircle className="h-4 w-4" /> اطلب خدمة
          </button>
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
              label="التخصّص"
              options={categories.map((c) => ({ value: c.id, label: c.name_ar }))}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="كل التخصّصات"
            />
          </FilterPanel>
        )}

        <div className="p-3 sm:p-5">
          {loading ? (
            <div className="grid grid-cols-cards gap-x-4 gap-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-cream" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-body font-semibold text-ink">لا توجد طلبات خدمات حالياً</p>
              <p className="mt-1 text-caption text-muted">كن أوّل من يطلب خدمة</p>
            </div>
          ) : (
            <div className="grid grid-cols-cards gap-x-4 gap-y-6">
              {requests
                .filter((r) => !search || (r.title ?? "").includes(search))
                .map((req) => (
                  <JobCard key={req.id} job={req} />
                ))}
            </div>
          )}
        </div>
      </BrowseToolbar>
    </div>
  );
}
