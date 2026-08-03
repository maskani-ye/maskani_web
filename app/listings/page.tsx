"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api, getErrorMessage } from "@/lib/api";
import { formatPrice, offerTypeLabels, propertyTypeName } from "@/lib/utils";
import type { Listing, City, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Magnifer, SliderHorizontal, Buildings2, MapPoint, Bed,
  Ruler, Eye, Heart, AltArrowRight, AltArrowLeft,
  Map as MapIcon, List as ListIcon, AddCircle,
} from "@solar-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { useCity } from "@/context/CityContext";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbList, sectionLabel } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { toast } from "sonner";
import ListingsMap from "@/components/map/ListingsMap";
import { cityCoords, YEMEN_CENTER, DEFAULT_ZOOM } from "@/components/map/constants";

const PROPERTY_TYPE_OPTS = [
  { value: "apartment", label: "شقة" },
  { value: "house", label: "بيت / فيلا" },
  { value: "land", label: "أرض" },
  { value: "commercial", label: "محل تجاري" },
];

const OFFER_TYPE_OPTS = [
  { value: "sale", label: "للبيع" },
  { value: "rent_monthly", label: "إيجار شهري" },
  { value: "rent_yearly", label: "إيجار سنوي" },
];

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const { cityId, setCity } = useCity();

  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
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
  }, []);

  // المدينة يملكها السياق العام (CityContext) — مصدر واحد. عند فتح الصفحة برابط
  // يحمل ?city=، نتبنّاه كمدينة عامة مرّة واحدة ليتزامن مع الشريط العلوي.
  useEffect(() => {
    const urlCity = searchParams.get("city");
    if (urlCity && urlCity !== cityId) setCity(urlCity, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { offset: String((page - 1) * 20), limit: "20" };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      if (cityId) params.city = cityId;
      const { data } = await api.get<PaginatedResponse<Listing>>("/listings/", { params });
      setListings(data.results);
      setTotal(data.count);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters, page, cityId]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // إعادة الصفحة للأولى عند تبديل المدينة العامة (من الشريط أو الفلتر)
  useEffect(() => { setPage(1); }, [cityId]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((p) => ({ ...p, [key]: value }));
    setPage(1);
  };

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
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: sectionLabel("listings") }]} />
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">الإعلانات العقارية</h1>
          <p className="text-gray-500 text-sm mt-1">{total} إعلان متاح</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* مبدّل قائمة / خريطة */}
          <div className="flex rounded-xl border border-gray-200 bg-white p-1">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                view === "list" ? "bg-primary text-white" : "text-gray-500 hover:text-primary"
              }`}
            >
              <ListIcon className="h-4 w-4" /> قائمة
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                view === "map" ? "bg-primary text-white" : "text-gray-500 hover:text-primary"
              }`}
            >
              <MapIcon className="h-4 w-4" /> خريطة
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <SliderHorizontal className="h-4 w-4" />
            الفلاتر
          </Button>
          <Button size="sm" onClick={() => requireAuth(() => router.push("/listings/create"))}>
            <AddCircle className="h-4 w-4" />
            أضف إعلان
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
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
          className="w-full sm:w-44"
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl card-shadow p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
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
            options={PROPERTY_TYPE_OPTS}
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
      )}

      {/* Map View */}
      {view === "map" ? (
        <div className="h-[70vh] w-full overflow-hidden rounded-2xl card-shadow">
          <ListingsMap center={mapCenter} zoom={DEFAULT_ZOOM} filters={mapFilters} />
        </div>
      ) : (
      <>
      {/* Listings Grid */}
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
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <Buildings2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">لا توجد إعلانات مطابقة</p>
          <p className="text-gray-400 text-sm mt-1">جرّب تغيير معايير البحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {listings.map((listing) => (
            <Link href={`/listings/${listing.id}`} key={listing.id}>
              <div className="bg-white rounded-2xl card-shadow hover:card-shadow-hover transition-all duration-200 overflow-hidden cursor-pointer group">
                <div className="relative h-44 bg-gray-100 overflow-hidden">
                  {listing.main_image ? (
                    <Image src={listing.main_image} alt={`${listing.title} — ${propertyTypeName(listing.property_type)}${listing.city_name ? " في " + listing.city_name : ""}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Buildings2 className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${listing.offer_type === "sale" ? "bg-primary text-white" : "bg-gold text-white"}`}>
                      {offerTypeLabels[listing.offer_type]}
                    </span>
                    {listing.is_promoted && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gold text-white">مميّز</span>
                    )}
                    {listing.price_reduced && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-600 text-white">انخفض السعر</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => toggleFavorite(listing.id, e)}
                    className="absolute top-3 left-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Heart className={`h-4 w-4 ${favorites.has(listing.id) ? "fill-red-500 text-red-500" : "text-gray-400"}`} />

                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{propertyTypeName(listing.property_type)}</span>
                    {listing.user_verified && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">موثّق ✓</span>}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{listing.title}</h3>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
                    <MapPoint className="h-3.5 w-3.5" />
                    <span>{listing.city_name}{listing.neighborhood && ` — ${listing.neighborhood}`}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    {listing.rooms && <span className="flex items-center gap-0.5"><Bed className="h-3.5 w-3.5 text-primary" /> {listing.rooms}</span>}
                    {listing.area && <span className="flex items-center gap-0.5"><Ruler className="h-3.5 w-3.5 text-primary" /> {listing.area}م²</span>}
                    <span className="flex items-center gap-0.5 mr-auto"><Eye className="h-3.5 w-3.5" /> {listing.views_count}</span>
                  </div>
                  <p className="text-primary font-extrabold text-base">{formatPrice(listing.price, listing.currency)}</p>
                </div>
              </div>
            </Link>
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

export default function ListingsPage() {
  return (
    <>
      {/* مسار التنقّل خارج حدود Suspense كي يُصيَّر خادمياً (useSearchParams يُؤجّل المحتوى) */}
      <JsonLd
        data={breadcrumbList([
          { name: "الرئيسية", path: "/" },
          { name: sectionLabel("listings"), path: "/listings" },
        ])}
      />
      <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-400">جاري التحميل...</div>}>
        <ListingsContent />
      </Suspense>
    </>
  );
}
