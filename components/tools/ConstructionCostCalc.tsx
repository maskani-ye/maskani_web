"use client";

import { useState } from "react";
import Link from "next/link";
import { NumberField, CurrencySelect, ResultCard, ResultRow, Currency, num, fmtMoney } from "./calc-ui";

// حاسبة تكلفة البناء — الأسعار يُدخلها المستخدم (تتقلّب وتختلف بالمنطقة)، فالنتيجة
// دقيقة بقدر مدخلاته. تفصّل العظم + التشطيب + البنود الإضافية + هامش الطوارئ.
export default function ConstructionCostCalc() {
  const [cur, setCur] = useState<Currency>("YER");
  const [area, setArea] = useState("");
  const [shell, setShell] = useState("");
  const [finish, setFinish] = useState("");
  const [extras, setExtras] = useState("");
  const [contingency, setContingency] = useState("12");

  const a = num(area);
  const shellCost = a * num(shell);
  const finishCost = a * num(finish);
  const base = shellCost + finishCost + num(extras);
  const contAmt = base * (num(contingency) / 100);
  const total = base + contAmt;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="مساحة البناء الكلّية" value={area} onChange={setArea} suffix="م²" placeholder="300" hint="مجموع مساحات كل الأدوار" />
          <CurrencySelect value={cur} onChange={setCur} />
        </div>
        <NumberField label="سعر متر العظم (الهيكل)" value={shell} onChange={setShell} suffix={`/م²`} hint="الأساسات والأعمدة والأسقف من الخرسانة المسلّحة" />
        <NumberField label="سعر متر التشطيب" value={finish} onChange={setFinish} suffix={`/م²`} hint="القصارة والبلاط والدهان والأبواب والصحّية والكهرباء" />
        <NumberField label="بنود إضافية (خدمات، عزل، طاقة شمسية…)" value={extras} onChange={setExtras} suffix={cur} placeholder="0" />
        <NumberField label="هامش الطوارئ" value={contingency} onChange={setContingency} suffix="%" hint="يُنصح بـ10–15% لتقلّب الأسعار والمفاجآت" />
      </div>

      <div className="grid gap-3 content-start">
        <ResultCard label="التكلفة التقديرية الإجمالية" value={fmtMoney(total, cur)} sub={a > 0 ? `≈ ${fmtMoney(total / a, cur)} للمتر المربّع` : undefined} />
        <ResultRow label="تكلفة العظم" value={fmtMoney(shellCost, cur)} />
        <ResultRow label="تكلفة التشطيب" value={fmtMoney(finishCost, cur)} />
        <ResultRow label="بنود إضافية" value={fmtMoney(num(extras), cur)} />
        <ResultRow label={`هامش الطوارئ (${num(contingency)}%)`} value={fmtMoney(contAmt, cur)} />
        <p className="text-caption text-muted leading-relaxed mt-1">
          الأرقام تقديرية بناءً على مدخلاتك. الأسعار تتقلّب وتختلف بالمنطقة ومستوى التشطيب — للتقدير الأدقّ استشر مقاولاً.
          اقرأ <Link href="/blog/estimate-construction-cost-yemen" className="text-primary hover:underline">كيف تقدّر تكلفة البناء</Link>.
        </p>
      </div>
    </div>
  );
}
