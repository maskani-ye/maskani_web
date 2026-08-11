"use client";

import { useState } from "react";
import Link from "next/link";
import { NumberField, ResultRow, num, fmtNum } from "./calc-ui";

// محوّل المساحة — وحدات قياسية دقيقة (م²/هكتار/قدم²)، إضافةً إلى وحدة محلّية
// قابلة للضبط (اللبنة/القصبة تختلف بين مناطق اليمن، فيُدخل المستخدم قيمتها).
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
          <p className="text-xs text-gray-500 leading-relaxed">
            وحدات الأراضي المحلّية (اللبنة/القصبة) <strong>تختلف بين مناطق اليمن</strong>، لذا أدخِل قيمة وحدتك في منطقتك للحصول على تحويل دقيق.
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
