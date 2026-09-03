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

/** قالب فارغ يُرسَل للمكتب ليملأه — عمودان إلزاميان فقط والباقي اختياريّ. */
const TEMPLATE = `title,city,offer_type,contact_phone,price,currency,area,rooms,bathrooms,property_type,address,description
شقة للإيجار في حي كذا,إب,rent_yearly,+9677XXXXXXXX,600000,YER,150,3,2,شقة,شارع كذا,وصف مختصر
,,,,,,,,,,,
ملاحظات: offer_type = sale أو rent_monthly أو rent_yearly · currency = YER أو SAR أو USD,,,,,,,,,,,`;

/** رسالة جاهزة تُرسَل للمكتب العقاريّ كما هي.
 *
 *  سبب وجودها هنا لا في ملفّ جانبيّ: الآلة التي بنيناها (استيراد + استحواذ)
 *  لا تُنتج عقاراً واحداً حتى يصل الجدول. والرسالة الجاهزة تحذف الاحتكاك
 *  الأخير — لا يكتب المشرف شيئاً، ينسخ ويرسل. */
const WHATSAPP_MSG = `السلام عليكم 👋

منصّة *مسكني* تعرض عقاراتكم مجاناً أمام الباحثين في اليمن — بلا عمولة وبلا اشتراك، والتواصل يصلكم مباشرة على أرقامكم.

نتولّى نحن إدخال عقاراتكم كاملة. أرسلوا لنا جدولاً (Excel أو حتى رسالة) يحوي لكل عقار:
• الوصف/العنوان   • المدينة   • بيع أم إيجار   • السعر   • المساحة   • رقم التواصل

وسنرفعها خلال دقائق. وحين تدخلون بحساب Google بنفس رقم الهاتف، تجدون كل عقاراتكم منسوبة إليكم وتديرونها بأنفسكم.

الموقع: https://maskani.homes
التطبيق: https://maskani.homes/download`;

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
  const [copied, setCopied] = useState(false);

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

  function downloadTemplate() {
    // BOM ضروريّ: بلا \uFEFF يفتح Excel العربية كرموز مشوّهة فيظنّ المكتب
    // أن الملف تالف ولا يكمل.
    const blob = new Blob(["\uFEFF" + TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "قالب-عقارات-مسكني.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(WHATSAPP_MSG);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("تعذّر النسخ — انسخ الرسالة يدوياً من الأسفل");
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
          <label className="inline-flex items-center gap-2 rounded-xl border border-muted-200 px-3.5 py-2 text-body font-semibold text-muted-700 cursor-pointer hover:border-primary">
            <Upload className="h-4 w-4" /> اختر ملف CSV
            <input type="file" accept=".csv,.txt,text/csv" onChange={onFile} className="hidden" />
          </label>
          <button
            type="button"
            onClick={() => setText(SAMPLE)}
            className="text-caption rounded-xl bg-muted-100 px-3 py-2 text-muted-600 hover:bg-muted-200"
          >
            أدرِج مثالاً
          </button>
          <button
            type="button"
            onClick={downloadTemplate}
            className="text-caption rounded-xl bg-muted-100 px-3 py-2 text-muted-600 hover:bg-muted-200"
          >
            نزّل القالب للمكتب
          </button>
          <button
            type="button"
            onClick={copyMessage}
            className="text-caption rounded-xl bg-gold/20 px-3 py-2 font-semibold text-ink hover:bg-gold/30"
          >
            انسخ رسالة واتساب
          </button>
          <span className="text-caption text-muted ms-auto">
            الأعمدة: {COLUMNS.join(" · ")}
          </span>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          dir="ltr"
          placeholder="الصق محتوى CSV هنا…"
          className="w-full rounded-xl border border-muted-200 bg-white px-4 py-3 text-body font-mono outline-none focus:border-primary"
        />

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <span className="text-body text-muted-500">
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
          <div className="mt-4 rounded-xl bg-danger-50 border border-danger-200 px-4 py-3 text-body text-danger-700">
            {error}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <p className="text-body font-bold text-ink mb-1">رسالة الدعوة للمكاتب العقارية</p>
        <p className="text-caption text-muted-500 mb-3 leading-relaxed">
          انسخها وأرسلها كما هي. الآلة جاهزة — ما ينقصها هو الجدول، وهذه الرسالة تجلبه.
          {copied && <span className="text-success-600 font-semibold"> · نُسخت ✓</span>}
        </p>
        <pre className="whitespace-pre-wrap rounded-xl bg-muted-50 p-4 text-caption leading-relaxed text-muted-700 max-h-60 overflow-y-auto">
{WHATSAPP_MSG}
        </pre>
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

          <div className="divide-y divide-muted-100 max-h-[420px] overflow-y-auto">
            {result.results.map((r) => (
              <div key={r.row} className="flex items-start gap-3 py-2.5">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  r.ok ? "bg-success-50 text-success-600" : "bg-danger-50 text-danger-600"}`}>
                  {r.ok ? <CheckCircle weight="Bold" className="h-4 w-4" />
                        : <CloseCircle weight="Bold" className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-semibold text-ink truncate">
                    صفّ {r.row}: {r.title || "—"}
                  </p>
                  {r.errors?.length ? (
                    <p className="text-caption text-danger-600 mt-0.5">{r.errors.join(" · ")}</p>
                  ) : r.id ? (
                    <a href={`/properties/${r.id}`} target="_blank" rel="noopener noreferrer"
                       className="text-caption text-primary hover:underline">عرض العقار #{r.id}</a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {!result.dry_run && result.new_owners > 0 && (
            <p className="text-caption text-muted mt-4 leading-relaxed">
              أُنشئت {result.new_owners} حسابات وسيطة بأرقام الملّاك. متى دخل المالك بجوجل
              بنفس الرقم استحوذ على حسابه ووجد عقاراته منسوبةً إليه — بلا أي خطوة إضافية منه.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
