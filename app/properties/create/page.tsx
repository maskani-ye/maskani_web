"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { useCity } from "@/context/CityContext";
import type { City, PropertyTypeItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { PhoneField } from "@/components/ui/PhoneField";
import { getServiceIcon } from "@/lib/serviceIcons";
import { MoneyInput } from "@/components/ui/MoneyInput";
import {
  emptyPropertyForm, buildPropertyFormData, type PropertyFormState,
} from "@/components/properties/PropertyFormFields";
import {
  Tuning4, AltArrowDown, AltArrowUp, MapPoint, City as CityIcon,
  CheckCircle, CloseCircle, GalleryAdd, Phone, Copy,
} from "@solar-icons/react";
import { toast } from "sonner";
import { SuggestDescriptionButton } from "@/components/ai/SuggestDescriptionButton";
import { ImproveTextButton } from "@/components/ai/ImproveTextButton";
import { compressImages } from "@/lib/imageCompression";
import { CURRENCIES } from "@/lib/utils";

// خريطة الاختيار تُحمَّل ديناميكياً (Leaflet يحتاج window).
const LocationPickerMap = dynamic(() => import("@/components/map/LocationPickerMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse rounded-2xl" />,
});

const STEP_TITLES = ["الأساسيات", "الموقع", "الصور والتواصل"];
const LAST_STEP = 2;

const OFFER_TYPES: Record<string, string> = {
  sale: "بيع",
  rent_monthly: "إيجار شهري",
  rent_yearly: "إيجار سنوي",
};

const FURNISHING: Record<string, string> = {
  furnished: "مفروشة",
  semi_furnished: "نصف مفروشة",
  unfurnished: "غير مفروشة",
};

const AMENITIES: { key: keyof PropertyFormState; label: string }[] = [
  { key: "has_elevator", label: "مصعد" },
  { key: "has_parking", label: "موقف سيارات" },
  { key: "has_garden", label: "حديقة" },
  { key: "has_pool", label: "مسبح" },
  { key: "has_security", label: "حراسة أمنية" },
  { key: "has_internet", label: "إنترنت" },
  { key: "has_ac", label: "تكييف مركزي" },
];

// مركز افتراضي (صنعاء) حين لا إحداثيات للمدينة.
const YEMEN_CENTER: [number, number] = [15.3694, 44.191];

export default function CreatePropertyPage() {
  const { user, loading: authLoading } = useAuth();
  const { requireAuth } = useAuthGate();
  const { cityId: globalCityId } = useCity();
  const router = useRouter();

  const [cities, setCities] = useState<City[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeItem[]>([]);
  const [form, setForm] = useState<PropertyFormState>(emptyPropertyForm);
  const [images, setImages] = useState<File[]>([]);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [step, setStep] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) requireAuth(undefined, () => router.push("/"));
  }, [user, authLoading, router]);

  useEffect(() => {
    api.get("/cities/").then((r) => setCities(r.data.results ?? [])).catch(() => {});
    api.get("/properties/property-types/").then((r) => setPropertyTypes(r.data.results ?? r.data ?? [])).catch(() => {});
  }, []);

  // تعبئة الهاتف والمدينة تلقائياً (نفس منطق التطبيق: المدينة العالمية ثم مدينة المستخدم).
  useEffect(() => {
    setForm((p) => {
      const next = { ...p };
      if (!next.contact_phone && user?.phone) next.contact_phone = user.phone;
      if (!next.city) {
        if (globalCityId) next.city = globalCityId;
        else if (user?.city) next.city = String(user.city);
      }
      return next;
    });
  }, [user, globalCityId]);

  const setField = <K extends keyof PropertyFormState>(key: K, value: PropertyFormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const selectedPt = useMemo(
    () => propertyTypes.find((p) => String(p.id) === form.property_type),
    [propertyTypes, form.property_type]
  );
  const slug = selectedPt?.slug;
  const showFurnishing = slug === "apartment" || slug === "house";
  const isLand = slug === "land";
  const currency = CURRENCIES.find((c) => c.value === form.currency) ?? CURRENCIES[0];
  const priceNum = parseFloat(form.price);

  const mapCenter = useMemo<[number, number]>(() => {
    const c = cities.find((x) => String(x.id) === form.city);
    if (c?.latitude && c?.longitude) return [parseFloat(c.latitude), parseFloat(c.longitude)];
    return YEMEN_CENTER;
  }, [cities, form.city]);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImages((p) => [...p, ...Array.from(e.target.files!)].slice(0, 10));
  };

  // ── التحقق لكل خطوة (مطابق للتطبيق) ──
  function validateStep(): boolean {
    if (step === 0) {
      if (!form.title.trim()) return fail("يرجى إدخال عنوان العقار");
      if (!form.property_type) return fail("يرجى اختيار نوع العقار");
      // السعر اختياري — يُتحقَّق فقط إن أُدخل.
      if (form.price.trim() && (isNaN(priceNum) || priceNum < 0)) return fail("السعر المُدخل غير صحيح");
    } else if (step === 1) {
      if (!form.city) return fail("يرجى اختيار المدينة");
    } else if (step === 2) {
      if (form.contact_phone.replace(/\D/g, "").length < 7) return fail("يرجى إدخال رقم التواصل");
    }
    return true;
  }
  function fail(msg: string) {
    toast.error(msg);
    return false;
  }

  function onPrimary() {
    if (!validateStep()) return;
    if (step < LAST_STEP) setStep((s) => s + 1);
    else submit();
  }

  async function submit() {
    setSaving(true);
    try {
      const fd = buildPropertyFormData(form, await compressImages(images));
      if (loc) {
        fd.set("latitude", loc.lat.toFixed(6));
        fd.set("longitude", loc.lng.toFixed(6));
      }
      const { data } = await api.post("/properties/create/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("تم نشر العقار بنجاح");
      router.push(`/properties/${data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-5">إضافة عقار جديد</h1>

      {/* مؤشّر التقدّم */}
      <Stepper step={step} />

      <div className="bg-white rounded-3xl card-shadow p-5 sm:p-6 mt-4">
        {step === 0 && (
          <StepBasics
            form={form} setField={setField} propertyTypes={propertyTypes}
            currency={currency}
            showFurnishing={showFurnishing} isLand={isLand}
            detailsOpen={detailsOpen} setDetailsOpen={setDetailsOpen}
          />
        )}
        {step === 1 && (
          <StepLocation
            form={form} setField={setField} cities={cities}
            loc={loc} setLoc={setLoc} mapCenter={mapCenter}
          />
        )}
        {step === 2 && (
          <StepMedia
            form={form} setField={setField} user={user}
            images={images} setImages={setImages} onImages={handleImages}
          />
        )}
      </div>

      {/* الشريط السفلي */}
      <div className="flex items-center gap-3 mt-5">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} className="w-28">
            السابق
          </Button>
        )}
        <Button type="button" onClick={onPrimary} loading={saving && step === LAST_STEP} fullWidth size="lg">
          {step === LAST_STEP ? "نشر العقار" : "التالي"}
        </Button>
      </div>
    </div>
  );
}

// ─── مؤشّر التقدّم ───────────────────────────────────────────────────────────
function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-start">
      {STEP_TITLES.map((title, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <div key={i} className="flex items-start flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  done || active ? "bg-primary border-primary text-white" : "bg-white border-gray-200 text-gray-400"
                }`}
              >
                {done ? <CheckCircle weight="Bold" className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-[11px] mt-1.5 ${active ? "text-primary font-semibold" : "text-gray-500"}`}>
                {title}
              </span>
            </div>
            {i < STEP_TITLES.length - 1 && (
              <div className={`h-0.5 flex-1 mt-4 ${done ? "bg-primary" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── عناصر مشتركة ────────────────────────────────────────────────────────────
function SectionLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="text-sm font-semibold text-gray-700 mb-2 block">
      {text}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

function Chip({ label, selected, onClick, icon }: { label: string; selected: boolean; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm transition-colors ${
        selected
          ? "bg-primary/15 border-primary text-primary font-bold"
          : "bg-white border-gray-200 text-gray-500 hover:border-primary/40"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

const inputCls =
  "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

// ─── ① الأساسيات ─────────────────────────────────────────────────────────────
function StepBasics({
  form, setField, propertyTypes, currency, showFurnishing, isLand, detailsOpen, setDetailsOpen,
}: {
  form: PropertyFormState;
  setField: <K extends keyof PropertyFormState>(k: K, v: PropertyFormState[K]) => void;
  propertyTypes: PropertyTypeItem[];
  currency: { value: string; symbol: string; label: string };
  showFurnishing: boolean;
  isLand: boolean;
  detailsOpen: boolean;
  setDetailsOpen: (v: boolean) => void;
}) {
  return (
    <div>
      <SectionLabel text="نوع العرض" required />
      <div className="flex flex-wrap gap-2">
        {Object.entries(OFFER_TYPES).map(([v, label]) => (
          <Chip key={v} label={label} selected={form.offer_type === v} onClick={() => setField("offer_type", v)} />
        ))}
      </div>

      <div className="h-4" />
      <SectionLabel text="نوع العقار" required />
      <div className="flex flex-wrap gap-2">
        {propertyTypes.map((pt) => {
          const Icon = getServiceIcon(pt.icon);
          const sel = form.property_type === String(pt.id);
          return (
            <Chip
              key={pt.id}
              label={pt.name_ar}
              selected={sel}
              onClick={() => setField("property_type", String(pt.id))}
              icon={<Icon className="h-4 w-4" />}
            />
          );
        })}
      </div>

      <div className="h-4" />
      <SectionLabel text="عنوان العقار" required />
      <input
        className={inputCls}
        placeholder="مثال: شقة فاخرة للإيجار في حي راقٍ"
        value={form.title}
        onChange={(e) => setField("title", e.target.value)}
      />

      <div className="h-4" />
      <SectionLabel text="السعر (اختياري)" />
      <MoneyInput
        value={form.price}
        onChange={(raw) => setField("price", raw)}
        symbol={currency.symbol}
        placeholder="اتركه فارغاً — السعر عند التواصل"
      />
      <div className="flex flex-wrap gap-2 mt-2">
        {CURRENCIES.map((c) => (
          <Chip key={c.value} label={`${c.symbol} ${c.label}`} selected={form.currency === c.value} onClick={() => setField("currency", c.value)} />
        ))}
      </div>

      <div className="h-5" />
      {/* تفاصيل إضافية (اختياري) — مطوية */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="w-full flex items-center gap-2.5 px-3.5 py-3.5"
        >
          <Tuning4 className="h-5 w-5 text-gray-400" />
          <span className="flex-1 text-start text-sm font-semibold text-gray-700">تفاصيل إضافية (اختياري)</span>
          {detailsOpen ? <AltArrowUp className="h-4 w-4 text-gray-400" /> : <AltArrowDown className="h-4 w-4 text-gray-400" />}
        </button>
        {detailsOpen && (
          <div className="px-3.5 pb-4 border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between gap-2">
              <SectionLabel text="الوصف" />
              <SuggestDescriptionButton kind="property" title={form.title} fields={{ "السعر": form.price, "المساحة": form.area, "الغرف": form.rooms }} onSuggest={(d) => setField("description", d)} />
              {form.description?.trim().length >= 10 && (
                <ImproveTextButton kind="property" text={form.description} onImprove={(d) => setField("description", d)} />
              )}
            </div>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="تفاصيل تساعد المهتمين على معرفة العقار"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />

            <div className="h-3" />
            <SectionLabel text="المساحة" />
            <div className="relative">
              <input className={inputCls} type="number" placeholder="0" value={form.area} onChange={(e) => setField("area", e.target.value)} />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">م²</span>
            </div>

            {!isLand && (
              <>
                <div className="h-3" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <SectionLabel text="الغرف" />
                    <input className={inputCls} type="number" placeholder="0" value={form.rooms} onChange={(e) => setField("rooms", e.target.value)} />
                  </div>
                  <div>
                    <SectionLabel text="دورات المياه" />
                    <input className={inputCls} type="number" placeholder="0" value={form.bathrooms} onChange={(e) => setField("bathrooms", e.target.value)} />
                  </div>
                </div>
                <div className="h-3" />
                <SectionLabel text="رقم الدور" />
                <input className={inputCls} type="number" placeholder="0" value={form.floor} onChange={(e) => setField("floor", e.target.value)} />
              </>
            )}

            {showFurnishing && (
              <>
                <div className="h-4" />
                <SectionLabel text="الأثاث" />
                <div className="flex flex-wrap gap-2">
                  {Object.entries(FURNISHING).map(([v, label]) => (
                    <Chip
                      key={v}
                      label={label}
                      selected={form.furnishing === v}
                      onClick={() => setField("furnishing", form.furnishing === v ? "" : v)}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="h-4" />
            <SectionLabel text="المميزات" />
            <div className="grid grid-cols-2 gap-2">
              {AMENITIES.map(({ key, label }) => {
                const active = form[key] as boolean;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setField(key, !active as never)}
                    className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl border transition-colors ${
                      active ? "bg-primary/10 border-primary text-primary font-semibold" : "bg-white border-gray-200 text-gray-500 hover:border-primary/40"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center ${active ? "bg-primary border-primary" : "border-gray-300"}`}>
                      {active && <CheckCircle weight="Bold" className="h-3 w-3 text-white" />}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ② الموقع ────────────────────────────────────────────────────────────────
function StepLocation({
  form, setField, cities, loc, setLoc, mapCenter,
}: {
  form: PropertyFormState;
  setField: <K extends keyof PropertyFormState>(k: K, v: PropertyFormState[K]) => void;
  cities: City[];
  loc: { lat: number; lng: number } | null;
  setLoc: (v: { lat: number; lng: number } | null) => void;
  mapCenter: [number, number];
}) {
  return (
    <div>
      <SectionLabel text="المدينة" required />
      <div className="relative">
        <CityIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        <select
          className={`${inputCls} appearance-none pr-11 ${form.city ? "text-gray-900" : "text-gray-400"}`}
          value={form.city}
          onChange={(e) => setField("city", e.target.value)}
        >
          <option value="">اختر مدينة</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name_ar}</option>
          ))}
        </select>
        <AltArrowDown className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      <div className="h-4" />
      <SectionLabel text="الحي (اختياري)" />
      <input className={inputCls} placeholder="اسم الحي" value={form.neighborhood} onChange={(e) => setField("neighborhood", e.target.value)} />

      <div className="h-4" />
      <SectionLabel text="العنوان التفصيلي (اختياري)" />
      <input className={inputCls} placeholder="وصف قريب للموقع" value={form.address} onChange={(e) => setField("address", e.target.value)} />

      <div className="h-5" />
      <SectionLabel text="موقع العقار على الخريطة (اختياري)" />
      <div className="h-56 rounded-2xl overflow-hidden border border-gray-200">
        <LocationPickerMap
          lat={loc?.lat ?? null}
          lng={loc?.lng ?? null}
          center={mapCenter}
          onPick={(lat, lng) => setLoc({ lat, lng })}
        />
      </div>
      {loc ? (
        <div className="flex items-center gap-1.5 mt-2 text-xs">
          <MapPoint weight="Bold" className="h-4 w-4 text-primary" />
          <span className="text-gray-500">
            تم تحديد الموقع ({loc.lat.toFixed(5)}, {loc.lng.toFixed(5)})
          </span>
          <button type="button" onClick={() => setLoc(null)} className="mr-auto text-red-500 font-semibold">
            إزالة
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mt-2">اضغط على الخريطة لتحديد موقع العقار</p>
      )}
    </div>
  );
}

// ─── ③ الصور والتواصل ────────────────────────────────────────────────────────
function StepMedia({
  form, setField, user, images, setImages, onImages,
}: {
  form: PropertyFormState;
  setField: <K extends keyof PropertyFormState>(k: K, v: PropertyFormState[K]) => void;
  user: { phone: string };
  images: File[];
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
  onImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <SectionLabel text="رقم التواصل" required />
      <PhoneField label="" value={form.contact_phone} onChange={(v) => setField("contact_phone", v)} />
      <button
        type="button"
        onClick={() => user.phone && setField("contact_phone", user.phone)}
        className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold"
      >
        <Phone className="h-3.5 w-3.5" /> استخدم رقمي
      </button>

      <div className="h-5" />
      <SectionLabel text="رقم واتساب (اختياري)" />
      <PhoneField label="" value={form.contact_whatsapp} onChange={(v) => setField("contact_whatsapp", v)} />
      <button
        type="button"
        onClick={() => setField("contact_whatsapp", form.contact_phone)}
        className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold"
      >
        <Copy className="h-3.5 w-3.5" /> نفس رقم التواصل
      </button>

      <div className="h-6" />
      <div className="flex items-center justify-between">
        <SectionLabel text="الصور (اختياري)" />
        <span className="text-sm text-gray-400">{images.length}/10</span>
      </div>
      <p className="text-xs text-gray-400 -mt-1 mb-2.5">الصورة الأولى ستكون الصورة الرئيسية للعقار</p>
      <div className="flex flex-wrap gap-2">
        {images.map((img, i) => (
          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute bottom-1 right-1 text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-md">رئيسية</span>
            )}
            <button
              type="button"
              onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
              className="absolute top-1 left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
            >
              <CloseCircle className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        ))}
        {images.length < 10 && (
          <label className="w-20 h-20 border-2 border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/40 bg-gray-50">
            <GalleryAdd className="h-5 w-5 text-gray-400" />
            <span className="text-[10px] text-gray-400">إضافة</span>
            <input type="file" multiple accept="image/*" onChange={onImages} className="hidden" />
          </label>
        )}
      </div>
    </div>
  );
}
