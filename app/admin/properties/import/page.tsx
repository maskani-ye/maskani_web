"use client";

import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toEnglishDigits } from "@/lib/digits";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle, CloseCircle, DocumentAdd, Upload } from "@solar-icons/react";

// استيراد جماعيّ لعقارات المكاتب.
//
// سببه أن المخزون سقف المنصّة: 4 عقارات نشطة مقابل 2,335 زيارة أسبوعياً. مكتبٌ
// واحد لديه عشرون عقاراً ولن يسجّل عشرين مرّة ولن يملأ عشرين نموذجاً — لكنه
// يرسل جدولاً في دقيقة. العقارات تُنسب لحساب وسيط برقم المالك، ومتى دخل المالك
// بجوجل بنفس الرقم استحوذ على الحساب ووجد عقاراته جاهزة.

const COLUMNS = [
  "title", "city", "offer_type", "contact_phone", "owner_name",
  "property_type", "price", "currency", "area", "rooms", "bathrooms", "address", "description",
] as const;

const SAMPLE = `title,city,offer_type,contact_phone,price,currency,area,rooms
شقة 3 غرف في حي الجامعة,إب,rent_yearly,+967771234567,600000,YER,150,3
أرض 4 لبنة في السنينة,صنعاء,sale,+967771234567,12000000,YER,178,`;

interface RowResult { row: number; ok: boolean; id?: number; title?: string; errors?: string[] }
interface ImportResult {
  dry_run: boolean; total: number; ok: number; failed: number;
  created: number; new_owners: number; results: RowResult[];
}

/** يحوّل نصّ CSV إلى صفوف — يقبل الفاصلة والفاصلة المنقوطة والتبويب. */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const head = lines[0].split(sep).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(sep);
    const row: Record<string, string> = {};
    head.forEach((h, i) => {
      const v = (cells[i] ?? "").trim();
      // الأرقام العربية تصل من جداول المكاتب كثيراً — نحوّلها كما في كل حقل رقميّ.
      row[h] = ["price", "area", "rooms", "bathrooms", "contact_phone"].includes(h)
        ? toEnglishDigits(v)
        : v;
    });
    return row;
  });
}

export default function BulkImportPage() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = parseCsv(text);

  async function run(dryRun: boolean) {
    setBusy(true); setError(null); setResult(null);
    try {
      const { data } = await api.post<ImportResult>(endpoints.admin.propertiesBulkImport, {
        rows, dry_run: dryRun,
      });
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then(setText);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        icon={<DocumentAdd />}
        title="استيراد عقارات جماعي"
        subtitle="جدول واحد من المكتب العقاري بدل عشرين تسجيلاً"
      />

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-700 cursor-pointer hover:border-primary">
            <Upload className="h-4 w-4" /> اختر ملف CSV
            <input type="file" accept=".csv,.txt,text/csv" onChange={onFile} className="hidden" />
          </label>
          <button
            type="button"
            onClick={() => setText(SAMPLE)}
            className="text-xs rounded-xl bg-gray-100 px-3 py-2 text-gray-600 hover:bg-gray-200"
          >
            أدرِج مثالاً
          </button>
          <span className="text-xs text-gray-400 ms-auto">
            الأعمدة: {COLUMNS.join(" · ")}
          </span>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          dir="ltr"
          placeholder="الصق محتوى CSV هنا…"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-mono outline-none focus:border-primary"
        />

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <span className="text-sm text-gray-500">
            صفوف مقروءة: <strong className="text-ink tabular-nums">{rows.length}</strong>
          </span>
          {/* الفحص قبل الكتابة: خطأ في عمودٍ يُكتشف قبل إنشاء مئة عقار لا بعده. */}
          <Button variant="outline" size="sm" loading={busy} disabled={!rows.length}
                  onClick={() => run(true)}>
            افحص بلا حفظ
          </Button>
          <Button size="sm" loading={busy} disabled={!rows.length}
                  onClick={() => run(false)}>
            استورد فعلياً
          </Button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </Card>

      {result && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant={result.failed ? "warning" : "success"}>
              {result.dry_run ? "فحص فقط — لم يُحفظ شيء" : "استيراد فعليّ"}
            </Badge>
            <Badge variant="info">الصفوف: {result.total}</Badge>
            <Badge variant="success">سليمة: {result.ok}</Badge>
            {result.failed > 0 && <Badge variant="danger">مرفوضة: {result.failed}</Badge>}
            {!result.dry_run && (
              <>
                <Badge variant="info">أُنشئت: {result.created}</Badge>
                <Badge variant="default">ملّاك جدد: {result.new_owners}</Badge>
              </>
            )}
          </div>

          <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
            {result.results.map((r) => (
              <div key={r.row} className="flex items-start gap-3 py-2.5">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  r.ok ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                  {r.ok ? <CheckCircle weight="Bold" className="h-4 w-4" />
                        : <CloseCircle weight="Bold" className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    صفّ {r.row}: {r.title || "—"}
                  </p>
                  {r.errors?.length ? (
                    <p className="text-xs text-red-600 mt-0.5">{r.errors.join(" · ")}</p>
                  ) : r.id ? (
                    <a href={`/properties/${r.id}`} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-primary hover:underline">عرض العقار #{r.id}</a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {!result.dry_run && result.new_owners > 0 && (
            <p className="text-xs text-gray-400 mt-4 leading-relaxed">
              أُنشئت {result.new_owners} حسابات وسيطة بأرقام الملّاك. متى دخل المالك بجوجل
              بنفس الرقم استحوذ على حسابه ووجد عقاراته منسوبةً إليه — بلا أي خطوة إضافية منه.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
