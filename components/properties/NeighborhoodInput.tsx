"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/Input";

interface Neighborhood {
  id: number;
  name: string;
}

/** حقل الحيّ — يقترح الأحياء المسجّلة في المحافظة **ولا يمنع** الكتابة الحرّة.
 *
 *  لا توجد قائمة أحياء رسمية شاملة لليمن؛ إجبار الناشر على الاختيار من قائمة
 *  ناقصة يمنعه من النشر. فحين يطابق المكتوبُ حيًّا مسجّلًا نُرسل مرجعه (فتعمل
 *  الفلترة والتصفّح)، وإلا يُرسَل الاسم نصًّا كما هو. */
export function NeighborhoodInput({
  cityId,
  value,
  onChange,
}: {
  cityId: string;
  value: string;
  onChange: (name: string, refId: string) => void;
}) {
  const [options, setOptions] = useState<Neighborhood[]>([]);

  useEffect(() => {
    if (!cityId) { setOptions([]); return; }
    let alive = true;
    api
      .get<Neighborhood[] | { results: Neighborhood[] }>("/cities/neighborhoods/", {
        params: { city: cityId },
      })
      .then((r) => {
        if (!alive) return;
        const list = Array.isArray(r.data) ? r.data : r.data.results ?? [];
        setOptions(list);
      })
      .catch(() => { if (alive) setOptions([]); });
    return () => { alive = false; };
  }, [cityId]);

  // مطابقة متساهلة: المسافات الزائدة لا تُفقد الربط بالحيّ المسجّل.
  const norm = (s: string) => s.trim().replace(/\s+/g, " ");

  const handle = (raw: string) => {
    const match = options.find((o) => norm(o.name) === norm(raw));
    onChange(raw, match ? String(match.id) : "");
  };

  return (
    <div>
      <Input
        label="الحي"
        placeholder={options.length ? "اكتب أو اختر من القائمة" : "اسم الحي"}
        value={value}
        onChange={(e) => handle(e.target.value)}
        list="neighborhood-options"
      />
      <datalist id="neighborhood-options">
        {options.map((o) => (
          <option key={o.id} value={o.name} />
        ))}
      </datalist>
    </div>
  );
}
