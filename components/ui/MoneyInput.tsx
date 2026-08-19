"use client";
import { toEnglishDigits } from "@/lib/digits";

/**
 * حقل إدخال مبلغ مالي — يبسّط إدخال الأرقام الكبيرة (مثل الريال اليمني):
 *  • يعرض فواصل الآلاف أثناء الكتابة (5,000,000) لكن يُخرج الرقم الخام ("5000000").
 *  • يُظهر تلميح المقدار (٥ مليون / ٧٥٠ ألف) لتأكيد بصري سريع.
 *  • اختياري — الفراغ مسموح ويعني «السعر عند التواصل».
 * الباك اند يستقبل الرقم الخام دائماً (لا فواصل).
 */

function groupDigits(raw: string): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** تلميح مقدار مختصر بالعربية (ألف/مليون/مليار) — null إن أقلّ من ألف. */
export function magnitudeHint(raw: string): string | null {
  const n = parseInt((raw ?? "").replace(/\D/g, ""), 10);
  if (!n || n < 1000) return null;
  const units: [number, string][] = [
    [1_000_000_000, "مليار"],
    [1_000_000, "مليون"],
    [1_000, "ألف"],
  ];
  for (const [unit, label] of units) {
    if (n >= unit) {
      const v = n / unit;
      const rounded = Number.isInteger(v) ? String(v) : v.toFixed(1).replace(/\.0$/, "");
      return `${rounded} ${label}`;
    }
  }
  return null;
}

export function MoneyInput({
  value,
  onChange,
  symbol,
  placeholder = "0",
  className = "",
}: {
  value: string;
  onChange: (raw: string) => void;
  symbol?: string;
  placeholder?: string;
  className?: string;
}) {
  const hint = magnitudeHint(value);
  const inputCls =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
  return (
    <div>
      <div className="relative">
        <input
          className={`${inputCls} ${className}`}
          type="text"
          inputMode="numeric"
          dir="ltr"
          placeholder={placeholder}
          value={groupDigits(value)}
          onChange={(e) => onChange(toEnglishDigits(e.target.value).replace(/\D/g, ""))}
        />
        {symbol && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">{symbol}</span>
        )}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1.5">≈ {hint}</p>}
    </div>
  );
}
