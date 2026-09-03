"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import type { PaginatedResponse } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "sonner";
import { Magnifer, Bell, TrashBinTrash, AltArrowLeft } from "@solar-icons/react";

interface SavedSearch {
  id: number;
  name: string;
  filters: Record<string, string | number>;
  notify: boolean;
  created_at: string;
}

const OFFER_LABELS: Record<string, string> = {
  sale: "للبيع",
  rent_monthly: "إيجار شهري",
  rent_yearly: "إيجار سنوي",
};

function summarize(f: Record<string, string | number>): string {
  const parts: string[] = [];
  if (f.offer_type && OFFER_LABELS[f.offer_type]) parts.push(OFFER_LABELS[f.offer_type as string]);
  if (f.search) parts.push(`«${f.search}»`);
  if (f.price_min) parts.push(`من ${f.price_min}`);
  if (f.price_max) parts.push(`إلى ${f.price_max}`);
  if (f.rooms_min) parts.push(`${f.rooms_min}+ غرف`);
  return parts.length ? parts.join(" · ") : "كل العقارات";
}

export default function SavedSearchesPage() {
  const { user, loading: authLoading } = useAuth();
  const { requireAuth } = useAuthGate();
  const router = useRouter();
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) requireAuth(undefined, () => router.push("/"));
  }, [user, authLoading, router, requireAuth]);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<SavedSearch> | SavedSearch[]>(ep.savedSearches);
      const data = res.data;
      setItems(Array.isArray(data) ? data : data.results ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchItems();
  }, [user, fetchItems]);

  const remove = async (id: number) => {
    const prev = items;
    setItems((s) => s.filter((x) => x.id !== id));
    try {
      await api.delete(ep.savedSearch(id));
      toast.success("تم حذف البحث");
    } catch (err) {
      setItems(prev);
      toast.error(getErrorMessage(err));
    }
  };

  const apply = (f: Record<string, string | number>) => {
    const qs = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (v !== null && v !== undefined && `${v}` !== "") qs.set(k, `${v}`);
    });
    router.push(`/properties?${qs.toString()}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <PageHeader icon={<Magnifer />} title="عمليات البحث المحفوظة"
          subtitle="نبّهك عند وصول عقارات جديدة تطابق بحثك" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Magnifer className="h-14 w-14 text-muted-200 mx-auto mb-4" />
          <p className="text-muted-500 mb-1">لا عمليات بحث محفوظة</p>
          <p className="text-body text-muted">
            احفظ فلاتر البحث من صفحة العقارات لتصلك تنبيهات بالعقارات الجديدة المطابقة.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li
              key={it.id}
              className="bg-white rounded-2xl card-shadow p-4 flex items-center gap-3"
            >
              <button
                onClick={() => apply(it.filters)}
                className="flex-1 flex items-center gap-3 text-right min-w-0"
              >
                <span className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Magnifer className="h-5 w-5 text-primary" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-ink truncate">
                    {it.name || "بحث محفوظ"}
                  </span>
                  <span className="block text-body text-muted-500 truncate">{summarize(it.filters)}</span>
                  {it.notify && (
                    <span className="inline-flex items-center gap-1 text-caption text-primary mt-1">
                      <Bell className="h-3 w-3" /> التنبيهات مُفعّلة
                    </span>
                  )}
                </span>
                <AltArrowLeft className="h-4 w-4 text-muted-200 shrink-0" />
              </button>
              <button
                onClick={() => remove(it.id)}
                className="p-2 text-danger-500 hover:bg-danger-50 rounded-lg transition-colors shrink-0"
                aria-label="حذف"
              >
                <TrashBinTrash className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
