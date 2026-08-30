"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/nav/MarketLink";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import type { Property, PaginatedResponse, City } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneField } from "@/components/ui/PhoneField";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, NUMERIC_LOCALE } from "@/lib/utils";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageCompression";
import {
  Buildings2, Heart, Bell, MapPoint,
  PenNewSquare, CheckCircle, Logout, ShieldCheck, CloudUpload, CloseCircle, ClockCircle, Magnifer,
} from "@solar-icons/react";

interface VerificationRequest {
  id: number;
  status: "pending" | "approved" | "rejected";
  note: string;
  document: string | null;
  review_note: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "مالك عقار", broker: "وسيط / دلال", client: "عميل",
  service_provider: "مزود خدمة", admin: "مشرف",
};
const ROLE_COLORS: Record<string, "green" | "yellow" | "blue" | "gold" | "red" | "gray"> = {
  owner: "green", broker: "yellow", client: "blue",
  service_provider: "gold", admin: "red",
};

/** صفّ أداء إعلان — من `/properties/my/performance/`. */
interface PerfRow {
  id: number; views: number; contacts: number;
  favorites: number; shares: number; views_total: number;
}
interface PerfTotals {
  views: number; contacts: number; favorites: number;
  shares: number; views_total: number;
}

export default function ProfilePage() {
  const { user, logout, refreshUser, loading: authLoading } = useAuth();
  const { requireAuth } = useAuthGate();
  const router = useRouter();
  const [tab, setTab] = useState<"info" | "properties">("info");
  const [form, setForm] = useState({ full_name: "", bio: "", phone: "", city: "" });
  const [cities, setCities] = useState<City[]>([]);
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  /** أداء الإعلانات — مفهرس بمعرّف العقار. انظر التعليق عند العرض. */
  const [perf, setPerf] = useState<Record<number, PerfRow>>({});
  const [perfTotals, setPerfTotals] = useState<PerfTotals | null>(null);
  const [propertiesTotal, setPropertiesTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // ── طلب توثيق الحساب ──
  const [verif, setVerif] = useState<VerificationRequest | null>(null);
  const [verifNote, setVerifNote] = useState("");
  const [verifDoc, setVerifDoc] = useState<File | null>(null);
  const [verifSubmitting, setVerifSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) requireAuth(undefined, () => router.push("/"));
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) setForm({
      full_name: user.full_name,
      bio: user.bio ?? "",
      phone: user.phone ?? "",
      city: user.city != null ? String(user.city) : "",
    });
  }, [user]);

  // قائمة المدن لإكمال/تعديل المدينة
  useEffect(() => {
    api.get<{ results?: City[] }>("/cities/", { params: { offset: 0, limit: 100 } })
      .then((r) => setCities(r.data.results ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "properties" && user) fetchMyProperties();
  }, [tab, user]);

  // اجلب حالة طلب التوثيق الحالي (404 = لا يوجد طلب)
  useEffect(() => {
    if (!user || user.is_verified) return;
    api.get<VerificationRequest>("/verification/my/")
      .then((r) => setVerif(r.data))
      .catch(() => setVerif(null));
  }, [user]);

  const submitVerification = async () => {
    setVerifSubmitting(true);
    try {
      const fd = new FormData();
      if (verifNote) fd.append("note", verifNote);
      if (verifDoc) fd.append("document", await compressImage(verifDoc));
      const { data } = await api.post<VerificationRequest>("/verification/request/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setVerif(data);
      setVerifNote("");
      setVerifDoc(null);
      toast.success("تم إرسال طلب التوثيق");
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setVerifSubmitting(false); }
  };

  const fetchMyProperties = async () => {
    setLoadingProperties(true);
    try {
      const res = await api.get<PaginatedResponse<Property>>("/properties/my/", { params: { limit: 20, offset: 0 } });
      setMyProperties(res.data.results);
      setPropertiesTotal(res.data.count);
      // أداء الإعلانات — جلبٌ مستقلّ فلا يُعطّل فشلُه عرضَ العقارات نفسها.
      api
        .get<{ totals: PerfTotals; results: PerfRow[] }>("/properties/my/performance/")
        .then((r) => {
          setPerfTotals(r.data.totals);
          setPerf(Object.fromEntries(r.data.results.map((x) => [x.id, x])));
        })
        .catch(() => {});
    } catch { /* silent */ }
    finally { setLoadingProperties(false); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        full_name: form.full_name,
        bio: form.bio,
      };
      // الهاتف/المدينة اختياريان — نرسلهما فقط عند وجود قيمة (إكمال بلا إجبار).
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.city) payload.city = Number(form.city);
      await api.patch("/auth/me/", payload);
      await refreshUser();
      toast.success("تم تحديث الملف الشخصي");
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); router.push("/"); };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header card */}
      <div className="bg-white rounded-2xl card-shadow p-6 mb-6">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img src={user.avatar} className="w-16 h-16 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
              {user.full_name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900">{user.full_name}</h1>
              {user.is_verified && (
                <span className="flex items-center gap-0.5 text-xs text-green-600 font-medium">
                  <CheckCircle className="h-3.5 w-3.5" /> موثّق
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500" dir="ltr">{user.phone}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant={ROLE_COLORS[user.role] ?? "gray"}>{ROLE_LABELS[user.role] ?? user.role}</Badge>
              {user.city_name && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPoint className="h-3 w-3" />{user.city_name}
                </span>
              )}
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <Logout className="h-4 w-4" /> خروج
          </Button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{user.properties_count}</p>
            <p className="text-xs text-gray-500">عقار</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{user.average_rating ?? "—"}</p>
            <p className="text-xs text-gray-500">تقييم</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{user.followers_count}</p>
            <p className="text-xs text-gray-500">متابع</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link href="/favorites" className="bg-white rounded-2xl card-shadow p-4 flex flex-col items-center gap-2 hover:bg-primary/5 transition-colors">
          <Heart className="h-6 w-6 text-red-500" />
          <span className="text-xs font-medium text-gray-700">المفضّلة</span>
        </Link>
        <Link href="/notifications" className="bg-white rounded-2xl card-shadow p-4 flex flex-col items-center gap-2 hover:bg-primary/5 transition-colors">
          <Bell className="h-6 w-6 text-primary" />
          <span className="text-xs font-medium text-gray-700">الإشعارات</span>
        </Link>
        <Link href="/requests" className="bg-white rounded-2xl card-shadow p-4 flex flex-col items-center gap-2 hover:bg-primary/5 transition-colors">
          <PenNewSquare className="h-6 w-6 text-blue-500" />
          <span className="text-xs font-medium text-gray-700">الطلبات</span>
        </Link>
        <Link href="/saved-searches" className="bg-white rounded-2xl card-shadow p-4 flex flex-col items-center gap-2 hover:bg-primary/5 transition-colors">
          <Magnifer className="h-6 w-6 text-primary" />
          <span className="text-xs font-medium text-gray-700">عمليات البحث</span>
        </Link>
      </div>

      {/* توثيق الحساب — يظهر فقط لغير الموثّقين */}
      {!user.is_verified && (
        <div className="bg-white rounded-2xl card-shadow p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-gray-800">توثيق الحساب</h2>
          </div>

          {verif?.status === "pending" ? (
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-100 rounded-xl p-3">
              <ClockCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-700">طلبك قيد المراجعة</p>
                <p className="text-xs text-yellow-600 mt-0.5">سيتم إشعارك عند اتخاذ قرار من الإدارة.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {verif?.status === "rejected" && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-sm font-semibold text-red-700">تم رفض طلبك السابق</p>
                  {verif.review_note && <p className="text-xs text-red-600 mt-0.5">السبب: {verif.review_note}</p>}
                  <p className="text-xs text-gray-500 mt-1">يمكنك تقديم طلب جديد.</p>
                </div>
              )}
              <p className="text-sm text-gray-500">وثّق حسابك لزيادة ثقة المستخدمين بك. أرفق مستنداً يثبت هويتك (اختياري).</p>
              <textarea
                value={verifNote}
                onChange={(e) => setVerifNote(e.target.value)}
                rows={2}
                placeholder="ملاحظة للإدارة (اختياري)"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <label className="flex items-center justify-center gap-2 h-20 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                <CloudUpload className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-400">{verifDoc ? verifDoc.name : "أرفق مستنداً (اختياري)"}</span>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => setVerifDoc(e.target.files?.[0] ?? null)} className="hidden" />
              </label>
              {verifDoc && (
                <button onClick={() => setVerifDoc(null)} className="flex items-center gap-1 text-xs text-red-500">
                  <CloseCircle className="h-3.5 w-3.5" /> إزالة المستند
                </button>
              )}
              <Button onClick={submitVerification} loading={verifSubmitting} fullWidth>
                <ShieldCheck className="h-4 w-4" /> طلب توثيق الحساب
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(["info", "properties"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t === "info" ? "البيانات" : "عقاراتي"}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "info" && (
            <div className="space-y-4">
              <Input
                label="الاسم الكامل"
                value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              />
              {user.profile_incomplete && (
                <p className="text-xs text-primary bg-primary/5 rounded-lg px-3 py-2">
                  أكمل رقم هاتفك ومدينتك ليتمكّن أصحاب العقارات من التواصل معك (اختياري).
                </p>
              )}
              <PhoneField
                label="رقم الهاتف"
                value={form.phone}
                onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد الإلكتروني</label>
                {/* البريد من جوجل — للعرض فقط، غير قابل للتعديل. */}
                <input
                  type="email"
                  value={user.email ?? ""}
                  disabled
                  dir="ltr"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">المدينة</label>
                <select
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                >
                  <option value="">بدون مدينة</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_ar}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">نبذة تعريفية</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="اكتب نبذة عن نفسك..."
                />
              </div>
              <Button onClick={saveProfile} loading={saving} fullWidth>حفظ التغييرات</Button>
            </div>
          )}

          {tab === "properties" && (
            <div>
              {loadingProperties ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />)}
                </div>
              ) : myProperties.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Buildings2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">لا توجد عقارات بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* ⚠️ ملخّص الأداء أوّلاً: المالك ينشر ثم لا يعرف أشاهده أحد.
                      البيانات كانت مرصودة منذ البداية وتُعرض في لوحة الإدارة
                      وحدها — رؤيته لها هي ما يدفعه للتجديد وإضافة عقار ثانٍ. */}
                  {perfTotals && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {([
                        ["مشاهدة", perfTotals.views_total],
                        ["حاولوا التواصل", perfTotals.contacts],
                        ["أضافوه للمفضّلة", perfTotals.favorites],
                      ] as const).map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-cream p-3 text-center">
                          <p className="text-h3 text-ink tabular-nums">
                            {value.toLocaleString(NUMERIC_LOCALE)}
                          </p>
                          <p className="text-caption text-muted mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {myProperties.map((l) => (
                    <Link key={l.id} href={`/properties/${l.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                        {l.main_image
                          ? <img src={l.main_image} className="w-full h-full object-cover" alt="" />
                          : <div className="w-full h-full flex items-center justify-center"><Buildings2 className="h-6 w-6 text-gray-300" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{l.title}</p>
                        <p className="text-xs text-gray-500">{l.city_name}</p>
                        <p className="text-sm font-bold text-primary mt-0.5">{formatPrice(l.price, l.currency)}</p>
                        {perf[l.id] && (
                          <p className="text-caption text-muted mt-1 tabular-nums">
                            {perf[l.id].views_total.toLocaleString(NUMERIC_LOCALE)} مشاهدة
                            {perf[l.id].contacts > 0 && (
                              <span className="text-primary font-bold">
                                {" · "}
                                {perf[l.id].contacts.toLocaleString(NUMERIC_LOCALE)} حاولوا التواصل
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <Badge variant={l.is_active ? "green" : "gray"}>{l.is_active ? "نشط" : "موقوف"}</Badge>
                    </Link>
                  ))}
                  {propertiesTotal > 20 && (
                    <p className="text-center text-xs text-gray-400 pt-2">يُعرض 20 من {propertiesTotal} عقار</p>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
