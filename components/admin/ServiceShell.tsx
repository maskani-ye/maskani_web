"use client";

// ─── غلاف صفحة خدمة ─────────────────────────────────────────────────────────
// يوحّد ما تشترك فيه صفحات «البنية والخدمات»: حارس المشرف، الجلب، التحديث،
// الترويسة، وحالتا التحميل والعطل. الصفحة نفسها تكتفي برسم محتواها المخصّص.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Refresh, AltArrowRight } from "@solar-icons/react";
import { toast } from "sonner";
import type { ComponentType, ReactNode } from "react";

export interface ServiceData {
  key: string;
  name: string;
  role: string;
  ok: boolean;
  cached?: boolean;
  error?: string;
  [extra: string]: unknown;
}

export function ServiceShell<T extends ServiceData>({
  serviceKey,
  icon,
  children,
}: {
  serviceKey: string;
  icon?: ComponentType<{ className?: string }>;
  children: (data: T) => ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/");
  }, [user, authLoading, router]);

  const load = useCallback(
    async (refresh = false) => {
      refresh ? setRefreshing(true) : setLoading(true);
      try {
        const res = await api.get<T>(ep.admin.infraService(serviceKey), {
          params: refresh ? { refresh: 1 } : {},
        });
        setData(res.data);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [serviceKey],
  );

  useEffect(() => {
    load();
  }, [load]);

  const Icon = icon;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/admin/infrastructure"
        className="text-sm text-gray-500 flex items-center gap-1 mb-4 hover:text-primary"
      >
        <AltArrowRight className="h-4 w-4" /> كل الخدمات
      </Link>

      <div className="flex items-center justify-between gap-3 mb-6">
        <PageHeader
          icon={Icon ? <Icon /> : undefined}
          title={data?.name ?? "…"}
          subtitle={data?.role}
        />
        <div className="flex items-center gap-2 shrink-0">
          {data?.cached && <Badge variant="default">مخزَّن مؤقتًا</Badge>}
          <Button variant="outline" onClick={() => load(true)} loading={refreshing}>
            <Refresh className="h-4 w-4" /> تحديث
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : !data ? null : !data.ok ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p className="font-bold text-red-700">تعذّرت القراءة من هذه الخدمة</p>
          <p className="text-sm text-red-600 mt-1 leading-relaxed">{data.error}</p>
        </div>
      ) : (
        <div className="space-y-4">{children(data)}</div>
      )}
    </div>
  );
}
