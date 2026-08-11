"use client";

// عناصر واجهة مشتركة للحاسبات — حقل رقميّ، اختيار العملة، وبطاقة النتيجة.
import { ReactNode } from "react";

export const CURRENCIES = ["YER", "SAR", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];
const CUR_LABEL: Record<Currency, string> = { YER: "ريال يمني", SAR: "ريال سعودي", USD: "دولار" };

/** رقم مُنسّق بفواصل الآلاف + رمز/تسمية اختيارية. */
export function fmtNum(n: number, digits = 0): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}
export function fmtMoney(n: number, cur: Currency): string {
  if (!isFinite(n)) return "—";
  return `${fmtNum(Math.round(n))} ${cur === "YER" ? "ر.ي" : cur === "SAR" ? "ر.س" : "$"}`;
}

/** يحوّل نصّ إدخال إلى رقم (يتجاهل الفواصل)، صفر إن فارغ. */
export function num(v: string): number {
  const n = parseFloat((v || "").replace(/,/g, ""));
  return isFinite(n) ? n : 0;
}

export function NumberField({
  label, value, onChange, suffix, placeholder, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <div className="relative">
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
        />
        {suffix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{suffix}</span>
        )}
      </div>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

export function CurrencySelect({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-gray-700">العملة</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Currency)}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>{CUR_LABEL[c]}</option>
        ))}
      </select>
    </label>
  );
}

/** بطاقة النتيجة الرئيسية (بنفسجية). */
export function ResultCard({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-700 text-white p-5 text-center">
      <p className="text-sm text-white/80 mb-1">{label}</p>
      <p className="text-3xl font-extrabold tracking-tight" dir="ltr">{value}</p>
      {sub && <div className="mt-2 text-sm text-white/85">{sub}</div>}
    </div>
  );
}

/** صفّ نتيجة ثانويّ. */
export function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-cream px-4 py-2.5">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-bold text-ink" dir="ltr">{value}</span>
    </div>
  );
}
