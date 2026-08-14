"use client";

import type { City, PropertyTypeItem } from "@/types";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PhoneField } from "@/components/ui/PhoneField";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { CURRENCIES } from "@/lib/utils";
import { NeighborhoodInput } from "@/components/properties/NeighborhoodInput";
import {
  Layers, TagPrice, Leaf, Box, Shield, WiFiRouter, CloudBolt, Bolt, Paw,
} from "@solar-icons/react";

// ─── حالة نموذج العقار (كل الحقول النصية كسلاسل) ───────────────────────────
export interface PropertyFormState {
  title: string;
  description: string;
  property_type: string; // id
  offer_type: string;
  price: string;
  currency: string;
  area: string;
  rooms: string;
  bathrooms: string;
  floor: string;
  total_floors: string;
  furnishing: string;
  city: string;
  neighborhood: string;
  // مرجع الحيّ إن طابق المكتوبُ حياً مسجّلاً — يبقى الاسم نصّاً حرّاً دائماً.
  neighborhood_ref: string;
  address: string;
  /** رابط فيديو يوتيوب اختياري — جولة مصوّرة للعقار */
  video_url: string;
  contact_phone: string;
  contact_whatsapp: string;
  status: string;
  has_elevator: boolean;
  has_parking: boolean;
  has_garden: boolean;
  has_pool: boolean;
  has_security: boolean;
  has_internet: boolean;
  has_ac: boolean;
  has_generator: boolean;
  has_storage: boolean;
  pets_allowed: boolean;
}

export const emptyPropertyForm: PropertyFormState = {
  title: "", description: "", property_type: "", offer_type: "sale",
  price: "", currency: "YER", area: "", rooms: "", bathrooms: "", floor: "",
  total_floors: "", furnishing: "", city: "", neighborhood: "", neighborhood_ref: "", address: "",
  video_url: "",
  contact_phone: "", contact_whatsapp: "", status: "available",
  has_elevator: false, has_parking: false, has_garden: false, has_pool: false,
  has_security: false, has_internet: false, has_ac: false, has_generator: false,
  has_storage: false, pets_allowed: false,
};

export const FEATURE_TOGGLES = [
  { key: "has_elevator", label: "مصعد", icon: Layers },
  { key: "has_parking", label: "موقف سيارة", icon: TagPrice },
  { key: "has_garden", label: "حديقة", icon: Leaf },
  { key: "has_pool", label: "مسبح", icon: Box },
  { key: "has_security", label: "أمن وحراسة", icon: Shield },
  { key: "has_internet", label: "إنترنت", icon: WiFiRouter },
  { key: "has_ac", label: "تكييف", icon: CloudBolt },
  { key: "has_generator", label: "مولد كهربائي", icon: Bolt },
  { key: "has_storage", label: "غرفة تخزين", icon: Box },
  { key: "pets_allowed", label: "يسمح بالحيوانات", icon: Paw },
] as const;

const OFFER_TYPE_OPTS = [
  { value: "sale", label: "للبيع" },
  { value: "rent_monthly", label: "إيجار شهري" },
  { value: "rent_yearly", label: "إيجار سنوي" },
];

// المصدر الموحّد للعملات — لا تُكرَّر القائمة في المكوّنات.
const CURRENCY_OPTS = CURRENCIES.map((c) => ({ value: c.value, label: c.label }));

const FURNISHING_OPTS = [
  { value: "furnished", label: "مفروشة" },
  { value: "unfurnished", label: "غير مفروشة" },
  { value: "semi_furnished", label: "نصف مفروشة" },
];

const STATUS_OPTS = [
  { value: "available", label: "متاح" },
  { value: "reserved", label: "محجوز" },
  { value: "sold_rented", label: "مباع / مؤجّر" },
];

interface Props {
  form: PropertyFormState;
  setField: <K extends keyof PropertyFormState>(key: K, value: PropertyFormState[K]) => void;
  cities: City[];
  propertyTypes: PropertyTypeItem[];
}

// ─── حقول نموذج العقار (مشترك بين إنشاء وتعديل) ────────────────────────────
export function PropertyFormFields({ form, setField, cities, propertyTypes }: Props) {
  return (
    <div className="space-y-5">
      <Input
        label="عنوان العقار"
        placeholder="مثال: شقة فاخرة للإيجار في صنعاء"
        value={form.title}
        onChange={(e) => setField("title", e.target.value)}
        required
      />

      <div>
        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">الوصف</label>
        <textarea
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          rows={4}
          placeholder="اكتب وصفاً تفصيلياً للعقار..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="نوع العقار"
          options={propertyTypes.map((p) => ({ value: p.id, label: p.name_ar }))}
          value={form.property_type}
          onChange={(e) => setField("property_type", e.target.value)}
          placeholder="اختر النوع"
          required
        />
        <Select
          label="نوع العرض"
          options={OFFER_TYPE_OPTS}
          value={form.offer_type}
          onChange={(e) => setField("offer_type", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
            السعر <span className="text-gray-400 font-normal">(اختياري)</span>
          </label>
          <MoneyInput
            value={form.price}
            onChange={(raw) => setField("price", raw)}
            placeholder="السعر عند التواصل"
          />
        </div>
        <Select
          label="العملة"
          options={CURRENCY_OPTS}
          value={form.currency}
          onChange={(e) => setField("currency", e.target.value)}
        />
        <Input
          label="المساحة (م²)"
          type="number"
          placeholder="غير محدد"
          value={form.area}
          onChange={(e) => setField("area", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Input label="الغرف" type="number" placeholder="0" value={form.rooms} onChange={(e) => setField("rooms", e.target.value)} />
        <Input label="الحمامات" type="number" placeholder="0" value={form.bathrooms} onChange={(e) => setField("bathrooms", e.target.value)} />
        <Input label="الطابق" type="number" placeholder="0" value={form.floor} onChange={(e) => setField("floor", e.target.value)} />
        <Input label="إجمالي الطوابق" type="number" placeholder="0" value={form.total_floors} onChange={(e) => setField("total_floors", e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="التأثيث"
          options={FURNISHING_OPTS}
          value={form.furnishing}
          onChange={(e) => setField("furnishing", e.target.value)}
          placeholder="غير محدد"
        />
        <Select
          label="الحالة"
          options={STATUS_OPTS}
          value={form.status}
          onChange={(e) => setField("status", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="المدينة"
          options={cities.map((c) => ({ value: c.id, label: c.name_ar }))}
          value={form.city}
          onChange={(e) => setField("city", e.target.value)}
          placeholder="اختر المدينة"
          required
        />
        <NeighborhoodInput
          cityId={form.city}
          value={form.neighborhood}
          onChange={(name, refId) => {
            setField("neighborhood", name);
            setField("neighborhood_ref", refId);
          }}
        />
      </div>

      <Input label="العنوان التفصيلي" placeholder="الشارع، أقرب معلم..." value={form.address} onChange={(e) => setField("address", e.target.value)} />

      {/* جولة مصوّرة تُغني عن عشرات الصور وتختصر أسئلة المهتمّين. */}
      <Input
        label="رابط فيديو يوتيوب (اختياري)"
        placeholder="https://youtu.be/..."
        dir="ltr"
        value={form.video_url}
        onChange={(e) => setField("video_url", e.target.value)}
        hint="الصق رابط الفيديو كاملاً — يُعرض داخل صفحة العقار."
      />

      <div className="grid grid-cols-2 gap-4">
        <PhoneField
          label="رقم التواصل"
          value={form.contact_phone}
          onChange={(v) => setField("contact_phone", v)}
        />
        <PhoneField
          label="واتساب"
          value={form.contact_whatsapp}
          onChange={(v) => setField("contact_whatsapp", v)}
        />
      </div>

      {/* المميزات */}
      <div>
        <label className="text-sm font-semibold text-gray-700 mb-2 block">المميزات</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FEATURE_TOGGLES.map(({ key, label, icon: Icon }) => {
            const active = form[key as keyof PropertyFormState] as boolean;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setField(key as keyof PropertyFormState, !active as never)}
                className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl border transition-colors ${
                  active
                    ? "bg-primary/10 border-primary text-primary font-semibold"
                    : "bg-white border-gray-200 text-gray-500 hover:border-primary/40"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── محوّلات القيم إلى payload الخادم ────────────────────────────────────────

// حقول رقمية اختيارية — فارغة تعني null
const NUMERIC_OPTIONAL = ["area", "rooms", "bathrooms", "floor", "total_floors"] as const;
const BOOLEAN_KEYS = FEATURE_TOGGLES.map((f) => f.key);

// multipart لإنشاء عقار (مع الصور)
export function buildPropertyFormData(form: PropertyFormState, images: File[]): FormData {
  const fd = new FormData();
  fd.append("title", form.title);
  if (form.description) fd.append("description", form.description);
  fd.append("property_type", form.property_type);
  fd.append("offer_type", form.offer_type);
  if (form.price) fd.append("price", form.price);  // فارغ = «السعر عند التواصل»
  fd.append("currency", form.currency);
  fd.append("city", form.city);
  fd.append("status", form.status);
  if (form.furnishing) fd.append("furnishing", form.furnishing);
  if (form.neighborhood) fd.append("neighborhood", form.neighborhood);
  if (form.neighborhood_ref) fd.append("neighborhood_ref", form.neighborhood_ref);
  if (form.address) fd.append("address", form.address);
  if (form.video_url) fd.append("video_url", form.video_url);
  if (form.contact_phone) fd.append("contact_phone", form.contact_phone);
  if (form.contact_whatsapp) fd.append("contact_whatsapp", form.contact_whatsapp);
  NUMERIC_OPTIONAL.forEach((k) => { if (form[k]) fd.append(k, form[k]); });
  BOOLEAN_KEYS.forEach((k) => fd.append(k, String(form[k as keyof PropertyFormState])));
  images.forEach((img) => fd.append("images", img));
  return fd;
}

// JSON لتعديل عقار (PATCH) — القيم الرقمية الفارغة تصبح null
export function buildPropertyPatch(form: PropertyFormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: form.title,
    description: form.description,
    property_type: Number(form.property_type),
    offer_type: form.offer_type,
    price: form.price || null,  // فارغ = «السعر عند التواصل»
    currency: form.currency,
    city: Number(form.city),
    status: form.status,
    furnishing: form.furnishing || null,
    neighborhood: form.neighborhood,
    neighborhood_ref: form.neighborhood_ref ? Number(form.neighborhood_ref) : null,
    address: form.address,
    video_url: form.video_url,
    contact_phone: form.contact_phone,
    contact_whatsapp: form.contact_whatsapp,
  };
  NUMERIC_OPTIONAL.forEach((k) => { payload[k] = form[k] ? Number(form[k]) : null; });
  BOOLEAN_KEYS.forEach((k) => { payload[k] = form[k as keyof PropertyFormState]; });
  return payload;
}
