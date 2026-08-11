"use client";

import { useState } from "react";
import Link from "next/link";
import { NumberField, CurrencySelect, ResultCard, ResultRow, Currency, num, fmtMoney } from "./calc-ui";

// حاسبة القدرة على الإيجار — أقصى إيجار مريح بناءً على الدخل ونسبة الإنفاق.
export default function RentAffordabilityCalc() {
  const [cur, setCur] = useState<Currency>("YER");
  const [income, setIncome] = useState("");
  const [ratio, setRatio] = useState("30");

  const inc = num(income);
  const r = num(ratio) / 100;
  const maxMonthly = inc * r;
  const maxYearly = maxMonthly * 12;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="دخلك الشهريّ" value={income} onChange={setIncome} suffix={cur} placeholder="0" />
          <CurrencySelect value={cur} onChange={setCur} />
        </div>
        <NumberField label="نسبة الإنفاق على السكن" value={ratio} onChange={setRatio} suffix="%" hint="القاعدة الشائعة ألّا يتجاوز الإيجار 30% من الدخل" />
        <div className="flex gap-2">
          {[25, 30, 35].map((v) => (
            <button key={v} type="button" onClick={() => setRatio(String(v))}
              className={`flex-1 rounded-xl border py-2 text-sm ${num(ratio) === v ? "border-primary bg-primary/5 text-primary font-bold" : "border-gray-200 text-gray-600"}`}>
              {v}%
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 content-start">
        <ResultCard label="أقصى إيجار شهريّ مريح" value={fmtMoney(maxMonthly, cur)} sub={`سنوياً: ${fmtMoney(maxYearly, cur)}`} />
        <ResultRow label={`نسبة الإنفاق المختارة`} value={`${num(ratio)}%`} />
        <ResultRow label="المتبقّي من الدخل بعد الإيجار" value={fmtMoney(inc - maxMonthly, cur)} />
        <p className="text-xs text-gray-400 leading-relaxed mt-1">
          إرشاديّ لموازنة ميزانيتك السكنية. اقرأ <Link href="/blog/first-apartment-checklist" className="text-primary hover:underline">قائمة تجهيز أول شقّة إيجار</Link> و<Link href="/blog/yemen-renting-guide" className="text-primary hover:underline">دليل الاستئجار في اليمن</Link>.
        </p>
      </div>
    </div>
  );
}
