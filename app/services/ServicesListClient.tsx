"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "@/components/nav/MarketLink";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import type { ServiceProvider, PaginatedResponse, City, ServiceCategoryItem } from "@/types";
import { Select } from "@/components/ui/Select";
import { PageHeader } from "@/components/ui/PageHeader";
import { ServiceCard } from "@/components/services/ServiceCard";
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
  const [filters, setFilters] = useState({ category: "" });

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
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [filters, cityId, countryCode]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <JsonLd data={breadcrumbList([{ name: "الرئيسية", path: "/" }, { name: sectionLabel("services"), path: "/services" }])} />
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: sectionLabel("services") }]} />
      <div className="mb-6">
        <PageHeader as="h2" icon={<Settings />} title="الخدمات العقارية"
          subtitle="مهندسون، مقاولون، مصممون، وأكثر"
          actions={<>
            <Link href="/jobs"><Button size="sm" variant="outline">طلبات الخدمات</Button></Link>
            {user?.is_service_provider && (
              <Link href="/services/my"><Button size="sm">إدارة خدمتي</Button></Link>
            )}
          </>} />
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button onClick={() => setFilters((p) => ({ ...p, category: "" }))} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!filters.category ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-primary"}`}>الكل</button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setFilters((p) => ({ ...p, category: String(c.id) }))} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filters.category === String(c.id) ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-primary"}`}>
            {c.name_ar}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-6">
        <Select
          options={cities.map((c) => ({ value: c.id, label: c.name_ar }))}
          value={cityId}
          onChange={(e) => {
            const id = e.target.value;
            const name = cities.find((c) => String(c.id) === id)?.name_ar ?? "";
            setCity(id, name);
          }}
          placeholder="تصفية بالمدينة"
          className="max-w-xs"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl card-shadow p-5 animate-pulse h-44" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {providers.map((p) => (
            <ServiceCard key={p.id} provider={p} />
          ))}
        </div>
      )}
    </div>
  );
}
