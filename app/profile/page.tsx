"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { User, Listing, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import {
  UserRounded, Buildings2, Heart, Bell, MapPoint,
  PenNewSquare, CheckCircle, Logout, ShieldCheck, CloudUpload, CloseCircle, ClockCircle,
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

export default function ProfilePage() {
  const { user, logout, refreshUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"info" | "listings">("info");
  const [form, setForm] = useState({ full_name: "", bio: "" });
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [listingsTotal, setListingsTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);

  // ── طلب توثيق الحساب ──
  const [verif, setVerif] = useState<VerificationRequest | null>(null);
  const [verifNote, setVerifNote] = useState("");
  const [verifDoc, setVerifDoc] = useState<File | null>(null);
  const [verifSubmitting, setVerifSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) setForm({ full_name: user.full_name, bio: user.bio ?? "" });
  }, [user]);

  useEffect(() => {
    if (tab === "listings" && user) fetchMyListings();
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
      if (verifDoc) fd.append("document", verifDoc);
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

  const fetchMyListings = async () => {
    setLoadingListings(true);
    try {
      const res = await api.get<PaginatedResponse<Listing>>("/listings/my/", { params: { limit: 20, offset: 0 } });
      setMyListings(res.data.results);
      setListingsTotal(res.data.count);
    } catch { /* silent */ }
    finally { setLoadingListings(false); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.patch("/auth/me/", form);
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
            <p className="text-xl font-bold text-gray-900">{user.listings_count}</p>
            <p className="text-xs text-gray-500">إعلان</p>
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
          {(["info", "listings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t === "info" ? "البيانات" : "إعلاناتي"}
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

          {tab === "listings" && (
            <div>
              {loadingListings ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />)}
                </div>
              ) : myListings.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Buildings2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">لا توجد إعلانات بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myListings.map((l) => (
                    <Link key={l.id} href={`/listings/${l.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                        {l.main_image
                          ? <img src={l.main_image} className="w-full h-full object-cover" alt="" />
                          : <div className="w-full h-full flex items-center justify-center"><Buildings2 className="h-6 w-6 text-gray-300" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{l.title}</p>
                        <p className="text-xs text-gray-500">{l.city_name}</p>
                        <p className="text-sm font-bold text-primary mt-0.5">{formatPrice(l.price, l.currency)}</p>
                      </div>
                      <Badge variant={l.is_active ? "green" : "gray"}>{l.is_active ? "نشط" : "موقوف"}</Badge>
                    </Link>
                  ))}
                  {listingsTotal > 20 && (
                    <p className="text-center text-xs text-gray-400 pt-2">يُعرض 20 من {listingsTotal} إعلان</p>
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
