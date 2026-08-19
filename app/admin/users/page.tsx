"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toEnglishDigits } from "@/lib/digits";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useAuth } from "@/context/AuthContext";
import type { User, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import {
  UsersGroupRounded, Magnifer, CloseCircle, CheckCircle,
  DangerCircle, TrashBinTrash, UserCheck, Shield, Eye,
} from "@solar-icons/react";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = { user: "مستخدم", admin: "مشرف" };
const ROLE_COLORS: Record<string, "green" | "blue" | "red" | "gray"> = {
  user: "blue", admin: "red",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { user: me, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers]       = useState<User[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [offset, setOffset]     = useState(0);
  const LIMIT = 20;

  const [search, setSearch]     = useState("");
  const [roleFilter, setRole]   = useState("");
  const [activeFilter, setActive] = useState("");

  const [selected, setSelected] = useState<User | null>(null);
  const [saving, setSaving]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didInitialFetch = useRef(false);

  // ── auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && (!me || me.role !== "admin")) router.push("/");
  }, [me, authLoading, router]);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { offset: off, limit: LIMIT };
      if (search)      params.search    = search;
      if (roleFilter)  params.role      = roleFilter;
      if (activeFilter) params.is_active = activeFilter;
      const res = await api.get<PaginatedResponse<User>>(ep.admin.users, { params });
      setUsers(res.data.results);
      setTotal(res.data.count);
      setOffset(off);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [search, roleFilter, activeFilter]);

  // ── single fetch driver: immediate on first auth-ready render, debounced after ──
  useEffect(() => {
    if (authLoading || me?.role !== "admin") return;
    if (!didInitialFetch.current) {
      didInitialFetch.current = true;
      fetchUsers(0);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchUsers(0), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [authLoading, me, search, roleFilter, activeFilter, fetchUsers]);

  // ── actions ────────────────────────────────────────────────────────────────
  const openDetail = (u: User) => { setSelected(u); };

  const toggleServiceProvider = async (u: User) => {
    try {
      const res = await api.patch<User>(ep.admin.user(u.id), { is_service_provider: !u.is_service_provider });
      toast.success(res.data.is_service_provider ? "تم الترقية لمزود خدمة" : "تم إلغاء ترقية مزود الخدمة");
      setUsers((prev) => prev.map((x) => x.id === res.data.id ? res.data : x));
      if (selected?.id === res.data.id) setSelected(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const toggleVerified = async (u: User) => {
    try {
      const res = await api.patch<User>(ep.admin.user(u.id), { is_verified: !u.is_verified });
      toast.success(res.data.is_verified ? "تم التوثيق" : "تم إلغاء التوثيق");
      setUsers((prev) => prev.map((x) => x.id === res.data.id ? res.data : x));
      if (selected?.id === res.data.id) setSelected(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const changeRole = async (u: User, role: "user" | "admin") => {
    if (u.role === role) return;
    setSaving(true);
    try {
      const res = await api.patch<User>(ep.admin.user(u.id), { role });
      toast.success(res.data.role === "admin" ? "تمت الترقية لمشرف" : "تم التحويل لمستخدم عادي");
      setUsers((prev) => prev.map((x) => x.id === res.data.id ? res.data : x));
      if (selected?.id === res.data.id) setSelected(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const toggleActive = async (u: User) => {
    try {
      const res = await api.patch<User>(ep.admin.user(u.id), { is_active: !u.is_active });
      toast.success(res.data.is_active ? "تم تفعيل الحساب" : "تم تعليق الحساب");
      setUsers((prev) => prev.map((x) => x.id === res.data.id ? res.data : x));
      if (selected?.id === res.data.id) setSelected(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Soft delete: backend returns 200 with the deactivated user body.
      const res = await api.delete<User>(ep.admin.user(deleteTarget.id));
      const updated = res.data ?? { ...deleteTarget, is_active: false };
      toast.success("تم تعطيل المستخدم");
      setUsers((prev) => prev.map((u) => u.id === deleteTarget.id ? updated : u));
      if (selected?.id === deleteTarget.id) setSelected(updated);
      setDeleteTarget(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeleting(false); }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <PageHeader icon={<UsersGroupRounded />} title="إدارة المستخدمين"
          subtitle={`${total.toLocaleString("ar-YE")} مستخدم`} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl card-shadow p-4 mb-6 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Magnifer className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(toEnglishDigits(e.target.value))}
            placeholder="ابحث بالاسم أو الهاتف..."
            className="w-full h-10 border border-gray-200 rounded-xl pr-9 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2">
              <CloseCircle className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRole(e.target.value)}
          className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none"
        >
          <option value="">كل الأدوار</option>
          {Object.entries(ROLE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        {/* Service provider filter */}
        <select
          value={activeFilter}
          onChange={(e) => setActive(e.target.value)}
          className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none"
        >
          <option value="">كل الحالات</option>
          <option value="true">نشط</option>
          <option value="false">موقوف</option>
        </select>
      </div>

      {/* Split panel */}
      <div className="flex gap-6">

        {/* Table */}
        <div className="flex-1 bg-white rounded-2xl card-shadow overflow-hidden">
          {loading ? (
            <div className="space-y-px">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-50 animate-pulse mx-4 my-2 rounded-xl" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <UsersGroupRounded className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">لا يوجد مستخدمون</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">المستخدم</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">الهاتف</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">الدور</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">الحالة</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => openDetail(u)}
                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === u.id ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.avatar ? (
                          <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {(u.full_name ?? "؟").charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">{u.full_name}</p>
                          {u.is_verified && <span className="text-xs text-green-600">موثّق ✓</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell" dir="ltr">{u.phone}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ROLE_COLORS[u.role] ?? "gray"}>{ROLE_LABELS[u.role] ?? u.role}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {u.is_active
                        ? <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" />نشط</span>
                        : <span className="text-xs text-red-500 font-medium flex items-center gap-1"><DangerCircle className="h-3.5 w-3.5" />موقوف</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDetail(u); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {total > LIMIT && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {offset + 1}–{Math.min(offset + LIMIT, total)} من {total}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm" variant="outline"
                  disabled={offset === 0}
                  onClick={() => fetchUsers(offset - LIMIT)}
                >السابق</Button>
                <Button
                  size="sm" variant="outline"
                  disabled={offset + LIMIT >= total}
                  onClick={() => fetchUsers(offset + LIMIT)}
                >التالي</Button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-80 shrink-0 bg-white rounded-2xl card-shadow p-5 self-start sticky top-6">
            {/* Avatar & name */}
            <div className="flex flex-col items-center text-center mb-5">
              {selected.avatar ? (
                <img src={selected.avatar} className="w-16 h-16 rounded-full object-cover mb-3" alt="" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl mb-3">
                  {(selected.full_name ?? "؟").charAt(0)}
                </div>
              )}
              <h2 className="font-bold text-gray-900">{selected.full_name}</h2>
              <p className="text-sm text-gray-500" dir="ltr">{selected.phone}</p>
              {selected.city_name && <p className="text-xs text-gray-400 mt-0.5">{selected.city_name}</p>}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                <p className="text-lg font-bold text-gray-900">{selected.properties_count}</p>
                <p className="text-xs text-gray-500">عقار</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                <p className="text-lg font-bold text-gray-900">{selected.average_rating ?? "—"}</p>
                <p className="text-xs text-gray-500">تقييم</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 justify-center mb-4">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${selected.role === "admin" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                {ROLE_LABELS[selected.role] ?? selected.role}
              </span>
              {selected.is_service_provider && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-600">
                  مزود خدمة
                </span>
              )}
              {!selected.is_active && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600">
                  محظور / معطّل
                </span>
              )}
            </div>

            {/* Role control */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-1.5">الدور</p>
              <div className="grid grid-cols-2 gap-1.5 bg-gray-50 rounded-xl p-1">
                {(["user", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => changeRole(selected, r)}
                    disabled={saving || selected.role === r}
                    className={`h-9 rounded-lg text-sm font-semibold transition-colors disabled:opacity-100 ${
                      selected.role === r
                        ? r === "admin"
                          ? "bg-red-100 text-red-600"
                          : "bg-primary/10 text-primary"
                        : "text-gray-500 hover:bg-white disabled:cursor-not-allowed"
                    }`}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={() => toggleServiceProvider(selected)}
                variant="outline" fullWidth size="sm"
                disabled={selected.role === "admin"}
              >
                <UserCheck className="h-4 w-4" />
                {selected.is_service_provider ? "إلغاء ترقية مزود الخدمة" : "ترقية لمزود خدمة"}
              </Button>
              <Button
                onClick={() => toggleVerified(selected)}
                variant="outline" fullWidth size="sm"
                disabled={selected.role === "admin"}
              >
                <Shield className="h-4 w-4" />
                {selected.is_verified ? "إلغاء التوثيق" : "توثيق الحساب"}
              </Button>
              <Button
                onClick={() => toggleActive(selected)}
                variant={selected.is_active ? "outline" : "secondary"}
                fullWidth size="sm"
                disabled={selected.role === "admin"}
              >
                {selected.is_active
                  ? <><DangerCircle className="h-4 w-4" /> تعليق الحساب</>
                  : <><CheckCircle className="h-4 w-4" /> تفعيل الحساب</>}
              </Button>
              {selected.role !== "admin" && (
                <Button
                  onClick={() => setDeleteTarget(selected)}
                  variant="danger" fullWidth size="sm"
                >
                  <TrashBinTrash className="h-4 w-4" /> حذف المستخدم
                </Button>
              )}
            </div>

            {/* Joined */}
            <p className="text-xs text-gray-400 text-center mt-4">
              انضم في {new Date(selected.created_at).toLocaleDateString("ar-YE")}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="تأكيد التعطيل"
        message={
          deleteTarget
            ? <>هل أنت متأكد من تعطيل حساب <strong>{deleteTarget.full_name}</strong>؟ سيتم إيقاف الحساب.</>
            : ""
        }
        confirmLabel="تعطيل"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
