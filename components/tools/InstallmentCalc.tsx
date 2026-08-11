"use client";

import { useState } from "react";
import Link from "next/link";
import { NumberField, CurrencySelect, ResultCard, ResultRow, Currency, num, fmtMoney } from "./calc-ui";

// حاسبة الأقساط — للبيع بالتقسيط المباشر (نسبة ربح ثابتة اختيارية، لا فائدة مركّبة).
export default function InstallmentCalc() {
  const [cur, setCur] = useState<Currency>("YER");
  const [price, setPrice] = useState("");
  const [down, setDown] = useState("");
  const [months, setMonths] = useState("");
  const [profit, setProfit] = useState("0");

  const remaining = Math.max(0, num(price) - num(down));
  const years = num(months) / 12;
  const profitAmt = remaining * (num(profit) / 100) * years;
  const totalDue = remaining + profitAmt;
  const monthly = num(months) > 0 ? totalDue / num(months) : 0;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="السعر الكلّي للعقار" value={price} onChange={setPrice} suffix={cur} placeholder="0" />
          <CurrencySelect value={cur} onChange={setCur} />
        </div>
        <NumberField label="الدفعة المقدّمة" value={down} onChange={setDown} suffix={cur} placeholder="0" hint="كلّما زادت قلّ القسط" />
        <NumberField label="عدد الأشهر" value={months} onChange={setMonths} suffix="شهر" placeholder="36" />
        <NumberField label="نسبة الربح السنوية (اختياري)" value={profit} onChange={setProfit} suffix="%" hint="ربح ثابت متّفق عليه — اتركها 0 للتقسيط بلا زيادة" />
      </div>

      <div className="grid gap-3 content-start">
        <ResultCard label="القسط الشهريّ" value={fmtMoney(monthly, cur)} sub={num(months) > 0 ? `على مدى ${num(months)} شهرًا` : undefined} />
        <ResultRow label="المبلغ المتبقّي بعد المقدّمة" value={fmtMoney(remaining, cur)} />
        <ResultRow label="إجمالي الربح المضاف" value={fmtMoney(profitAmt, cur)} />
        <ResultRow label="الإجمالي المستحقّ (أقساطًا)" value={fmtMoney(totalDue, cur)} />
        <p className="text-xs text-gray-400 leading-relaxed mt-1">
          وثّق كل بند في العقد. اقرأ <Link href="/blog/buy-in-installments-yemen" className="text-primary hover:underline">الشراء بالتقسيط في اليمن</Link> و<Link href="/blog/mortgage-alternatives-yemen" className="text-primary hover:underline">بدائل تمويل الشراء</Link>.
        </p>
      </div>
    </div>
  );
}
