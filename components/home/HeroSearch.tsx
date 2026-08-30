"use client";

/**
 * بحث الصدارة — صفٌّ واحد مضغوط فوق صورة الهيرو.
 *
 * قرارات التصميم:
 * • **صفٌّ واحد لا بطاقة مكوّنة من طبقات**: النسخة السابقة كانت بطاقة بيضاء
 *   ضخمة بتبويبين ممدودين عبر 1340 بكسل ثم صفّ حقول تحتهما — كتلة تبتلع الهيرو.
 *   المنصّات المحترفة تُبقي البحث شريطاً واحداً: القرار الأوّل (بيع/إيجار) شريحتان
 *   صغيرتان فوقه لا تبويبان بعرض الشاشة.
 * • **الحقول بلا حدود**: الفواصل رفيعة داخل سطحٍ واحد — مظهر «شريط بحث» لا
 *   «نموذج إدخال».
 * • تُسلَّم القيم إلى `/properties` التي تقرأ `offer_type` و`city` و`search`.
 */
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Magnifer, AltArrowDown, MapPoint } from "@solar-icons/react";
import { useCity } from "@/context/CityContext";
import { marketPath, splitMarket } from "@/lib/markets";
import { useCountry } from "@/context/CountryContext";

const OFFER_TABS = [
  { value: "sale", label: "للبيع" },
  { value: "rent_monthly", label: "للإيجار" },
] as const;

export function HeroSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const { market } = splitMarket(pathname || "/");
  const { cityId, cities, setCity } = useCity();
  // ⚠️ لا يُقرأ رمز السوق هنا: البحث يقع **داخل** السوق الذي يحدّده المسار،
  // والوجهة تحمل بادئته. (كان الحقل يسمح بتبديل الدولة فيتناقض مع العنوان.)
  const [offer, setOffer] = useState<string>("sale");
  const [q, setQ] = useState("");

  /**
   * ⚠️ **الحقلان يكتبان في التخزين المحلّي، لا في حالةٍ عابرة.**
   *
   * كان حقل المدينة هنا `useState` محلّياً بينما حقل الدولة يكتب في السياق —
   * فتناقضٌ صريح: يبدّل المستخدم الدولة فتُحفظ، ويبدّل المدينة فتُنسى عند أوّل
   * تنقّل، ويبقى الشريط العلوي يعرض المدينة القديمة. اختيار المدينة تفضيلُ
   * جهازٍ يدوم عبر الجلسات (نفس عقد التطبيق) لا فلتر بحثٍ لمرّة واحدة، فمصدره
   * `CityContext` وحده — مصدرٌ واحد يراه الشريط والرئيسية وكل القوائم.
   */
  const onCity = (id: string) => {
    setCity(id, cities.find((c) => String(c.id) === id)?.name_ar ?? "");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (offer) params.set("offer_type", offer);
    if (cityId) params.set("city", cityId);
    const term = q.trim();
    if (term) params.set("search", term);
    // الوجهة داخل السوق الحاليّ — بلا بادئة يقع تحويلٌ من الحافة يُخرج الزائر.
    router.push(`${marketPath(market ?? "", "properties")}?${params.toString()}`);
  };

  return (
    <div>
      {/* القرار الأوّل — شريحتان صغيرتان فوق الشريط، لا تبويبان بعرض الشاشة */}
      <div className="flex gap-2 mb-3" role="tablist" aria-label="نوع العرض">
        {OFFER_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={offer === t.value}
            onClick={() => setOffer(t.value)}
            className={`rounded-full px-5 py-2 text-caption font-bold transition-colors ${
              offer === t.value
                ? "bg-white text-ink"
                : "bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={submit}
        role="search"
        aria-label="البحث عن عقار"
        className="flex flex-col md:flex-row items-stretch bg-white rounded-2xl shadow-e4 p-1.5 gap-1.5"
      >
        {/* ⚠️ **حقل الدولة حُذف من الفلترة نهائياً.** صار السوق في **المسار**
            (`/sa/properties`) ويُبدَّل من الناف بار بفتح صفحة السوق الآخر. وجود
            حقل دولة داخل الفلاتر يعني مالكاً ثانياً للسوق يناقض العنوان: يختار
            المستخدم «مصر» في الحقل فيبقى العنوان `/sa` والمحتوى مصريّاً —
            رابطٌ يكذب على من يُشارَك معه. الفلاتر تسأل عمّا **داخل** السوق فقط. */}
        {/* المؤشّران ضروريّان: `appearance-none` يجرّد الـselect من كل ما يقول
            إنه قابل للفتح، فيبدو سطراً نصّياً لا حقلاً — وهو ما بدا عليه على
            الجوّال. الدبّوس يسمّي الحقل والسهم يقول إنه قائمة. */}
        <label className="md:w-40 flex-shrink-0 relative">
          <span className="sr-only">المدينة</span>
          <MapPoint className="absolute top-1/2 -translate-y-1/2 start-3.5 h-5 w-5 text-muted pointer-events-none" />
          <AltArrowDown className="absolute top-1/2 -translate-y-1/2 end-3 h-4 w-4 text-muted pointer-events-none" />
          <select
            value={cityId}
            onChange={(e) => onCity(e.target.value)}
            className="w-full h-12 appearance-none rounded-xl border-0 bg-transparent ps-11 pe-9 text-body font-semibold text-ink outline-none focus:bg-cream transition-colors cursor-pointer"
          >
            <option value="">كل المدن</option>
            {cities.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name_ar}
              </option>
            ))}
          </select>
        </label>

        <span aria-hidden className="h-px mx-2 md:h-auto md:w-px md:my-2 md:mx-0 bg-ink/10" />

        <label className="flex-1 relative">
          <span className="sr-only">ابحث بالكلمة</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="شقة، أرض، فيلا، اسم الحي…"
            className="w-full h-12 rounded-xl border-0 bg-transparent px-4 text-body text-ink placeholder:text-muted outline-none focus:bg-cream transition-colors"
          />
        </label>

        <button
          type="submit"
          className="h-12 rounded-xl bg-primary px-6 md:px-8 text-body font-bold text-white hover:bg-primary-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 flex-shrink-0"
        >
          <Magnifer weight="Bold" className="h-5 w-5" />
          ابحث
        </button>
      </form>
    </div>
  );
}
