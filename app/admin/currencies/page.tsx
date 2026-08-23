"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { Dollar, Refresh, AddCircle, ClockCircle } from "@solar-icons/react";

/**
 * إدارة العملات وأسعار صرفها.
 *
 * كل مبلغ في المنصّة يُقارَن بقيمته المرجعية بالدولار لا برقمه الخام — وإلا
 * صار مليون ريال يمني أغلى من ألف دينار أردني. فتعديل أي سعر هنا يُعيد حساب
 * القيم المرجعية المخزّنة كلّها، وهو أخطر إجراء في هذه اللوحة: رقمٌ خاطئ يقلب
 * ترتيب النتائج وفلاتر السعر في الأسواق الأربعة.
 *
 * ندخل السعر بصيغة **كم وحدة للدولار** (48.5 جنيهاً) لا بقيمة الوحدة بالدولار
 * (0.0206) — الأولى هي ما يعرفه الإنسان من السوق، والثانية ما يخزّنه الخادم.
 */

interface JobStatus {
  ran_at: string;
  ok: boolean;
  updated: string[];
  skipped: Record<string, { current: string; fetched: string; deviation: string }>;
  error: string | null;
}

interface Rate {
  id: number;
  code: string;
  label: string;
  rate_to_usd: string;
  per_usd: string;
  updated_at: string;
}

//: عملات مثبّتة بالدولار — سعرها لا يتحرّك، وتغييره يعني خطأً غالباً.
const PEGGED: Record<string, string> = {
  SAR: "مثبَّت بالدولار (3.75)",
  JOD: "مثبَّت بالدولار (0.709)",
  USD: "العملة المرجعية",
};

export default function AdminCurrenciesPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [fetching, setFetching] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [schedule, setSchedule] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newPerUsd, setNewPerUsd] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{
        base: string; rates: Rate[]; job: JobStatus | null; schedule: string;
      }>(ep.exchangeRates);
      setRates(data.rates ?? []);
      setJob(data.job ?? null);
      setSchedule(data.schedule ?? "");
      setDrafts(Object.fromEntries((data.rates ?? []).map((r) => [r.code, r.per_usd])));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (rate: Rate) => {
    const perUsd = parseFloat(drafts[rate.code] ?? "");
    if (!isFinite(perUsd) || perUsd <= 0) {
      toast.error("أدخل عدداً موجباً");
      return;
    }
    setSaving(rate.code);
    try {
      // الخادم يخزّن قيمة الوحدة بالدولار — نحوّل من «كم وحدة للدولار».
      await api.patch(ep.exchangeRate(rate.id), { rate_to_usd: (1 / perUsd).toFixed(8) });
      toast.success(`حُدّث سعر ${rate.label} — أُعيد حساب كل القيم المرجعية`);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  /** يجلب سعر السوق ويملأ الحقل — بلا حفظ، فالمشرف يراجع ثم يحفظ. */
  const fetchRate = async (rate: Rate) => {
    setFetching(rate.code);
    try {
      const { data } = await api.post<{
        per_usd: string; change_pct: string; source: string;
      }>(ep.exchangeRateFetch(rate.id), {});
      setDrafts((d) => ({ ...d, [rate.code]: data.per_usd }));
      toast.success(
        `${rate.label}: ${data.per_usd} للدولار (${data.source}) — الفارق ${data.change_pct}. اضغط حفظ للاعتماد.`
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setFetching(null);
    }
  };

  const create = async () => {
    const perUsd = parseFloat(newPerUsd);
    if (!newCode.trim() || !isFinite(perUsd) || perUsd <= 0) {
      toast.error("أدخل رمز العملة وسعرها");
      return;
    }
    setSaving("new");
    try {
      await api.post(ep.exchangeRates, {
        code: newCode.trim().toUpperCase(),
        rate_to_usd: (1 / perUsd).toFixed(8),
      });
      toast.success("أُضيفت العملة");
      setNewCode(""); setNewPerUsd("");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <PageHeader
        icon={<Dollar />}
        title="العملات وأسعار الصرف"
        subtitle="القيمة المرجعية لكل مقارنة سعرية في المنصّة"
        actions={
          <Button variant="outline" size="sm" onClick={load} loading={loading}>
            <Refresh className="h-4 w-4" /> تحديث
          </Button>
        }
      />

      {/* حالة المهمّة اليومية — المهام الدورية تعمل في صمت، وسكوتها لا يُرى
          إلّا إن عُرض. */}
      <Card className={`p-5 border ${
        job === null ? "bg-gray-50 border-gray-200"
          : job.ok ? "bg-emerald-50/60 border-emerald-200"
          : "bg-red-50/60 border-red-200"
      }`}>
        <div className="flex items-start gap-3">
          <ClockCircle className={`h-5 w-5 shrink-0 mt-0.5 ${
            job === null ? "text-gray-400" : job.ok ? "text-emerald-600" : "text-red-600"
          }`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">
              التحديث التلقائي اليوميّ · {schedule || "—"}
            </p>
            {job === null ? (
              <p className="text-xs text-gray-500 mt-1">
                لم تُسجَّل أي دورة بعد — أوّل تشغيل يظهر هنا بعد موعده القادم.
              </p>
            ) : (
              <>
                <p className="text-xs text-gray-600 mt-1">
                  آخر تشغيل:{" "}
                  <strong>
                    {new Date(job.ran_at).toLocaleString("ar", {
                      dateStyle: "medium", timeStyle: "short",
                    })}
                  </strong>{" "}
                  · {job.ok ? "نجح" : "فشل"}
                </p>
                {job.updated.length > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    حُدّثت: {job.updated.join(" · ")}
                  </p>
                )}
                {Object.keys(job.skipped ?? {}).length > 0 && (
                  <div className="mt-2 text-xs text-amber-800 bg-amber-100/70 rounded-xl px-3 py-2">
                    <p className="font-semibold mb-1">
                      لم تُطبَّق (قفزة تتجاوز الحدّ — تحتاج قرارك):
                    </p>
                    {Object.entries(job.skipped).map(([code, s]) => (
                      <p key={code}>
                        {code}: {s.current} ← {s.fetched} (فارق {s.deviation})
                      </p>
                    ))}
                  </div>
                )}
                {job.error && (
                  <p className="text-xs text-red-700 mt-1">الخطأ: {job.error}</p>
                )}
              </>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-amber-50/60 border border-amber-200">
        <p className="text-sm text-amber-900 leading-relaxed">
          يُدخَل السعر بصيغة <strong>كم وحدة مقابل دولار واحد</strong> — كما يُقال في
          السوق. تعديل أي سعر يُعيد فوراً حساب القيم المرجعية لكل العقارات والطلبات
          والعروض، فتبقى الفلترة والترتيب صحيحة.
        </p>
      </Card>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-start px-4 py-3 font-semibold">العملة</th>
              <th className="text-start px-4 py-3 font-semibold">للدولار الواحد</th>
              <th className="text-start px-4 py-3 font-semibold">قيمة الوحدة ($)</th>
              <th className="text-start px-4 py-3 font-semibold">آخر تحديث</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rates.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/60">
                <td className="px-4 py-3">
                  <div className="font-bold text-ink">{r.label}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1.5">
                    {r.code}
                    {PEGGED[r.code] && (
                      <Badge variant="info">{PEGGED[r.code]}</Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 w-40">
                  <Input
                    value={drafts[r.code] ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [r.code]: e.target.value }))
                    }
                    inputMode="decimal"
                    disabled={r.code === "USD"}
                  />
                </td>
                <td className="px-4 py-3 text-gray-500 tabular-nums">{r.rate_to_usd}</td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(r.updated_at).toLocaleDateString("ar", { dateStyle: "medium" })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      loading={fetching === r.code}
                      disabled={r.code === "USD"}
                      onClick={() => fetchRate(r)}
                      title="جلب سعر السوق الآن"
                    >
                      <Refresh className="h-3.5 w-3.5" /> جلب
                    </Button>
                    <Button
                      size="sm"
                      loading={saving === r.code}
                      disabled={r.code === "USD" || drafts[r.code] === r.per_usd}
                      onClick={() => save(r)}
                    >
                      حفظ
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rates.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                لا عملات مسجّلة.
              </td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
          <AddCircle className="h-4 w-4 text-primary" /> إضافة عملة
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-32">
            <Input
              label="الرمز"
              placeholder="KWD"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            />
          </div>
          <div className="w-44">
            <Input
              label="كم وحدة للدولار"
              placeholder="0.31"
              inputMode="decimal"
              value={newPerUsd}
              onChange={(e) => setNewPerUsd(e.target.value)}
            />
          </div>
          <Button loading={saving === "new"} onClick={create}>إضافة</Button>
        </div>
        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
          الرمز يجب أن يكون معرّفاً في الخادم ضمن قائمة العملات المدعومة، وإلّا
          رُفض — فالعملة ليست سطراً في جدول فحسب، بل خيارٌ في نماذج النشر
          والتطبيقات أيضاً.
        </p>
      </Card>
    </div>
  );
}
