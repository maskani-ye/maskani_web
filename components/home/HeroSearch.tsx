"use client";

/**
 * بطاقة البحث في صدر الرئيسية.
 *
 * ⚠️ سبب وجودها: الرئيسية كانت بلا **أي** حقل بحث — صفر `input` في الصفحة
 * كلّها — بينما عنوانها يقول «ابحث عن مسكنك المثالي». وكان في الكود تعليقٌ
 * يتيم: `// ─── بطاقة البحث العائمة (بأسلوب Gathern) ───` بلا مكوّنٍ تحته؛
 * شاهدُ قبرٍ لبطاقة خُطّط لها ولم تُكتب.
 *
 * الرئيسية في منصّة عقارية ليست لوحة إعلانات بل **حقل إدخال**: زيلو ورايت‌موف
 * وبيوت وبروبرتي فايندر وعقار — كلّها بلا استثناء تضع البحث في أعلى نقطة،
 * لأنه هو المنتج.
 *
 * تبويبا «للبيع / للإيجار» هنا لا في صفحة النتائج: هو المحور الأهمّ في العقار
 * كلّه، وكان غائباً عن الرئيسية تماماً (يظهر داخل البطاقات فقط). لا نُرسل أي
 * حقل فارغ في الرابط كي يبقى نظيفاً وقابلاً للمشاركة.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Magnifer, MapPoint } from "@solar-icons/react";
import { useCity } from "@/context/CityContext";

const OFFER_TABS = [
  { value: "sale", label: "للبيع" },
  { value: "rent_monthly", label: "للإيجار" },
] as const;

export function HeroSearch() {
  const router = useRouter();
  const { cityId, cities } = useCity();
  const [offer, setOffer] = useState<string>("sale");
  const [city, setCity] = useState<string>("");
  const [q, setQ] = useState("");

  // المدينة المختارة عالمياً هي الافتراضي، ويستطيع المستخدم تجاوزها هنا لبحثٍ
  // واحد بلا تغيير سوقه كلّه.
  const effectiveCity = city || cityId;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (offer) params.set("offer_type", offer);
    if (effectiveCity) params.set("city", effectiveCity);
    const term = q.trim();
    if (term) params.set("search", term);
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl shadow-e4 p-2 sm:p-2.5"
      role="search"
      aria-label="البحث عن عقار"
    >
      {/* التبويبان */}
      <div className="flex gap-1 p-1 bg-cream rounded-xl mb-2" role="tablist">
        {OFFER_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={offer === t.value}
            onClick={() => setOffer(t.value)}
            className={`flex-1 rounded-lg py-2 text-body font-bold transition-colors ${
              offer === t.value
                ? "bg-white text-primary shadow-e1"
                : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {/* المدينة */}
        <div className="relative sm:w-52 flex-shrink-0">
          <MapPoint className="absolute top-1/2 -translate-y-1/2 start-3 h-5 w-5 text-muted pointer-events-none" />
          <select
            value={effectiveCity}
            onChange={(e) => setCity(e.target.value)}
            aria-label="المدينة"
            className="w-full appearance-none rounded-xl border-0 bg-cream ps-10 pe-3 py-3 text-body text-ink outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">كل المدن</option>
            {cities.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name_ar}
              </option>
            ))}
          </select>
        </div>

        {/* الكلمة */}
        <div className="relative flex-1">
          <Magnifer className="absolute top-1/2 -translate-y-1/2 start-3 h-5 w-5 text-muted pointer-events-none" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="شقة، أرض، فيلا، اسم الحي…"
            aria-label="ابحث بالكلمة"
            className="w-full rounded-xl border-0 bg-cream ps-10 pe-3 py-3 text-body text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <button
          type="submit"
          className="rounded-xl bg-primary px-7 py-3 text-body font-bold text-white hover:bg-primary-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Magnifer weight="Bold" className="h-5 w-5 sm:hidden" />
          ابحث
        </button>
      </div>
    </form>
  );
}
