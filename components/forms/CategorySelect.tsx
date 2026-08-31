"use client";

/**
 * حقل اختيار التخصّص/التصنيف — يقرأ المرجع المُدار من الخادم بنفسه.
 *
 * ⚠️ **كان منسوخاً في «اطلب خدمة» و«إدارة خدمتي»**: نفس النداء ونفس التسمية
 * ونفس الأنماط. ومعنى النسخ هنا أخطر من التكرار البصريّ: التصنيفات **جدول
 * يديره المشرف**، فأي تغيير في مصدرها أو في شكل استجابتها كان يحتاج تعديلين —
 * ونسيان أحدهما يعني نموذجاً يعرض قائمةً فارغة بلا خطأ ظاهر.
 */

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import type { ServiceCategoryItem, PaginatedResponse } from "@/types";

export function CategorySelect({
  value,
  onChange,
  label = "التخصص",
  required,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}) {
  const [items, setItems] = useState<ServiceCategoryItem[]>([]);

  useEffect(() => {
    api
      .get<PaginatedResponse<ServiceCategoryItem> | ServiceCategoryItem[]>(ep.serviceCategories)
      .then((r) => setItems(Array.isArray(r.data) ? r.data : r.data.results ?? []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className={className}>
      <label className="mb-1.5 block text-caption font-medium text-ink/80">
        {label} {required && <span className="text-danger-600">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="h-11 w-full appearance-none rounded-xl border border-ink/10 bg-white px-4 text-body text-ink outline-none transition-colors focus:border-primary-300"
      >
        <option value="">اختر…</option>
        {items.map((c) => (
          <option key={c.id} value={String(c.id)}>{c.name_ar}</option>
        ))}
      </select>
    </div>
  );
}

export default CategorySelect;
