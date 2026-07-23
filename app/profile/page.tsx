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
  PenNewSquare, CheckCircle, Logout,
} from "@solar-icons/react";

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
  const [tab, setTab] = useState<"info" | "listings" | "password">("info");
  const [form, setForm] = useState({ full_name: "", bio: "" });
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "", new_password_confirm: "" });
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [listingsTotal, setListingsTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) setForm({ full_name: user.full_name, bio: user.bio ?? "" });
  }, [user]);

  useEffect(() => {
    if (tab === "listings" && user) fetchMyListings();
  }, [tab, user]);

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

  const changePassword = async () => {
    if (pwForm.new_password !== pwForm.new_password_confirm) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    setSaving(true);
    try {
      await api.post("/auth/change-password/", pwForm);
      toast.success("تم تغيير كلمة المرور");
      setPwForm({ old_password: "", new_password: "", new_password_confirm: "" });
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

      {/* Tabs */}
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(["info", "listings", "password"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t === "info" ? "البيانات" : t === "listings" ? "إعلاناتي" : "كلمة المرور"}
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
                        <p className="text-sm font-bold text-primary mt-0.5">{formatPrice(l.price)}</p>
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

          {tab === "password" && (
            <div className="space-y-4">
              <Input
                label="كلمة المرور الحالية"
                type="password"
                value={pwForm.old_password}
                onChange={(e) => setPwForm((p) => ({ ...p, old_password: e.target.value }))}
              />
              <Input
                label="كلمة المرور الجديدة"
                type="password"
                value={pwForm.new_password}
                onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))}
              />
              <Input
                label="تأكيد كلمة المرور الجديدة"
                type="password"
                value={pwForm.new_password_confirm}
                onChange={(e) => setPwForm((p) => ({ ...p, new_password_confirm: e.target.value }))}
              />
              <Button onClick={changePassword} loading={saving} fullWidth>تغيير كلمة المرور</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
