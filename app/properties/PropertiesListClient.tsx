"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api, getErrorMessage } from "@/lib/api";
import { formatPrice, offerTypeLabels, propertyTypeName } from "@/lib/utils";
import type { Property, City, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PropertyCard } from "@/components/properties/PropertyCard";
import {
  Magnifer, SliderHorizontal, Buildings2, MapPoint, Bed, Bath,
  Ruler, Eye, Heart, AltArrowRight, AltArrowLeft,
  Map as MapIcon, List as ListIcon, AddCircle, Bookmark,
} from "@solar-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { useCity } from "@/context/CityContext";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbList, sectionLabel } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { toast } from "sonner";
import PropertiesMap from "@/components/map/PropertiesMap";
import { cityCoords, YEMEN_CENTER, DEFAULT_ZOOM } from "@/components/map/constants";
import { SmartSearchBar, type AiFilters } from "@/components/ai/SmartSearchBar";

const OFFER_TYPE_OPTS = [
  { value: "sale", label: "للبيع" },
  { value: "rent_monthly", label: "إيجار شهري" },
  { value: "rent_yearly", label: "إيجار سنوي" },
];

function PropertiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const { cityId, setCity } = useCity();

  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [propertyTypeOpts, setPropertyTypeOpts] = useState<{ value: string; label: string }[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [view, setView] = useState<"list" | "map">(searchParams.get("view") === "map" ? "map" : "list");

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    property_type: searchParams.get("property_type") || "",
    offer_type: searchParams.get("offer_type") || "",
    price_min: searchParams.get("price_min") || "",
    price_max: searchParams.get("price_max") || "",
    rooms_min: searchParams.get("rooms_min") || "",
    has_parking: searchParams.get("has_parking") || "",
    has_elevator: searchParams.get("has_elevator") || "",
    furnishing: searchParams.get("furnishing") || "",
    ordering: searchParams.get("ordering") || "-created_at",
  });

  useEffect(() => {
    api.get("/cities/").then((r) => setCities(r.data.results ?? [])).catch(() => {});
    // أنواع العقارات من المرجع المُدار — نفلتر بالمعرّف (id) لا بالاسم/enum.
    api.get<{ results?: { id: number; name_ar: string }[] } | { id: number; name_ar: string }[]>("/properties/property-types/")
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : r.data.results ?? [];
        setPropertyTypeOpts(list.map((p) => ({ value: String(p.id), label: p.name_ar })));
      })
      .catch(() => {});
  }, []);

  // المدينة يملكها السياق العام (CityContext) — مصدر واحد. عند فتح الصفحة برابط
  // يحمل ?city=، نتبنّاه كمدينة عامة مرّة واحدة ليتزامن مع الشريط العلوي.
  useEffect(() => {
    const urlCity = searchParams.get("city");
    if (urlCity && urlCity !== cityId) setCity(urlCity, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { offset: String((page - 1) * 20), limit: "20" };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      if (cityId) params.city = cityId;
      const { data } = await api.get<PaginatedResponse<Property>>("/properties/", { params });
      setProperties(data.results);
      setTotal(data.count);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters, page, cityId]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  // إعادة الصفحة للأولى عند تبديل المدينة العامة (من الشريط أو الفلتر)
  useEffect(() => { setPage(1); }, [cityId]);

  const saveSearch = async () => {
    if (!requireAuth()) return;
    const clean: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v && k !== "ordering") clean[k] = v;
    });
    if (cityId) clean.city = cityId;
    try {
      await api.post("/properties/saved-searches/", { name: "", filters: clean, notify: true });
      toast.success("تم حفظ البحث. سنُنبّهك بالمطابقات الجديدة.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((p) => ({ ...p, [key]: value }));
    setPage(1);
  };

  // تطبيق فلاتر البحث الذكي (جملة عربية → فلاتر)
  const applyAiFilters = (f: AiFilters) => {
    if (f.city) setCity(String(f.city), "");
    setFilters((p) => ({
      ...p,
      offer_type: f.offer_type ?? p.offer_type,
      rooms_min: f.rooms != null ? String(f.rooms) : p.rooms_min,
      price_min: f.price_min != null ? String(f.price_min) : p.price_min,
      price_max: f.price_max != null ? String(f.price_max) : p.price_max,
      search: f.search ?? p.search,
    }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters((p) => ({
      ...p,
      property_type: "", offer_type: "", price_min: "", price_max: "",
      rooms_min: "", has_parking: "", has_elevator: "", furnishing: "",
    }));
    if (cityId) setCity("", "");
    setPage(1);
  };

  // عدد الفلاتر الفعّالة (عدا البحث النصّي والترتيب) — لعرض شارة/إعادة تعيين.
  const activeFilterCount =
    Object.entries(filters).filter(([k, v]) => v && k !== "search" && k !== "ordering").length +
    (cityId ? 1 : 0);

  const toggleFavorite = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!requireAuth()) return;
    try {
      const { data } = await api.post(`/social/favorites/${id}/toggle/`);
      setFavorites((prev) => {
        const next = new Set(prev);
        if (data.favorited) next.add(id);
        else next.delete(id);
        return next;
      });
      toast.success(data.message);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const totalPages = Math.ceil(total / 20);

  // ── مركز الخريطة: إحداثيات صريحة من الرابط، ثم الإحداثيات الحقيقية للمدينة
  //    المختارة من الـ API، ثم البحث بالاسم كاحتياطي، ثم صنعاء ──
  const latParam = parseFloat(searchParams.get("lat") || "");
  const lngParam = parseFloat(searchParams.get("lng") || "");
  const selectedCity = cities.find((c) => String(c.id) === cityId);
  const cityLat = selectedCity?.latitude != null ? parseFloat(selectedCity.latitude) : NaN;
  const cityLng = selectedCity?.longitude != null ? parseFloat(selectedCity.longitude) : NaN;
  const cityRealCoords: [number, number] | null =
    Number.isFinite(cityLat) && Number.isFinite(cityLng) ? [cityLat, cityLng] : null;
  const mapCenter: [number, number] =
    Number.isFinite(latParam) && Number.isFinite(lngParam)
      ? [latParam, lngParam]
      : cityRealCoords ||
        (selectedCity && cityCoords(selectedCity.name_ar, selectedCity.name_en)) ||
        YEMEN_CENTER;

  // ── فلاتر الخريطة (بدون الترقيم/الترتيب) لتمريرها مع الـ bbox ──
  const mapFilters: Record<string, string> = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v && k !== "ordering") mapFilters[k] = v;
  });
  if (cityId) mapFilters.city = cityId;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: sectionLabel("properties") }]} />
      {/* Toolbar */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-white card-shadow">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-gold via-gold/60 to-primary" />
        <div className="p-5 sm:p-6">
          {/* Title + actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Buildings2 className="h-6 w-6" />
              </div>
              <div>
                {/* h2 لا h1 — الـh1 الرئيسي في الكتلة التعريفية الخادمية (SectionIntro). */}
                <h2 className="text-xl sm:text-2xl font-extrabold leading-tight text-gray-900">العقارات</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  {loading ? (
                    "جارٍ التحميل…"
                  ) : (
                    <>
                      <span className="font-bold text-primary">{total.toLocaleString("ar")}</span> عقار متاح
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* مبدّل قائمة / خريطة */}
              <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                <button
                  onClick={() => setView("list")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    view === "list" ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:text-primary"
                  }`}
                >
                  <ListIcon className="h-4 w-4" /> قائمة
                </button>
                <button
                  onClick={() => setView("map")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    view === "map" ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:text-primary"
                  }`}
                >
                  <MapIcon className="h-4 w-4" /> خريطة
                </button>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <SliderHorizontal className="h-4 w-4" />
                الفلاتر
                {activeFilterCount > 0 && (
                  <span className="mr-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={saveSearch} title="احفظ هذا البحث لتصلك تنبيهات المطابقة">
                <Bookmark className="h-4 w-4" />
                احفظ البحث
              </Button>
              <Button size="sm" onClick={() => requireAuth(() => router.push("/properties/create"))}>
                <AddCircle className="h-4 w-4" />
                أضف عقار
              </Button>
            </div>
          </div>

          {/* Search + sort */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="ابحث بالعنوان أو الحي..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              startIcon={<Magnifer className="h-4 w-4" />}
              className="flex-1"
            />
            <Select
              options={[
                { value: "-created_at", label: "الأحدث" },
                { value: "price", label: "السعر: الأقل" },
                { value: "-price", label: "السعر: الأعلى" },
                { value: "-views_count", label: "الأكثر مشاهدة" },
              ]}
              value={filters.ordering}
              onChange={(e) => handleFilterChange("ordering", e.target.value)}
              className="w-full sm:w-48"
            />
          </div>

          {/* بحث ذكي بالذكاء الاصطناعي — جملة عربية → فلاتر */}
          <div className="mt-3">
            <SmartSearchBar onResult={applyAiFilters} />
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl card-shadow p-5 mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <SliderHorizontal className="h-4 w-4 text-primary" />
              تصفية النتائج
            </h2>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-gray-500 transition-colors hover:text-red-600"
              >
                إعادة تعيين ({activeFilterCount})
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Select
            label="المدينة"
            options={cities.map((c) => ({ value: c.id, label: c.name_ar }))}
            value={cityId}
            onChange={(e) => {
              const id = e.target.value;
              const name = cities.find((c) => String(c.id) === id)?.name_ar ?? "";
              setCity(id, name);
            }}
            placeholder="الكل"
          />
          <Select
            label="نوع العقار"
            options={propertyTypeOpts}
            value={filters.property_type}
            onChange={(e) => handleFilterChange("property_type", e.target.value)}
            placeholder="الكل"
          />
          <Select
            label="نوع العرض"
            options={OFFER_TYPE_OPTS}
            value={filters.offer_type}
            onChange={(e) => handleFilterChange("offer_type", e.target.value)}
            placeholder="الكل"
          />
          <Select
            label="التأثيث"
            options={[
              { value: "furnished", label: "مفروشة" },
              { value: "unfurnished", label: "غير مفروشة" },
              { value: "semi_furnished", label: "نصف مفروشة" },
            ]}
            value={filters.furnishing}
            onChange={(e) => handleFilterChange("furnishing", e.target.value)}
            placeholder="الكل"
          />
          <Input
            label="أقل سعر"
            type="number"
            placeholder="0"
            value={filters.price_min}
            onChange={(e) => handleFilterChange("price_min", e.target.value)}
          />
          <Input
            label="أعلى سعر"
            type="number"
            placeholder="غير محدد"
            value={filters.price_max}
            onChange={(e) => handleFilterChange("price_max", e.target.value)}
          />
          <Input
            label="عدد الغرف (الحد الأدنى)"
            type="number"
            placeholder="أي عدد"
            value={filters.rooms_min}
            onChange={(e) => handleFilterChange("rooms_min", e.target.value)}
          />
          <div className="flex flex-col gap-3 justify-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.has_parking === "true"}
                onChange={(e) => handleFilterChange("has_parking", e.target.checked ? "true" : "")}
                className="rounded text-primary"
              />
              <span className="text-sm text-gray-700">موقف سيارة</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.has_elevator === "true"}
                onChange={(e) => handleFilterChange("has_elevator", e.target.checked ? "true" : "")}
                className="rounded text-primary"
              />
              <span className="text-sm text-gray-700">مصعد</span>
            </label>
          </div>
          </div>
        </div>
      )}

      {/* Map View */}
      {view === "map" ? (
        <div className="h-[70vh] w-full overflow-hidden rounded-2xl card-shadow">
          <PropertiesMap center={mapCenter} zoom={DEFAULT_ZOOM} filters={mapFilters} />
        </div>
      ) : (
      <>
      {/* Properties Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl card-shadow overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-5 bg-gray-200 rounded w-1/3 mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20">
          <Buildings2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">لا توجد عقارات مطابقة</p>
          <p className="text-gray-400 text-sm mt-1">جرّب تغيير معايير البحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              favorited={favorites.has(property.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            <AltArrowRight className="h-4 w-4" /> السابق
          </Button>
          <span className="text-sm text-gray-600 font-medium">صفحة {page} من {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            التالي <AltArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
      </>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <>
      {/* مسار التنقّل خارج حدود Suspense كي يُصيَّر خادمياً (useSearchParams يُؤجّل المحتوى) */}
      <JsonLd
        data={breadcrumbList([
          { name: "الرئيسية", path: "/" },
          { name: sectionLabel("properties"), path: "/properties" },
        ])}
      />
      <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-400">جاري التحميل...</div>}>
        <PropertiesContent />
      </Suspense>
    </>
  );
}
