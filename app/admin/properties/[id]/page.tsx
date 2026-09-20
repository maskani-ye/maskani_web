"use client";

/**
 * صفحة العقار في لوحة الإدارة — عرضٌ وتعديلٌ وصورٌ وتحليلات في مكانٍ واحد.
 *
 * ⚠️ **لماذا صفحة لا لوحٌ جانبيّ.** القائمة تفتح معاينةً جانبية ضيّقة تكفي
 * للنظرة السريعة ولا تكفي للعمل: تعديل الوصف، وحذف صورةٍ دخيلة، وقراءة أداء
 * الإعلان — ثلاثة أشياء تحتاج مساحةً وحالةً خاصّة بها. والمعاينة تبقى كما هي
 * للنظرة العابرة؛ هذه الصفحة لمن يريد أن يُغيّر شيئاً.
 *
 * ⚠️ **التعديل يُرسل الحقول المتغيّرة وحدها.** إرسال النموذج كاملاً في كل حفظ
 * يكتب على حقولٍ لم تُلمَس — ولو بالقيمة نفسها — فيضيع أثر «من غيّر ماذا» في
 * سجلّ الإدارة، ويكفي حقلٌ واحد فارغ ليمسح بيانات صحيحة.
 */

import { useState, useEffect, useCallback, useMemo, useRef, type ComponentType } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { compressImages } from "@/lib/imageCompression";
import { formatPrice, NUMERIC_LOCALE } from "@/lib/utils";
import type { PropertyTypeRef } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatCard } from "@/components/ui/StatCard";
import { ChartCard } from "@/components/ui/ChartCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import {
  Buildings2, Eye, TrashBinTrash, Star, ArrowRight, GalleryWide,
  ChartSquare, Pen, AddCircle, CheckCircle, DangerCircle, Heart, Share,
  Phone, MapPoint, User,
} from "@solar-icons/react";

// أيقونات Solar تُعرّف `weight` كنوع اتحادي، وStatCard تتوقّع عرضاً أوسع —
// نفس التوسعة المستعملة في لوحة التحكم (`app/admin/page.tsx`)، لا حيلة ثانية.
type IconLike = ComponentType<{ className?: string }>;
const asIcon = (I: IconLike): IconLike => I;

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropImage { id: number; image: string; is_main: boolean }
interface OwnerRef { id: number; full_name?: string; phone?: string; avatar?: string | null }
interface CommentRef { id: number; text: string; user_name?: string; created_at: string }

interface PropertyDetail {
  id: number;
  title: string;
  description: string | null;
  property_type: PropertyTypeRef | null;
  offer_type: string;
  price: string;
  currency: string;
  area: string | null;
  city: number;
  city_name?: string;
  neighborhood: string | null;
  address: string | null;
  furnishing: string | null;
  status: string;
  rooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  total_floors: number | null;
  latitude: string | null;
  longitude: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  video_url?: string | null;
  is_active: boolean;
  is_promoted: boolean;
  is_deleted: boolean;
  views_count: number;
  created_at: string;
  ai_risk?: string;
  ai_flags?: string[];
  amenities: string[];
  images: PropImage[];
  owner: OwnerRef | null;
  comments: CommentRef[];
  user_name?: string;
  user_phone?: string;
}

interface Perf {
  window_days: number;
  views_total: number;
  views: number;
  contacts: number;
  favorites: number;
  shares: number;
  daily: { day: string; views: number }[];
  sources: { source: string; n: number }[];
  platforms: { platform: string; n: number }[];
  devices: { device_type: string; n: number }[];
  cities: { city: string; n: number }[];
  bot_views?: number;
}

interface CityRef { id: number; name_ar: string }

// ─── Labels ───────────────────────────────────────────────────────────────────

const OFFER_LABELS: Record<string, string> = {
  sale: "بيع", rent_monthly: "إيجار شهري", rent_yearly: "إيجار سنوي",
};
const STATUS_LABELS: Record<string, string> = {
  available: "متاح", reserved: "محجوز", sold_rented: "مُباع/مؤجَّر",
};
const FURNISH_LABELS: Record<string, string> = {
  furnished: "مفروش", unfurnished: "غير مفروش", semi_furnished: "نصف مفروش",
};
const AMENITY_LABELS: Record<string, string> = {
  has_elevator: "مصعد", has_parking: "موقف", has_garden: "حديقة",
  has_pool: "مسبح", has_security: "حراسة", has_internet: "إنترنت",
  has_ac: "تكييف", has_generator: "مولّد", has_storage: "مخزن",
  pets_allowed: "الحيوانات مسموحة",
};
const AMENITY_KEYS = Object.keys(AMENITY_LABELS);

const TABS = [
  { key: "details", label: "التفاصيل والتعديل", Icon: Pen },
  { key: "images", label: "الصور", Icon: GalleryWide },
  { key: "analytics", label: "تحليلات الإعلان", Icon: ChartSquare },
] as const;
type TabKey = (typeof TABS)[number]["key"];

/** الحقول التي يحرّرها النموذج — مفاتيحها أسماء حقول الخادم حرفياً. */
type FormState = Record<string, string | boolean>;

function toForm(p: PropertyDetail): FormState {
  const f: FormState = {
    title: p.title ?? "",
    description: p.description ?? "",
    property_type: p.property_type ? String(p.property_type.id) : "",
    offer_type: p.offer_type ?? "",
    price: p.price ?? "",
    currency: p.currency ?? "",
    area: p.area ?? "",
    city: String(p.city ?? ""),
    neighborhood: p.neighborhood ?? "",
    address: p.address ?? "",
    furnishing: p.furnishing ?? "",
    status: p.status ?? "",
    rooms: p.rooms == null ? "" : String(p.rooms),
    bathrooms: p.bathrooms == null ? "" : String(p.bathrooms),
    floor: p.floor == null ? "" : String(p.floor),
    total_floors: p.total_floors == null ? "" : String(p.total_floors),
    latitude: p.latitude ?? "",
    longitude: p.longitude ?? "",
    contact_phone: p.contact_phone ?? "",
    contact_whatsapp: p.contact_whatsapp ?? "",
    video_url: p.video_url ?? "",
    is_active: p.is_active,
    is_promoted: p.is_promoted,
  };
  for (const k of AMENITY_KEYS) f[k] = p.amenities.includes(k);
  return f;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [prop, setProp] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("details");

  const [form, setForm] = useState<FormState>({});
  const [saving, setSaving] = useState(false);

  const [types, setTypes] = useState<PropertyTypeRef[]>([]);
  const [cities, setCities] = useState<CityRef[]>([]);

  const [perf, setPerf] = useState<Perf | null>(null);
  const [perfDays, setPerfDays] = useState("30");
  const [perfLoading, setPerfLoading] = useState(false);

  const [imgTarget, setImgTarget] = useState<PropImage | null>(null);
  const [imgBusy, setImgBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PropertyDetail>(ep.admin.property(id));
      setProp(res.data);
      setForm(toForm(res.data));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get<PropertyTypeRef[]>("/properties/property-types/")
      .then((r) => setTypes(r.data)).catch(() => setTypes([]));
    api.get(ep.admin.cities, { params: { limit: 300 } })
      .then((r) => setCities(Array.isArray(r.data) ? r.data : (r.data?.results ?? [])))
      .catch(() => setCities([]));
  }, []);

  // التحليلات تُجلب عند فتح تبويبها فقط — لا نُثقل فتح الصفحة باستعلامٍ
  // تجميعيّ قد لا يُنظر إليه.
  useEffect(() => {
    if (tab !== "analytics") return;
    setPerfLoading(true);
    api.get<Perf>(ep.admin.propertyPerformance(id), { params: { days: perfDays } })
      .then((r) => setPerf(r.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setPerfLoading(false));
  }, [tab, id, perfDays]);

  // ── actions ────────────────────────────────────────────────────────────────
  const dirty = useMemo(() => {
    if (!prop) return {} as Record<string, string | boolean>;
    const base = toForm(prop);
    const out: Record<string, string | boolean> = {};
    for (const [k, v] of Object.entries(form)) if (base[k] !== v) out[k] = v;
    return out;
  }, [form, prop]);

  const dirtyCount = Object.keys(dirty).length;

  const save = async () => {
    if (!dirtyCount) { toast.info("لا تغييرات لحفظها"); return; }
    setSaving(true);
    try {
      // الأرقام الفارغة تُرسل null لا "" — السلسلة الفارغة تُرفض في حقلٍ رقميّ.
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(dirty)) {
        payload[k] = v === "" &&
          ["area", "rooms", "bathrooms", "floor", "total_floors",
            "latitude", "longitude", "property_type"].includes(k)
          ? null : v;
      }
      const res = await api.patch<PropertyDetail>(ep.admin.property(id), payload);
      setProp(res.data);
      setForm(toForm(res.data));
      toast.success("حُفظ التعديل");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteImage = async () => {
    if (!imgTarget) return;
    setImgBusy(true);
    try {
      await api.delete(ep.admin.propertyImage(id, imgTarget.id));
      setProp((p) => p ? { ...p, images: p.images.filter((x) => x.id !== imgTarget.id) } : p);
      toast.success("حُذفت الصورة");
      setImgTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setImgBusy(false);
    }
  };

  const setMain = async (img: PropImage) => {
    try {
      await api.patch(ep.admin.propertyImage(id, img.id), {});
      setProp((p) => p ? {
        ...p,
        images: p.images.map((x) => ({ ...x, is_main: x.id === img.id })),
      } : p);
      toast.success("عُيّنت صورةً رئيسية");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      // الضغط قبل الرفع إلزاميّ في كل مواضع الرفع — صورة الهاتف الخام
      // تتجاوز ثلاثة ميغابايت، وتُبطئ الصفحة على من يتصفّح ببيانات الجوّال.
      const compressed = await compressImages(Array.from(files));
      const fd = new FormData();
      for (const f of compressed) fd.append("images", f);
      const res = await api.post<PropImage[]>(ep.admin.propertyImages(id), fd);
      setProp((p) => p ? { ...p, images: [...p.images, ...res.data] } : p);
      toast.success(`رُفعت ${res.data.length} صورة`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const deactivate = async () => {
    try {
      await api.delete(ep.admin.property(id));
      toast.success("أُوقف العقار");
      setDeleteOpen(false);
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const set = (k: string) => (v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  // ── render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-4 sm:px-6 py-8 space-y-4">
        <div className="h-10 w-64 bg-muted-100 animate-pulse rounded-xl" />
        <div className="h-64 bg-muted-50 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!prop) {
    return (
      <div className="px-4 sm:px-6 py-20 text-center text-muted">
        <Buildings2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-body mb-4">العقار غير موجود</p>
        <Button variant="outline" onClick={() => router.push("/admin/properties")}>
          العودة إلى القائمة
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-8">

      {/* ترويسة */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <Link href="/admin/properties"
            className="inline-flex items-center gap-1 text-caption text-muted hover:text-primary mb-2">
            <ArrowRight className="h-3.5 w-3.5" /> العقارات
          </Link>
          <h1 className="text-h2 font-extrabold text-ink leading-tight line-clamp-2">{prop.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant={prop.is_active ? "success" : "danger"}>
              {prop.is_active ? "نشط" : "موقوف"}
            </Badge>
            <Badge variant="info">{OFFER_LABELS[prop.offer_type] ?? prop.offer_type}</Badge>
            <Badge variant="default">{STATUS_LABELS[prop.status] ?? prop.status}</Badge>
            {prop.is_promoted && <Badge variant="gold">مميّز</Badge>}
            {prop.is_deleted && <Badge variant="danger">محذوف</Badge>}
            {(prop.ai_risk === "high" || prop.ai_risk === "medium") && (
              <Badge variant={prop.ai_risk === "high" ? "danger" : "warning"}>
                {prop.ai_risk === "high" ? "⚠ خطورة عالية" : "⚠ مشتبه"}
                {prop.ai_flags?.length ? ` · ${prop.ai_flags.join(" · ")}` : ""}
              </Badge>
            )}
            <span className="text-caption text-muted">
              #{prop.id} · {new Date(prop.created_at).toLocaleDateString(NUMERIC_LOCALE)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/properties/${prop.id}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline"><Eye className="h-4 w-4 ml-1" />في الموقع</Button>
          </a>
          {prop.is_active && (
            <Button size="sm" variant="danger" onClick={() => setDeleteOpen(true)}>
              <DangerCircle className="h-4 w-4 ml-1" />إيقاف
            </Button>
          )}
        </div>
      </div>

      {/* بطاقات سريعة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="السعر" value={formatPrice(prop.price, prop.currency)} icon={asIcon(Buildings2)} />
        <StatCard label="المشاهدات" value={prop.views_count.toLocaleString(NUMERIC_LOCALE)} icon={asIcon(Eye)} />
        <StatCard label="الصور" value={prop.images.length} icon={asIcon(GalleryWide)} />
        <StatCard label="المالك" value={prop.owner?.full_name || prop.user_name || "—"}
          sub={prop.owner?.phone || prop.user_phone || ""} icon={asIcon(User)} />
      </div>

      {/* التبويبات */}
      <div className="flex gap-1 border-b border-muted-100 mb-6 overflow-x-auto">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-body font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === key ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink"
            }`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* ── التفاصيل والتعديل ── */}
      {tab === "details" && (
        <div className="space-y-6">
          <Section title="الأساسيات">
            <Input label="العنوان" value={String(form.title ?? "")}
              onChange={(e) => set("title")(e.target.value)} />
            <div className="sm:col-span-2">
              <label className="block text-body font-medium text-ink mb-1.5">الوصف</label>
              <textarea rows={6} value={String(form.description ?? "")}
                onChange={(e) => set("description")(e.target.value)}
                className="w-full border border-muted-200 rounded-xl p-3 text-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <Select label="نوع العقار" value={String(form.property_type ?? "")}
              onChange={(e) => set("property_type")(e.target.value)}
              options={[{ value: "", label: "—" },
                ...types.map((t) => ({ value: String(t.id), label: t.name_ar }))]} />
            <Select label="نوع العرض" value={String(form.offer_type ?? "")}
              onChange={(e) => set("offer_type")(e.target.value)}
              options={Object.entries(OFFER_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            <Select label="الحالة" value={String(form.status ?? "")}
              onChange={(e) => set("status")(e.target.value)}
              options={Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            <Select label="الفرش" value={String(form.furnishing ?? "")}
              onChange={(e) => set("furnishing")(e.target.value)}
              options={[{ value: "", label: "—" },
                ...Object.entries(FURNISH_LABELS).map(([v, l]) => ({ value: v, label: l }))]} />
          </Section>

          <Section title="السعر والمساحة">
            <Input label="السعر" value={String(form.price ?? "")} inputMode="decimal"
              onChange={(e) => set("price")(e.target.value)} />
            <Input label="العملة" value={String(form.currency ?? "")}
              onChange={(e) => set("currency")(e.target.value)}
              hint="رمز العملة كما في المصدر (SAR · YER · JOD …)" />
            <Input label="المساحة (م²)" value={String(form.area ?? "")} inputMode="decimal"
              onChange={(e) => set("area")(e.target.value)} />
            <Input label="الغرف" value={String(form.rooms ?? "")} inputMode="numeric"
              onChange={(e) => set("rooms")(e.target.value)} />
            <Input label="دورات المياه" value={String(form.bathrooms ?? "")} inputMode="numeric"
              onChange={(e) => set("bathrooms")(e.target.value)} />
            <Input label="الطابق" value={String(form.floor ?? "")} inputMode="numeric"
              onChange={(e) => set("floor")(e.target.value)} />
            <Input label="عدد الطوابق" value={String(form.total_floors ?? "")} inputMode="numeric"
              onChange={(e) => set("total_floors")(e.target.value)} />
          </Section>

          <Section title="الموقع" icon={MapPoint}>
            <Select label="المدينة" value={String(form.city ?? "")}
              onChange={(e) => set("city")(e.target.value)}
              options={cities.map((c) => ({ value: String(c.id), label: c.name_ar }))} />
            <Input label="الحي" value={String(form.neighborhood ?? "")}
              onChange={(e) => set("neighborhood")(e.target.value)} />
            <Input label="العنوان التفصيلي" value={String(form.address ?? "")}
              onChange={(e) => set("address")(e.target.value)} />
            <Input label="خط العرض" value={String(form.latitude ?? "")} dir="ltr"
              onChange={(e) => set("latitude")(e.target.value)} />
            <Input label="خط الطول" value={String(form.longitude ?? "")} dir="ltr"
              onChange={(e) => set("longitude")(e.target.value)} />
          </Section>

          <Section title="التواصل والوسائط" icon={asIcon(Phone)}>
            <Input label="رقم التواصل" value={String(form.contact_phone ?? "")} dir="ltr"
              onChange={(e) => set("contact_phone")(e.target.value)} />
            <Input label="واتساب" value={String(form.contact_whatsapp ?? "")} dir="ltr"
              onChange={(e) => set("contact_whatsapp")(e.target.value)} />
            <Input label="رابط الفيديو (يوتيوب)" value={String(form.video_url ?? "")} dir="ltr"
              onChange={(e) => set("video_url")(e.target.value)} />
          </Section>

          <Section title="المزايا">
            <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap gap-2">
              {AMENITY_KEYS.map((k) => (
                <button key={k} type="button" onClick={() => set(k)(!form[k])}
                  className={`px-3 py-1.5 rounded-xl text-caption font-medium border transition-colors ${
                    form[k] ? "bg-primary text-white border-primary"
                      : "bg-white text-muted-600 border-muted-200 hover:border-primary/40"
                  }`}>
                  {AMENITY_LABELS[k]}
                </button>
              ))}
            </div>
          </Section>

          <Section title="الظهور">
            <Toggle label="نشط" checked={Boolean(form.is_active)} onChange={set("is_active")}
              hint="إيقافه يُخفيه من كل القوائم العامة" />
            <Toggle label="مميّز" checked={Boolean(form.is_promoted)} onChange={set("is_promoted")}
              hint="يرفعه في ترتيب القوائم" />
          </Section>

          {/* شريط الحفظ — يظهر حين يوجد ما يُحفظ فقط */}
          <div className="sticky bottom-4 flex items-center justify-end gap-3">
            {dirtyCount > 0 && (
              <div className="flex items-center gap-3 bg-white rounded-2xl card-shadow px-4 py-3">
                <span className="text-caption text-muted">
                  {dirtyCount} {dirtyCount === 1 ? "حقل معدَّل" : "حقول معدَّلة"}
                </span>
                <Button size="sm" variant="outline" onClick={() => setForm(toForm(prop))}>
                  تراجع
                </Button>
                <Button size="sm" loading={saving} onClick={save}>حفظ التعديل</Button>
              </div>
            )}
          </div>

          {prop.comments.length > 0 && (
            <Card>
              <h3 className="text-body font-bold text-ink mb-3">
                التعليقات ({prop.comments.length})
              </h3>
              <div className="space-y-3">
                {prop.comments.map((c) => (
                  <div key={c.id} className="border-b border-muted-50 pb-2 last:border-0">
                    <div className="flex items-center gap-2 text-caption text-muted">
                      <span className="font-medium text-ink">{c.user_name || "—"}</span>
                      <span>{new Date(c.created_at).toLocaleDateString(NUMERIC_LOCALE)}</span>
                    </div>
                    <p className="text-body text-muted-600 mt-0.5">{c.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── الصور ── */}
      {tab === "images" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-body text-muted">
              {prop.images.length} صورة · الرئيسية هي ما يظهر في القوائم
            </p>
            <>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden
                onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
              <Button size="sm" variant="outline" loading={uploading}
                onClick={() => fileRef.current?.click()}>
                <AddCircle className="h-4 w-4 ml-1" />إضافة صور
              </Button>
            </>
          </div>

          {prop.images.length === 0 ? (
            <Card className="py-16 text-center text-muted">
              <GalleryWide className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-body">لا صور — تظهر البطاقة بالشعار البديل</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {prop.images.map((img) => (
                <div key={img.id}
                  className="relative group rounded-2xl overflow-hidden bg-muted-100 aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image} alt="" className="w-full h-full object-cover" />
                  {img.is_main && (
                    <span className="absolute top-2 right-2 bg-gold text-ink text-micro font-bold px-2 py-0.5 rounded-full">
                      رئيسية
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex gap-1 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    {!img.is_main && (
                      <button onClick={() => setMain(img)} title="تعيين رئيسية"
                        className="flex-1 flex items-center justify-center gap-1 bg-white/90 hover:bg-white rounded-lg py-1.5 text-caption font-medium text-ink">
                        <Star className="h-3.5 w-3.5" />رئيسية
                      </button>
                    )}
                    <button onClick={() => setImgTarget(img)} title="حذف الصورة"
                      className="flex-1 flex items-center justify-center gap-1 bg-danger-500/90 hover:bg-danger-500 rounded-lg py-1.5 text-caption font-medium text-white">
                      <TrashBinTrash className="h-3.5 w-3.5" />حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── التحليلات ── */}
      {tab === "analytics" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-body text-muted">
              أداء الإعلان خلال {perf?.window_days ?? perfDays} يوماً
            </p>
            <select value={perfDays} onChange={(e) => setPerfDays(e.target.value)}
              className="h-10 border border-muted-200 rounded-xl px-3 text-body focus:outline-none">
              <option value="7">آخر 7 أيام</option>
              <option value="30">آخر 30 يوماً</option>
              <option value="90">آخر 90 يوماً</option>
              <option value="365">آخر سنة</option>
            </select>
          </div>

          {perfLoading ? (
            <div className="h-64 bg-muted-50 animate-pulse rounded-2xl" />
          ) : !perf ? (
            <Card className="py-16 text-center text-muted">
              <ChartSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-body">تعذّر جلب التحليلات</p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard label="مشاهدات (الكل)" value={perf.views_total.toLocaleString(NUMERIC_LOCALE)} icon={asIcon(Eye)} />
                <StatCard label="مشاهدات المدّة" value={perf.views.toLocaleString(NUMERIC_LOCALE)} icon={asIcon(Eye)}
                  sub={perf.bot_views ? `+${perf.bot_views.toLocaleString(NUMERIC_LOCALE)} زحف محرّكات بحث (غير محسوبة)` : undefined} />
                <StatCard label="نقرات تواصل" value={perf.contacts.toLocaleString(NUMERIC_LOCALE)} icon={asIcon(Phone)} />
                <StatCard label="إضافة للمفضّلة" value={perf.favorites.toLocaleString(NUMERIC_LOCALE)} icon={asIcon(Heart)} />
                <StatCard label="مشاركات" value={perf.shares.toLocaleString(NUMERIC_LOCALE)} icon={asIcon(Share)} />
              </div>

              <ChartCard title="المشاهدات يوماً بيوم" icon={ChartSquare} height={260}
                empty={!perf.daily.length} emptyTitle="لا مشاهدات في هذه المدّة">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={perf.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} reversed />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" name="مشاهدات"
                      stroke="#4F2396" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <Breakdown title="مصدر الزيارة" rows={perf.sources} keyName="source" />
                <Breakdown title="المنصّة" rows={perf.platforms} keyName="platform" />
                <Breakdown title="الجهاز" rows={perf.devices} keyName="device_type" />
                <Breakdown title="مدينة الزائر" rows={perf.cities} keyName="city" />
              </div>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(imgTarget)}
        title="حذف الصورة"
        message="تُحذف نهائياً من العقار ومن التخزين. لا يمكن التراجع."
        confirmLabel="حذف"
        variant="danger"
        loading={imgBusy}
        onConfirm={deleteImage}
        onCancel={() => setImgTarget(null)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="إيقاف العقار"
        message="يُخفى من كل القوائم العامة، ويبقى في اللوحة ويمكن تفعيله ثانيةً."
        confirmLabel="إيقاف"
        variant="danger"
        onConfirm={deactivate}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

// ─── Small pieces ─────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <h3 className="flex items-center gap-1.5 text-body font-bold text-ink mb-4">
        {Icon && <Icon className="h-4 w-4 text-primary" />}{title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </Card>
  );
}

function Toggle({ label, checked, onChange, hint }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="flex items-start gap-3 text-right p-3 rounded-xl border border-muted-200 hover:border-primary/40 transition-colors">
      <span className={`mt-0.5 h-5 w-5 rounded-md flex items-center justify-center shrink-0 ${
        checked ? "bg-primary text-white" : "bg-muted-100 text-transparent"
      }`}>
        <CheckCircle className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-body font-medium text-ink">{label}</span>
        {hint && <span className="block text-caption text-muted">{hint}</span>}
      </span>
    </button>
  );
}

function Breakdown({ title, rows, keyName }: {
  title: string;
  rows: Record<string, unknown>[];
  keyName: string;
}) {
  const total = rows.reduce((s, r) => s + Number(r.n ?? 0), 0);
  return (
    <Card>
      <h3 className="text-body font-bold text-ink mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-caption text-muted">لا بيانات</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => {
            const label = String(r[keyName] ?? "—") || "مباشر";
            const n = Number(r.n ?? 0);
            return (
              <div key={i}>
                <div className="flex items-center justify-between text-caption">
                  <span className="text-muted-600 truncate">{label}</span>
                  <span className="text-ink font-medium">{n.toLocaleString(NUMERIC_LOCALE)}</span>
                </div>
                <div className="h-1.5 bg-muted-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-primary rounded-full"
                    style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
