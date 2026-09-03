"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ServerSquare, Refresh, AltArrowRight } from "@solar-icons/react";
import { toast } from "sonner";
import type { ServiceStatus } from "../page";

/** بطاقة رقم مفرد — الأرقام الدالّة أعلى الصفحة قبل الجداول. */
function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl card-shadow p-4">
      <p className="text-caption text-muted">{label}</p>
      <p className="text-h3 font-bold text-ink mt-1">{value ?? "—"}</p>
    </div>
  );
}

function Rows({ title, rows }: { title: string; rows: Record<string, unknown>[] }) {
  if (!rows.length) return null;
  const cols = Object.keys(rows[0]).filter((c) => typeof rows[0][c] !== "object");
  return (
    <div className="bg-white rounded-2xl card-shadow p-4 mt-4">
      <p className="font-bold text-ink mb-3">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-body">
          <thead>
            <tr className="text-muted text-caption">
              {cols.map((c) => <th key={c} className="text-right font-normal pb-2 px-2">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-muted-100">
                {cols.map((c) => (
                  <td key={c} className="py-2 px-2 text-muted-700 whitespace-nowrap">
                    {r[c] === null || r[c] === undefined || r[c] === ""
                      ? "—"
                      : String(r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ServiceDetailPage() {
  const { key } = useParams<{ key: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/");
  }, [user, authLoading, router]);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await api.get<ServiceStatus>(ep.admin.infraService(key), {
        params: refresh ? { refresh: 1 } : {},
      });
      setData(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [key]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="h-24 bg-muted-100 rounded-2xl animate-pulse mb-4" />
        <div className="h-64 bg-muted-100 rounded-2xl animate-pulse" />
      </div>
    );
  }
  if (!data) return null;

  // جداول التفاصيل تختلف بين مزوّد وآخر — نلتقط أول مصفوفة كائنات في الرد.
  const tables = Object.entries(data).filter(
    ([, v]) => Array.isArray(v) && v.length > 0 && typeof v[0] === "object",
  ) as [string, Record<string, unknown>[]][];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/admin/infrastructure" className="text-body text-muted-500 flex items-center gap-1 mb-4">
        <AltArrowRight className="h-4 w-4" /> كل الخدمات
      </Link>

      <div className="flex items-center justify-between mb-6">
        <PageHeader icon={<ServerSquare />} title={data.name} subtitle={data.role} />
        <Button variant="outline" onClick={() => load(true)} loading={refreshing}>
          <Refresh className="h-4 w-4" /> تحديث
        </Button>
      </div>

      {!data.ok && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
          <p className="font-bold text-red-700 text-body">تعذّرت القراءة من هذه الخدمة</p>
          <p className="text-body text-red-600 mt-1">{data.error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="الحالة" value={<Badge variant={data.ok ? "success" : "danger"}>{data.ok ? "سليمة" : "متعطّلة"}</Badge>} />
        {Object.entries(data)
          .filter(([k, v]) =>
            !["ok", "cached", "provider", "key", "name", "role", "error"].includes(k) &&
            (typeof v === "number" || typeof v === "string"))
          .slice(0, 3)
          .map(([k, v]) => <Stat key={k} label={k} value={String(v)} />)}
      </div>

      {tables.map(([name, rows]) => (
        <Rows key={name} title={name} rows={rows} />
      ))}
    </div>
  );
}
