"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { AddCircle, TrashBinTrash, MapPoint } from "@solar-icons/react";
import { toast } from "sonner";
import type { City } from "@/types";

interface Neighborhood {
  id: number;
  name: string;
  slug: string;
  city: number;
  city_name: string;
  is_active: boolean;
}

/** إدارة الأحياء — الجدول بُذر آلياً ممّا كتبه المستخدمون، فيحتاج تنقيةً بشرية:
 *  بعض القيم شوارع لا أحياء، وبعض الأحياء الحقيقية لم تُذكر بعد. */
export function NeighborhoodsAdmin({ cities }: { cities: City[] }) {
  const [items, setItems] = useState<Neighborhood[]>([]);
  const [cityId, setCityId] = useState<string>("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Neighborhood[] | { results: Neighborhood[] }>(
        ep.admin.neighborhoods,
        { params: cityId ? { city: cityId } : {} },
      );
      setItems(Array.isArray(data) ? data : data.results ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!cityId || !name.trim()) {
      toast.error("اختر المحافظة واكتب اسم الحي");
      return;
    }
    setSaving(true);
    try {
      await api.post(ep.admin.neighborhoods, { city: Number(cityId), name: name.trim() });
      toast.success("تمت إضافة الحي");
      setName("");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (n: Neighborhood) => {
    try {
      await api.patch(ep.admin.neighborhood(n.id), { is_active: !n.is_active });
      toast.success(n.is_active ? "تم تعطيل الحي" : "تم تفعيل الحي");
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const remove = async (n: Neighborhood) => {
    if (!confirm(`حذف حي «${n.name}»؟ العقارات المرتبطة به تبقى كما هي ويعود حيّها نصاً حراً.`)) return;
    try {
      await api.delete(ep.admin.neighborhood(n.id));
      toast.success("تم حذف الحي");
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const cityOptions = cities.map((c) => ({ value: String(c.id), label: c.name_ar }));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl card-shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <Select
            label="المحافظة"
            options={cityOptions}
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            placeholder="كل المحافظات"
          />
          <Input
            label="اسم الحي"
            placeholder="مثال: حدة"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button onClick={add} loading={saving} disabled={saving}>
            <AddCircle className="h-4 w-4" /> إضافة حي
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          الأحياء بُذرت آلياً ممّا كتبه المستخدمون — احذف ما ليس حيّاً (شارع/عنوان)
          وأضِف الأحياء الناقصة. الحذف لا يمسّ العقارات.
        </p>
      </div>

      <div className="bg-white rounded-2xl card-shadow divide-y divide-gray-100">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">جارٍ التحميل…</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">لا توجد أحياء بعد</div>
        ) : (
          items.map((n) => (
            <div key={n.id} className="flex items-center gap-3 p-3">
              <MapPoint className="h-4 w-4 text-gray-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{n.name}</p>
                <p className="text-xs text-gray-500">{n.city_name}</p>
              </div>
              <button onClick={() => toggle(n)}>
                <Badge variant={n.is_active ? "success" : "default"}>
                  {n.is_active ? "نشط" : "معطّل"}
                </Badge>
              </button>
              <button
                onClick={() => remove(n)}
                className="text-red-500 hover:text-red-600 p-1"
                aria-label="حذف"
              >
                <TrashBinTrash className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
