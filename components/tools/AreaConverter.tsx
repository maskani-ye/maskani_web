"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { COUNTRIES, GLOBAL_UNITS, type AreaUnit, countryByCode } from "@/lib/areaUnits";

/** رقم مقروء: الكبير بلا كسور، والصغير بكسور كافية كي لا يظهر «0». */
function smart(n: number): string {
  if (!isFinite(n) || n === 0) return "0";
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 0 : abs >= 100 ? 1 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

/**
 * محوّل المساحات — دخلٌ واحد ووحدةٌ واحدة، والباقي يُحسب فوراً.
 *
 * قرارا تصميم يستحقّان التوضيح:
 * 1) الفلترة بالدولة أولاً: الباحث المصريّ لا يعنيه «اللبنة» ولا اليمنيّ
 *    «القيراط»، وعرض 20 وحدة دفعةً واحدة يُخفي الوحدة المطلوبة وسط ضجيج.
 * 2) الوحدات العرفية (اليمن خاصة) قابلة للتعديل ومَوسومة «تقديرية» — إعطاؤها
 *    رقماً ثابتاً كالرسميّ خداعٌ قد يكلّف صاحبه أرضاً.
 */
export default function AreaConverter() {
  const [countryCode, setCountryCode] = useState("YE");
  const [value, setValue] = useState("1");
  const [fromKey, setFromKey] = useState("libnah");
  //: تعديلات المستخدم على قيم الوحدات التقديرية (مفتاح الوحدة → م²).
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const country = countryByCode(countryCode)!;
  const units: AreaUnit[] = useMemo(
    () => [...country.units, ...GLOBAL_UNITS],
    [country],
  );
  const m2Of = (u: AreaUnit) => {
    const o = parseFloat(overrides[`${countryCode}:${u.key}`] ?? "");
    return !u.exact && isFinite(o) && o > 0 ? o : u.m2;
  };

  const from = units.find((u) => u.key === fromKey) ?? units[0];
  const amount = parseFloat((value || "").replace(/,/g, "")) || 0;
  const inM2 = amount * m2Of(from);

  const pickCountry = (code: string) => {
    const c = countryByCode(code)!;
    setCountryCode(code);
    // الوحدة المحلّية الأولى إن وُجدت، وإلا المتر المربّع — كي لا يبقى اختيارٌ
    // من دولةٍ أخرى معلّقاً بعد التبديل.
    setFromKey(c.units[0]?.key ?? "m2");
  };

  const approx = units.filter((u) => !u.exact);

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
        <p className="text-sm font-semibold text-gray-700 mb-2">② أدخل المساحة</p>
        <div className="flex gap-2">
          <input
            value={value} onChange={(e) => setValue(e.target.value)}
            inputMode="decimal" placeholder="1"
            className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-lg font-bold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <select
            value={fromKey} onChange={(e) => setFromKey(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-primary max-w-[45%]"
          >
            {country.units.length > 0 && (
              <optgroup label={`وحدات ${country.name}`}>
                {country.units.map((u) => <option key={u.key} value={u.key}>{u.name}</option>)}
              </optgroup>
            )}
            <optgroup label="وحدات معياريّة">
              {GLOBAL_UNITS.map((u) => <option key={u.key} value={u.key}>{u.name}</option>)}
            </optgroup>
          </select>
        </div>
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
            <div key={`${u.key}-${u.name}`} className="rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {u.name}
                  {!u.exact && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 rounded px-1.5 py-0.5 ms-1.5">تقديرية</span>}
                </p>
                {u.note && <p className="text-[11px] text-gray-400 truncate">{u.note}</p>}
              </div>
              <span className="text-sm font-bold text-ink tabular-nums shrink-0">{smart(inM2 / m2Of(u))}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ④ ضبط الوحدات العرفية */}
      {approx.length > 0 && (
        <details className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 p-4">
          <summary className="text-sm font-semibold text-amber-800 cursor-pointer">
            اضبط قيمة الوحدات التقديرية في منطقتك ({approx.length})
          </summary>
          <p className="text-xs text-gray-500 leading-relaxed mt-2.5">
            هذه الوحدات عرفيّة لا رسمية، وقيمتها تختلف بين منطقة وأخرى. اسأل المسّاح المعتمد
            أو عاقل الحارة عن قيمتها في موقع الأرض، وأدخلها هنا ليصير التحويل مطابقاً لواقعك.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {approx.map((u) => (
              <label key={u.key} className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-700">{u.name} — م² للوحدة</span>
                <input
                  value={overrides[`${countryCode}:${u.key}`] ?? String(u.m2)}
                  onChange={(e) => setOverrides({ ...overrides, [`${countryCode}:${u.key}`]: e.target.value })}
                  inputMode="decimal"
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
            ))}
          </div>
        </details>
      )}

      <p className="text-xs text-gray-400 leading-relaxed">
        الاعتماد القانونيّ يكون على المساحة المثبتة في الوثيقة الرسمية ومحضر المسّاح المعتمد،
        لا على أي محوّل إلكترونيّ. اقرأ{" "}
        <Link href="/blog/measure-land-before-buying" className="text-primary hover:underline">
          كيف تتحقّق من مساحة الأرض قبل الشراء
        </Link>.
      </p>
    </div>
  );
}
