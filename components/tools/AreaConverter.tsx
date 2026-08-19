"use client";

import { useState } from "react";
import Link from "next/link";
import { NumberField, ResultRow, num, fmtNum } from "./calc-ui";

// محوّل المساحة — وحدات قياسية دقيقة (م²/هكتار/قدم²)، إضافةً إلى وحدة محلّية
// قابلة للضبط (اللبنة/القصبة تختلف بين مناطق اليمن، فيُدخل المستخدم قيمتها).

/** وحدات الأراضي في العالم العربيّ بقيمها بالمتر المربّع.
 *  سبب وجودها: ترتيبنا في مصر والسعودية والأردن والعراق جاء من محتوى القياس
 *  والبناء لا من الإعلانات — والباحث هناك يقيس بالفدان والقيراط والدونم لا
 *  باللبنة. القيم رسمية ثابتة، عدا الوحدات اليمنية فهي تقديرية وتختلف بالمنطقة
 *  ولهذا تبقى قابلة للتحرير يدوياً. */
const PRESETS: { name: string; m2: number; note: string }[] = [
  { name: "لبنة", m2: 44.44, note: "اليمن — تقديريّة وتختلف بين المناطق" },
  { name: "قصبة", m2: 400, note: "اليمن — تقديريّة وتختلف بين المناطق" },
  { name: "معاد", m2: 1000, note: "اليمن — تقديريّة وتختلف بين المناطق" },
  { name: "فدان", m2: 4200.83, note: "مصر والسودان — 24 قيراطاً" },
  { name: "قيراط", m2: 175.03, note: "مصر — 1/24 من الفدان" },
  { name: "سهم", m2: 7.29, note: "مصر — 1/24 من القيراط" },
  { name: "دونم", m2: 1000, note: "الأردن وسوريا وفلسطين — الدونم المتريّ" },
  { name: "دونم عراقي", m2: 2500, note: "العراق" },
  { name: "دونم عثماني", m2: 919.3, note: "وثائق قديمة في بلاد الشام" },
  { name: "هكتار", m2: 10000, note: "وحدة دولية" },
  { name: "فدان إنجليزي (acre)", m2: 4046.86, note: "الوثائق الإنجليزية" },
];

export default function AreaConverter() {
  const [sqm, setSqm] = useState("");
  const [localFactor, setLocalFactor] = useState("44.44"); // م² لكل لبنة (يختلف بالمنطقة)
  const [localName, setLocalName] = useState("لبنة");

  const m = num(sqm);
  const factor = num(localFactor);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="grid gap-4">
        <NumberField label="المساحة بالمتر المربّع" value={sqm} onChange={setSqm} suffix="م²" placeholder="1000" />
        <div className="rounded-xl border border-dashed border-gray-200 p-4 grid gap-3">
          <div className="grid gap-1.5">
            <span className="text-sm font-semibold text-gray-700">اختر الوحدة</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((u) => (
                <button
                  key={u.name}
                  type="button"
                  onClick={() => { setLocalName(u.name); setLocalFactor(String(u.m2)); }}
                  title={u.note}
                  className={`text-xs rounded-lg border px-2.5 py-1.5 transition-colors ${
                    localName === u.name
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-gray-200 bg-white text-gray-600 hover:border-primary"
                  }`}
                >
                  {u.name}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            الوحدات اليمنية (اللبنة/القصبة/المعاد) <strong>تختلف بين المناطق</strong>، فالقيمة المعروضة
            تقديرية — عدّلها بقيمة وحدتك في منطقتك. أمّا الفدان والقيراط والدونم فقيمها ثابتة رسمياً.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-gray-700">اسم الوحدة</span>
              <input value={localName} onChange={(e) => setLocalName(e.target.value.slice(0, 12))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </label>
            <NumberField label="م² لكل وحدة" value={localFactor} onChange={setLocalFactor} suffix="م²" />
          </div>
        </div>
      </div>

      <div className="grid gap-3 content-start">
        <ResultRow label="بالمتر المربّع" value={`${fmtNum(m)} م²`} />
        <ResultRow label="بالهكتار" value={`${fmtNum(m / 10000, 4)} هكتار`} />
        <ResultRow label="بالقدم المربّع" value={`${fmtNum(m * 10.7639)} قدم²`} />
        <ResultRow label={`بوحدة «${localName || "المحلّية"}»`} value={factor > 0 ? `${fmtNum(m / factor, 2)} ${localName}` : "—"} />
        <p className="text-xs text-gray-400 leading-relaxed mt-1">
          تحقّق دائمًا من قيمة الوحدة المحلّية في منطقتك قبل الاعتماد على التحويل في صفقة. اقرأ <Link href="/blog/land-buying-guide-yemen" className="text-primary hover:underline">دليل شراء الأراضي في اليمن</Link>.
        </p>
      </div>
    </div>
  );
}
