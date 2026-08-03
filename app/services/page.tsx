"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import type { ServiceProvider, PaginatedResponse, City, ServiceCategoryItem } from "@/types";
import { Select } from "@/components/ui/Select";
import { StarRating } from "@/components/ui/StarRating";
import { Settings, User, CheckCircle, MapPoint, Phone } from "@solar-icons/react";
import { toast } from "sonner";
import { useCity } from "@/context/CityContext";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbList, sectionLabel } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export default function ServicesPage() {
  const { user } = useAuth();
  const { cityId, setCity } = useCity();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryItem[]>([]);
  const [filters, setFilters] = useState({ category: "" });

  useEffect(() => {
    api.get("/cities/").then((r) => setCities(r.data.results ?? [])).catch(() => {});
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
      const { data } = await api.get<PaginatedResponse<ServiceProvider>>("/services/", { params });
      setProviders(data.results);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [filters, cityId]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <JsonLd data={breadcrumbList([{ name: "الرئيسية", path: "/" }, { name: sectionLabel("services"), path: "/services" }])} />
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: sectionLabel("services") }]} />
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> الخدمات العقارية
          </h1>
          <p className="text-gray-500 text-sm mt-1">مهندسون، مقاولون، مصممون، وأكثر</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/jobs"><Button size="sm" variant="outline">طلبات الخدمات</Button></Link>
          {user?.is_service_provider && (
            <Link href="/services/my"><Button size="sm">إدارة خدمتي</Button></Link>
          )}
        </div>
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
            <Link key={p.id} href={`/services/${p.id}`}>
              <div className="bg-white rounded-2xl card-shadow hover:card-shadow-hover transition-all duration-200 p-5 cursor-pointer">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.user_avatar ? (
                      <img src={p.user_avatar} alt={p.title || "مزوّد خدمة"} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-900 text-sm truncate">{p.user_name}</span>
                      {p.user_verified && <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                    </div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {typeof p.category === "object" ? p.category?.name_ar : p.category}
                    </span>
                  </div>
                </div>
                <p className="font-semibold text-gray-800 text-sm mb-1 line-clamp-1">{p.title}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span>{p.experience_years} سنة خبرة</span>
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
                  <a href={`tel:${p.contact_phone}`} onClick={(e) => e.stopPropagation()} className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline">
                    <Phone className="h-3 w-3" /> تواصل
                  </a>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
