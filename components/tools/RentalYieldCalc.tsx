"use client";

import { useState } from "react";
import Link from "next/link";
import { NumberField, CurrencySelect, ResultCard, ResultRow, Currency, num, fmtMoney } from "./calc-ui";

// حاسبة العائد الإيجاري — العائد الإجمالي والصافي، لمقارنة فرص الاستثمار موضوعياً.
export default function RentalYieldCalc() {
  const [cur, setCur] = useState<Currency>("YER");
  const [price, setPrice] = useState("");
  const [rent, setRent] = useState("");
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [expenses, setExpenses] = useState("");

  const p = num(price);
  const annualRent = num(rent) * (period === "month" ? 12 : 1);
  const gross = p > 0 ? (annualRent / p) * 100 : 0;
  const net = p > 0 ? ((annualRent - num(expenses)) / p) * 100 : 0;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="سعر شراء العقار" value={price} onChange={setPrice} suffix={cur} placeholder="0" />
          <CurrencySelect value={cur} onChange={setCur} />
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
          <NumberField label="قيمة الإيجار" value={rent} onChange={setRent} suffix={cur} placeholder="0" />
          <div className="flex rounded-xl border border-muted-200 overflow-hidden text-body">
            <button type="button" onClick={() => setPeriod("month")} className={`px-3 py-2.5 ${period === "month" ? "bg-primary text-white" : "text-muted-600"}`}>شهري</button>
            <button type="button" onClick={() => setPeriod("year")} className={`px-3 py-2.5 ${period === "year" ? "bg-primary text-white" : "text-muted-600"}`}>سنوي</button>
          </div>
        </div>
        <NumberField label="المصاريف السنوية (صيانة، شغور، إدارة…)" value={expenses} onChange={setExpenses} suffix={cur} placeholder="0" hint="لحساب العائد الصافي" />
      </div>

      <div className="grid gap-3 content-start">
        <ResultCard label="العائد الإيجاري الإجمالي" value={`${gross.toFixed(1)}%`} sub={`الإيجار السنويّ: ${fmtMoney(annualRent, cur)}`} />
        <ResultRow label="العائد الصافي (بعد المصاريف)" value={`${net.toFixed(1)}%`} />
        <ResultRow label="صافي الدخل السنويّ" value={fmtMoney(annualRent - num(expenses), cur)} />
        <p className="text-caption text-muted leading-relaxed mt-1">
          قارن بين عدّة عقارات على أساس العائد لا السعر وحده. اقرأ <Link href="/blog/rental-yield-calculate" className="text-primary hover:underline">كيف تحسب العائد الإيجاري</Link> و<Link href="/blog/buy-for-rental-income" className="text-primary hover:underline">الشراء بهدف الدخل الإيجاري</Link>.
        </p>
      </div>
    </div>
  );
}
