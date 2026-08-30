"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api, getErrorMessage } from "@/lib/api";
import { CURRENCIES, DEFAULT_CURRENCY, formatPrice, formatNumber, offerTypeLabels, propertyTypeName, NUMERIC_LOCALE } from "@/lib/utils";
import type { Property, City, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PropertyCard } from "@/components/properties/PropertyCard";
import {
  Magnifer, SliderHorizontal, Buildings2, MapPoint, Bed, Bath,
  Ruler, Eye, Heart, AltArrowRight, AltArrowLeft, AltArrowDown,
  AddCircle, Bookmark, CloseCircle,
} from "@solar-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { useCity } from "@/context/CityContext";
import { useCountry } from "@/context/CountryContext";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbList, sectionLabel } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { toast } from "sonner";
import { AdSlot } from "@/components/ads/AdSlot";
import { AD_SLOTS } from "@/lib/ads";
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
  // كل قائمة محصورة بدولة الزائر: سوق واحد في الشاشة لا خليط أسواق.
  const { code: countryCode } = useCountry();

  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [propertyTypeOpts, setPropertyTypeOpts] = useState<{ value: string; label: string }[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  /**
   * ⚠️ **لا مبدّل عرض إطلاقاً — الخريطة والشبكة معاً دائماً.**
   *
   * كان الاختيار «قائمة أو خريطة أو كلاهما»، وهو سؤالٌ لا يعني الباحث عن
   * عقار: يريد أن يرى **أين** يقع ما يقرأ سعره، لا أن يختار بينهما. وثلاثة
   * أزرارٍ لقرارٍ واحد صحيحٍ دائماً ضجيجٌ في أعلى الشاشة. الخريطة تلازم الشبكة،
   * والشبكة تُرقَّم صفحاتها كما هي.
   */

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    property_type: searchParams.get("property_type") || "",
    // الحيّ يتبع المدينة: يُصفَّر تلقائياً عند تبديلها كي لا يبقى فلترٌ من
    // مدينة أخرى فيُظهر «لا نتائج» بلا سبب مفهوم.
    neighborhood_ref: searchParams.get("neighborhood_ref") || "",
    offer_type: searchParams.get("offer_type") || "",
    price_min: searchParams.get("price_min") || "",
    price_max: searchParams.get("price_max") || "",
    // عملة المدى السعري — يفسّرها الخادم ويحوّلها قبل المقارنة، فلا تُقارَن
    // عملات مختلفة على رقمها الخام.
    price_currency: searchParams.get("price_currency") || DEFAULT_CURRENCY,
    rooms_min: searchParams.get("rooms_min") || "",
    has_parking: searchParams.get("has_parking") || "",
    has_elevator: searchParams.get("has_elevator") || "",
    furnishing: searchParams.get("furnishing") || "",
    ordering: searchParams.get("ordering") || "-created_at",
  });

  useEffect(() => {
    api.get("/cities/", { params: countryCode ? { country: countryCode } : {} })
      .then((r) => setCities(r.data.results ?? [])).catch(() => {});
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

  // أحياء المدينة المختارة — أدقّ نيّة بحثية عندنا: من يبحث عن «شقة في حدّة»
  // لا يريد صنعاء كلّها. المنافسون (Bayut · عقار) يعرضونها بعدّاداتها.
  const [hoods, setHoods] = useState<{ id: number; name: string; properties_count?: number }[]>([]);
  useEffect(() => {
    if (!cityId) { setHoods([]); return; }
    let alive = true;
    api.get("/cities/neighborhoods/", { params: { city: cityId, limit: 1000 } })
      .then((r) => {
        if (!alive) return;
        const list = Array.isArray(r.data) ? r.data : r.data.results ?? [];
        setHoods(list);
      })
      .catch(() => { if (alive) setHoods([]); });
    return () => { alive = false; };
  }, [cityId]);

  // تبديل المدينة يُسقط حيّها المختار — وإلا فلترنا بحيٍّ لا ينتمي إليها.
  useEffect(() => {
    setFilters((f) => (f.neighborhood_ref ? { ...f, neighborhood_ref: "" } : f));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId]);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { offset: String((page - 1) * 20), limit: "20" };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      if (cityId) params.city = cityId;
      if (countryCode) params.country = countryCode;
      const { data } = await api.get<PaginatedResponse<Property>>("/properties/", { params });
      setProperties(data.results);
      setTotal(data.count);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters, page, cityId, countryCode]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  // إعادة الصفحة للأولى عند تبديل المدينة العامة (من الشريط أو الفلتر)
  useEffect(() => { setPage(1); }, [cityId, countryCode]);

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
      property_type: "", offer_type: "", neighborhood_ref: "", price_min: "", price_max: "",
      price_currency: DEFAULT_CURRENCY,
      rooms_min: "", has_parking: "", has_elevator: "", furnishing: "",
    }));
    if (cityId) setCity("", "");
    setPage(1);
  };

  // عدد الفلاتر الفعّالة (عدا البحث النصّي والترتيب) — لعرض شارة/إعادة تعيين.
  const activeFilterCount =
    Object.entries(filters).filter(([k, v]) => v && k !== "search" && k !== "ordering" && k !== "price_currency").length +
    (cityId ? 1 : 0);

  /**
   * الفلاتر النشطة كرقائق تُقرأ وتُزال بنقرة — كما في المرجع.
   *
   * ⚠️ **الشارة الرقمية وحدها لا تكفي**: «الفلاتر ③» تقول إن شيئاً يُخفي نتائج
   * ولا تقول ما هو، فيبقى الزائر أمام قائمة قصيرة لا يعرف سببها. الرقاقة تسمّي
   * الفلتر وتُزيله في نقرة واحدة.
   */
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (cityId) {
      chips.push({
        key: "city",
        label: cities.find((c) => String(c.id) === cityId)?.name_ar ?? "المدينة",
        clear: () => setCity("", ""),
      });
    }
    const LABELS: Record<string, (v: string) => string> = {
      offer_type: (v) => offerTypeLabels[v as keyof typeof offerTypeLabels] ?? v,
      property_type: (v) => propertyTypeOpts.find((o) => o.value === v)?.label ?? v,
      rooms: (v) => `${formatNumber(Number(v))} غرف`,
      bathrooms: (v) => `${formatNumber(Number(v))} حمّامات`,
      price_min: (v) => `من ${formatNumber(Number(v))}`,
      price_max: (v) => `إلى ${formatNumber(Number(v))}`,
      area_min: (v) => `مساحة من ${formatNumber(Number(v))}`,
      area_max: (v) => `مساحة إلى ${formatNumber(Number(v))}`,
      furnishing: (v) => v,
      status: (v) => v,
    };
    Object.entries(filters).forEach(([k, v]) => {
      if (!v || k === "search" || k === "ordering" || k === "price_currency") return;
      const label = LABELS[k]?.(v) ?? v;
      chips.push({ key: k, label, clear: () => handleFilterChange(k, "") });
    });
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, cityId, cities, propertyTypeOpts]);

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
  /**
   * إحداثيّات نتائج الصفحة الحالية — تُلائم الخريطةُ نفسَها عليها.
   *
   * ⚠️ **العقارات بلا إحداثيّات لا تدخل**: صفرٌ في `latitude` ليس موقعاً بل
   * غيابُه، وإدخاله يسحب الخريطة إلى خليج غينيا.
   */
  const resultPoints = useMemo(
    () => properties
      .filter((p) => p.latitude && p.longitude)
      .map((p) => [Number(p.latitude), Number(p.longitude)] as [number, number])
      .filter(([la, ln]) => Number.isFinite(la) && Number.isFinite(ln) && (la !== 0 || ln !== 0)),
    [properties],
  );

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
    // ⚠️ **عرضٌ كامل لا عمود محصور**: هذه شاشة تصفّح لا مقال. الخريطة والشبكة
    // جنباً إلى جنب تحتاجان كل بكسل، وحصرهما في 80rem يترك هامشين فارغين على
    // الشاشات العريضة ويضغط الخريطة حتى تصير مصغّرة لا خريطة.
    <div className="w-full px-3 sm:px-5 lg:px-6 py-6">
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: sectionLabel("properties") }]} />
      {/* ─── الشريط ─────────────────────────────────────────────────────
          ⚠️ **أُعيد بناؤه على المرجع حرفياً**: كان حاويةً بيضاء ثقيلة بشريط
          متدرّج وأيقونة وعنوان «العقارات» مكرّراً — والعنوان موجودٌ فوقه في
          الكتلة التعريفية، فكان يقوله مرّتين ويأكل ثلث الشاشة قبل أوّل عقار.
          المرجع: صفٌّ واحد للبحث والفلاتر، وصفٌّ ثانٍ للعدد والترتيب، لا أكثر.

          ⚠️ **والزجاج هنا مصقول لا شفّاف**: لا صورة خلف هذه الشاشة، فالزجاج
          الشديد الشفافية يبدو باهتاً. `bg-white/70` + `backdrop-blur` + حدّ
          شعرة يعطي الحسّ الزجاجيّ ويُبقي النصّ مقروءاً على خلفية فاتحة. */}
      <div className="mb-5 overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-e2 backdrop-blur-xl">
        {/* صفّ ① — البحث والفلاتر */}
        <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
          <div className="relative flex-1 min-w-[16rem]">
            <Magnifer className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="ابحث بالعنوان أو الحي…"
              className="h-11 w-full rounded-full border border-white/60 bg-white/70 ps-11 pe-4 text-body text-ink shadow-e1 backdrop-blur-xl outline-none transition-colors placeholder:text-muted focus:border-primary-300 focus:bg-white"
            />
          </div>

          {/* رقائق الفلاتر النشطة — تُقرأ وتُزال بنقرة، كما في المرجع */}
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              onClick={chip.clear}
              className="group inline-flex h-11 items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 text-caption font-semibold text-ink shadow-e1 backdrop-blur-xl transition-colors hover:border-primary-300"
            >
              {chip.label}
              <CloseCircle className="h-4 w-4 text-muted transition-colors group-hover:text-primary" />
            </button>
          ))}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-caption font-bold text-white shadow-e2 transition-colors hover:bg-primary-400"
          >
            <SliderHorizontal className="h-4 w-4" />
            كل الفلاتر
            {activeFilterCount > 0 && (
              <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white/25 px-1.5 text-caption font-bold">
                {formatNumber(activeFilterCount)}
              </span>
            )}
          </button>
        </div>

        {/* صفّ ② — العدد والترتيب والإجراءات (يفصله خطّ شعرة كما في المرجع) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/[0.06] p-3 sm:p-4">
          <h2 className="text-h2 text-ink">
            {loading ? "جارٍ التحميل…" : <>{formatNumber(total)} عقار متاح</>}
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={filters.ordering}
                onChange={(e) => handleFilterChange("ordering", e.target.value)}
                className="h-10 appearance-none rounded-full border border-white/60 bg-white/70 ps-4 pe-9 text-caption font-semibold text-ink shadow-e1 backdrop-blur-xl outline-none focus:border-primary-300"
              >
                <option value="-created_at">الأحدث</option>
                <option value="price">السعر: الأقل</option>
                <option value="-price">السعر: الأعلى</option>
                <option value="-views_count">الأكثر مشاهدة</option>
              </select>
              <AltArrowDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            </div>
            <button
              onClick={saveSearch}
              title="احفظ هذا البحث لتصلك تنبيهات المطابقة"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/60 bg-white/70 px-4 text-caption font-semibold text-ink shadow-e1 backdrop-blur-xl transition-colors hover:border-primary-300"
            >
              <Bookmark className="h-4 w-4" /> احفظ البحث
            </button>
            <button
              onClick={() => requireAuth(() => router.push("/properties/create"))}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gold px-4 text-caption font-bold text-ink shadow-e2 transition-colors hover:bg-gold/90"
            >
              <AddCircle className="h-4 w-4" /> أضف عقار
            </button>
          </div>
        </div>

        {/* بحث بجملة — يبقى، فهو ما لا تملكه المنصّات المرجعية */}
        <div className="border-t border-ink/[0.06] p-3 sm:p-4">
          <SmartSearchBar onResult={applyAiFilters} />
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
          {/* يظهر فقط حين تُختار مدينة ولها أحياء مسجّلة. */}
          {cityId && hoods.length > 0 && (
            <Select
              label="الحيّ"
              options={hoods.map((h) => ({
                value: String(h.id),
                label: h.properties_count ? `${h.name} (${h.properties_count})` : h.name,
              }))}
              value={filters.neighborhood_ref}
              onChange={(e) => handleFilterChange("neighborhood_ref", e.target.value)}
              placeholder="كل الأحياء"
            />
          )}
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
          <Select
            label="عملة السعر"
            options={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))}
            value={filters.price_currency}
            onChange={(e) => handleFilterChange("price_currency", e.target.value)}
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

      {/* ─── الشبكة والخريطة معاً ───────────────────────────────────────
          ⚠️ على الجوّال تعلو الخريطةُ الشبكةَ بارتفاع ثابت بدل أن تُخفى: الغرض
          أن يرى الباحث «أين» دائماً، وعمودان لا يتّسعان تحت 1024 بكسل. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,46%)] lg:gap-4 lg:items-start">
      <aside className="lg:hidden h-64 mb-4 overflow-hidden rounded-3xl border border-white/60 shadow-e2">
        <PropertiesMap center={mapCenter} zoom={DEFAULT_ZOOM} filters={mapFilters} fitPoints={resultPoints} />
      </aside>
      <div className="min-w-0">
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
        <div className="grid grid-cols-1 min-[560px]:grid-cols-2 gap-4">
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
      </div>

      {/* ⚠️ **الخريطة لاصقة وبارتفاع الشاشة**: قائمةٌ تُمرَّر وخريطةٌ تختفي مع
          التمرير تُلغي فائدة الوضع المزدوج — الغرض أن يبقى «أين» أمام العين
          بينما تتصفّح «ماذا». وتُخفى تحت 1024 بكسل حيث لا يتّسع عمودان. */}
      <aside className="hidden lg:block sticky top-24 h-[calc(100svh-8rem)] overflow-hidden rounded-2xl card-shadow">
        <PropertiesMap center={mapCenter} zoom={DEFAULT_ZOOM} filters={mapFilters} fitPoints={resultPoints} />
      </aside>
      </div>
      {/* إعلان واحد أسفل القائمة — كثافة خفيفة عمداً، ولا يظهر على قائمة
          فارغة أو أثناء التحميل (سياسة «شاشات بلا محتوى ناشر»). */}
      <AdSlot slot={AD_SLOTS.listBottom} hasContent={!loading && properties.length > 0} />
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
