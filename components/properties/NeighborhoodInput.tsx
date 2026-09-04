"use client";

/**
 * حقل الحيّ — **قائمة يُختار منها**، والكتابة الحرّة تبقى مفتوحة.
 *
 * ⚠️ **كان `datalist`**: قائمةٌ لا يراها المستخدم حتى يبدأ الكتابة، ولا يعرف
 * أصلاً أنّ لمدينته أحياء مسجّلة. وعلى iOS لا تظهر إطلاقاً في أغلب النسخ.
 * فالناشر يكتب «الفيصلية» بإملائه، فلا تُطابق `حي الفيصلية` المسجّل، فيُرسَل
 * نصّاً بلا مرجع — **فلا تظهر عقاراته في صفحة حيّه ولا في فلتر الحيّ**، وهي
 * الصفحات التي يصلنا منها زوّار مصر من بحث جوجل.
 *
 * الآن: نقرةٌ تفتح القائمة كاملةً مرتّبةً بعدد العقارات، والكتابة تُصفّيها،
 * والاختيار يربط المرجع. ومن لا يجد حيّه يكتبه ويمضي — **الحقل اختياريّ**
 * ولا قائمة أحياء رسمية شاملة لكل أسواقنا.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { formatNumber } from "@/lib/utils";

interface Neighborhood {
  id: number;
  name: string;
  properties_count?: number;
}

/** مطابقة متساهلة: «حي الفيصلية» و«الفيصلية» و«  الفيصلية » شيءٌ واحد. */
const norm = (s: string) =>
  s.trim().replace(/\s+/g, " ").replace(/^حي\s+/, "").replace(/[أإآ]/g, "ا");

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
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

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
        // الأكثر عقاراتٍ أوّلاً: أحياء المدينة قد تبلغ المئات، والذي يُنشَر فيه
        // فعلاً هو الذي يبحث عنه الناشر غالباً.
        setOptions([...list].sort((a, b) => (b.properties_count ?? 0) - (a.properties_count ?? 0)));
      })
      .catch(() => { if (alive) setOptions([]); });
    return () => { alive = false; };
  }, [cityId]);

  // إغلاق القائمة بالنقر خارجها — لوحةٌ عائمة لا تُغلق تحجب الحقل الذي بعدها.
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const shown = useMemo(() => {
    const q = norm(value);
    const list = q ? options.filter((o) => norm(o.name).includes(q)) : options;
    return list.slice(0, 60);
  }, [options, value]);

  const pick = (o: Neighborhood) => {
    onChange(o.name, String(o.id));
    setOpen(false);
  };

  const handle = (raw: string) => {
    const match = options.find((o) => norm(o.name) === norm(raw));
    onChange(raw, match ? String(match.id) : "");
    setOpen(true);
  };

  const linked = options.some((o) => norm(o.name) === norm(value)) && value.trim() !== "";

  return (
    <div ref={box} className="relative">
      <Input
        label="الحي (اختياري)"
        placeholder={
          !cityId ? "اختر المدينة أوّلاً"
            : options.length ? "اختر من القائمة أو اكتب"
              : "اسم الحي"
        }
        value={value}
        disabled={!cityId}
        onFocus={() => setOpen(true)}
        onChange={(e) => handle(e.target.value)}
        autoComplete="off"
      />

      {/* إشارةٌ صامتة أنّ الحيّ ارتبط بسجلّه — فيعرف الناشر أنّ عقاره سيظهر في
          صفحة الحيّ، وهي أقوى صفحاتنا في البحث. */}
      {linked && (
        <span className="pointer-events-none absolute end-3 top-[2.4rem] text-micro font-bold text-success-600">
          ✓ مرتبط
        </span>
      )}

      {open && cityId && shown.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-muted-200 bg-white py-1 shadow-e3"
        >
          {shown.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => pick(o)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-start text-body text-ink hover:bg-primary-50"
              >
                <span className="truncate">{o.name}</span>
                {!!o.properties_count && (
                  <span className="shrink-0 text-micro text-muted">
                    {formatNumber(o.properties_count)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
