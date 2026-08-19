"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  COUNTRIES, GLOBAL_UNITS, ALL_UNITS, unitsOfCountry, countryByCode,
  BASIS_LABEL, type AreaUnit,
} from "@/lib/areaUnits";

/** رقم مقروء: الكبير بلا كسور، والصغير بكسور كافية كي لا يُقرأ «0». */
export function smart(n: number): string {
  if (!isFinite(n) || n === 0) return "0";
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 0 : abs >= 100 ? 1 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

const BASIS_TONE: Record<string, string> = {
  official: "text-emerald-700 bg-emerald-50",
  documented: "text-sky-700 bg-sky-50",
  local: "text-amber-700 bg-amber-50",
};

/**
 * محوّل المساحات — دولة ← وحدة ← نتيجة.
 *
 * القرار الجوهريّ: كل اشتقاق وحدةٌ مستقلّة. «القصبة» ليست خياراً واحداً يعدّل
 * المستخدم رقمه، بل ثلاثة كيانات مختلفة (عشاري تعزي · هدوي تعزي · إبي) لكلٍّ
 * اسمه ورقمه ومنطقته — لأن من يبيع أرضاً في إب بسعر «القصبة» لا يقصد قصبة تعز،
 * والفارق بينهما 36 متراً في كل قصبة.
 */
export default function AreaConverter({
  initialCountry = "YE", initialUnit,
}: { initialCountry?: string; initialUnit?: string }) {
  const [countryCode, setCountryCode] = useState(initialCountry);
  const [value, setValue] = useState("1");
  const [fromKey, setFromKey] = useState(
    initialUnit ?? unitsOfCountry(initialCountry)[0]?.key ?? "m2",
  );
  //: تعديل المستخدم على قيمة وحدة عرفية في منطقته (مفتاح الوحدة → م²).
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const country = countryByCode(countryCode)!;
  const local = useMemo(() => unitsOfCountry(countryCode), [countryCode]);
  const units: AreaUnit[] = useMemo(() => [...local, ...GLOBAL_UNITS], [local]);

  const m2Of = (u: AreaUnit) => {
    const o = parseFloat(overrides[u.key] ?? "");
    return u.basis !== "official" && isFinite(o) && o > 0 ? o : u.m2;
  };

  const from = ALL_UNITS.find((u) => u.key === fromKey) ?? units[0];
  const amount = parseFloat((value || "").replace(/,/g, "")) || 0;
  const inM2 = amount * m2Of(from);
  const editable = units.filter((u) => u.basis !== "official");

  const pickCountry = (code: string) => {
    setCountryCode(code);
    setFromKey(unitsOfCountry(code)[0]?.key ?? "m2");
  };

  return (
    <div className="grid gap-5">
      {/* ① الدولة */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">① اختر الدولة</p>
        <div className="flex flex-wrap gap-1.5">
          {COUNTRIES.map((c) => (
            <button key={c.code} type="button" onClick={() => pickCountry(c.code)}
              className={`text-sm rounded-xl border px-3 py-1.5 transition-colors ${
                c.code === countryCode
                  ? "border-primary bg-primary/10 text-primary font-bold"
                  : "border-gray-200 bg-white text-gray-600 hover:border-primary"}`}>
              <span className="me-1">{c.flag}</span>{c.name}
            </button>
          ))}
        </div>
        {country.hint && (
          <p className="text-xs text-gray-500 leading-relaxed mt-2.5 bg-gray-50 rounded-xl p-3">{country.hint}</p>
        )}
      </div>

      {/* ② المساحة والوحدة */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">② أدخل المساحة واختر وحدتها</p>
        <div className="flex gap-2">
          <input value={value} onChange={(e) => setValue(e.target.value)}
            inputMode="decimal" placeholder="1" aria-label="المساحة"
            className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-lg font-bold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <select value={fromKey} onChange={(e) => setFromKey(e.target.value)} aria-label="الوحدة"
            className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-primary max-w-[48%]">
            {local.length > 0 && (
              <optgroup label={`وحدات ${country.name}`}>
                {local.map((u) => (
                  <option key={u.key} value={u.key}>
                    {u.name}{u.region ? ` — ${u.region}` : ""}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="وحدات معياريّة">
              {GLOBAL_UNITS.map((u) => <option key={u.key} value={u.key}>{u.name}</option>)}
            </optgroup>
          </select>
        </div>
        <p className={`inline-block text-[11px] font-bold rounded-lg px-2 py-1 mt-2 ${BASIS_TONE[from.basis]}`}>
          {from.name}: {smart(m2Of(from))} م² · {BASIS_LABEL[from.basis]}
        </p>
      </div>

      {/* ③ النتائج */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">③ النتيجة</p>
        <div className="rounded-2xl bg-primary/5 border border-primary/15 px-4 py-3.5 mb-3">
          <p className="text-xs text-gray-500">بالمتر المربّع</p>
          <p className="text-2xl font-extrabold text-primary tabular-nums">{smart(inM2)} م²</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {units.filter((u) => u.key !== from.key).map((u) => (
            <div key={u.key} className="rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
                <p className="text-[11px] text-gray-400 truncate">
                  {u.region ? `${u.region} · ` : ""}{smart(m2Of(u))} م²{u.note ? ` · ${u.note}` : ""}
                </p>
              </div>
              <span className="text-sm font-bold text-ink tabular-nums shrink-0">{smart(inM2 / m2Of(u))}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ④ ضبط الوحدات غير الرسمية */}
      {editable.length > 0 && (
        <details className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 p-4">
          <summary className="text-sm font-semibold text-amber-800 cursor-pointer">
            قيمة الوحدة تختلف في منطقتك؟ اضبطها ({editable.length})
          </summary>
          <p className="text-xs text-gray-500 leading-relaxed mt-2.5">
            الأرقام أعلاه موثّقة إقليمياً، لكن العرف قد يختلف من مديريّة لأخرى. اسأل المسّاح
            المعتمد عن قيمة الوحدة في موقع الأرض وأدخلها هنا ليطابق التحويل واقعك.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {editable.map((u) => (
              <label key={u.key} className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-700">{u.name} — م² للوحدة</span>
                <input value={overrides[u.key] ?? String(u.m2)} inputMode="decimal"
                  onChange={(e) => setOverrides({ ...overrides, [u.key]: e.target.value })}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary" />
              </label>
            ))}
          </div>
        </details>
      )}

      <p className="text-xs text-gray-400 leading-relaxed">
        الاعتماد القانونيّ على المساحة المثبتة في الوثيقة الرسمية ومحضر المسّاح المعتمد، لا على
        أي محوّل إلكترونيّ. اقرأ{" "}
        <Link href="/blog/measure-land-before-buying" className="text-primary hover:underline">
          كيف تتحقّق من مساحة الأرض قبل الشراء
        </Link>.
      </p>
    </div>
  );
}
