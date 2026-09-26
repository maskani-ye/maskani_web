import type { Metadata } from "next";
import Link from "next/link";
import { fetchRetry } from "@/lib/fetchRetry";
import { formatNumber } from "@/lib/utils";
import { Buildings3, Global, ChartSquare, Phone, InfoCircle } from "@solar-icons/react";

/**
 * صفحة المستثمرين — تعريفٌ ودعوة تواصل، **لا عرض استثمار**.
 *
 * ⚠️ **الفرق بينهما ليس لغوياً.** صفحةٌ تَعِد بعائد أو تطلب مالاً بشروطٍ محدّدة
 * تدخل في نطاق عرض الأوراق المالية، وهو منظَّمٌ قانوناً في كل سوقٍ نعمل فيه.
 * فلا رقم عائدٍ هنا، ولا توقّعات، ولا «استثمر الآن» — تعريفٌ بما بُني، وأرقامٌ
 * يمكن التحقّق منها، وطريقة تواصل. التفاوض يقع خارج الموقع.
 *
 * ⚠️ **ولا رقم بلا مصدر.** ما يُجلب حيّاً من الـAPI يبقى صحيحاً أبداً؛ وما
 * قِيس مرّة (البحث والزوّار) يُذكر **بتاريخ قياسه**. رقمٌ بلا تاريخ يتحوّل
 * إلى ادّعاءٍ كاذب بمرور الوقت بلا أن يلمسه أحد.
 *
 * ⚠️ **وقسم «ما لم يتحقّق بعد» مقصود ولا يُحذف.** إخفاء ضعف الطلب مع إبراز
 * سبعة آلاف عقار تضليلٌ بالانتقاء: أغلب المعروض مستورَد، والتفاعل مبكّر.
 * والمستثمر الجادّ يكتشف ذلك في أوّل اجتماع — فالصدق هنا يحمي الطرفين.
 */

export const revalidate = 3600;

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";
const SITE_URL = "https://maskani.homes";

//: تاريخ قياس الأرقام غير الحيّة — يُحدَّث يدوياً مع تحديثها.
const MEASURED_ON = "٢٥ سبتمبر ٢٠٢٦";

export const metadata: Metadata = {
  title: { absolute: "للمستثمرين | مسكني" },
  description:
    "مسكني — منصّة عقارية اجتماعية تغطّي ستّة أسواق عربية. تعريف بالمنصّة وأرقامها "
    + "الحالية وطريقة التواصل مع الفريق.",
  alternates: { canonical: `${SITE_URL}/investors` },
};

interface Country { name_ar: string; properties_count?: number; cities?: unknown[] }

async function getMarkets(): Promise<Country[]> {
  try {
    const res = await fetchRetry(`${API}/cities/countries/?limit=20`, {
      next: { revalidate: 3600 },
    });
    if (!res || !res.ok) return [];
    return (await res.json()).results ?? [];
  } catch {
    return [];
  }
}

async function getPhone(): Promise<string> {
  try {
    const res = await fetchRetry(`${API}/settings/app-config/`, { next: { revalidate: 3600 } });
    if (!res || !res.ok) return "";
    return ((await res.json()).general_phone || "").trim();
  } catch {
    return "";
  }
}

function Stat({ value, label, hint }: { value: string; label: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-muted-100 bg-white p-5">
      <div className="text-h3 font-bold text-primary">{value}</div>
      <div className="text-body font-semibold text-ink mt-1">{label}</div>
      {hint && <div className="text-caption text-muted-500 mt-1">{hint}</div>}
    </div>
  );
}

export default async function InvestorsPage() {
  const [markets, phone] = await Promise.all([getMarkets(), getPhone()]);
  const listings = markets.reduce((s, c) => s + (c.properties_count ?? 0), 0);
  const cities = markets.reduce((s, c) => s + (c.cities?.length ?? 0), 0);
  const digits = phone.replace(/\D/g, "");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <header>
        <h1 className="text-h2 sm:text-h1 font-bold text-ink">للمستثمرين</h1>
        <p className="text-body-lg text-muted-600 mt-3 leading-relaxed">
          مسكني منصّة عقارية تربط صاحب العقار بالباحث عنه مباشرةً — بلا وسيطٍ
          وبلا عمولة. نعمل اليوم في ستّة أسواق عربية، والمنصّة في مرحلة مبكّرة:
          المنتج مبنيّ ويعمل، والنموّ في بدايته.
        </p>
      </header>

      {/* ① أرقام حيّة — تُقرأ من المنصّة عند كل تحديث للصفحة */}
      <section>
        <h2 className="text-h3 font-bold text-ink mb-1 flex items-center gap-2">
          <Buildings3 className="h-5 w-5 text-primary" /> أرقام المنصّة الآن
        </h2>
        <p className="text-caption text-muted-500 mb-4">
          تُقرأ مباشرةً من قاعدة بيانات المنصّة، فهي صحيحة لحظة قراءتك.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat value={formatNumber(markets.length)} label="أسواق" hint="اليمن · السعودية · الأردن · مصر · العراق · عُمان" />
          <Stat value={formatNumber(cities)} label="مدينة ومحافظة" />
          <Stat value={formatNumber(listings)} label="عقار معروض" />
          <Stat value="٣" label="تطبيقات ومنصّات" hint="ويب · تطبيق المستخدمين · تطبيق الإدارة" />
        </div>
      </section>

      {/* ② أرقام مقيسة — بتاريخها */}
      <section>
        <h2 className="text-h3 font-bold text-ink mb-1 flex items-center gap-2">
          <ChartSquare className="h-5 w-5 text-primary" /> الظهور في البحث
        </h2>
        <p className="text-caption text-muted-500 mb-4">
          مقيسة من Google Search Console — آخر ثلاثين يوماً حتى {MEASURED_ON}.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat value="٥٠٬٩٧٨" label="ظهور في نتائج البحث" hint="مقابل ١٠٬٦٣٤ في الثلاثين السابقة" />
          <Stat value="٦٥٤" label="نقرة من البحث" hint="مقابل ١١٣ في الثلاثين السابقة" />
          <Stat value="٣٬٢٦٥" label="زائر متفرّد" hint="ثلاثون يوماً" />
          <Stat value="٨٢٦" label="صفحة محتوى" hint="١٠٥ مقالات + ٧٢١ صفحة مدينة وحيّ" />
        </div>
      </section>

      {/* ③ ما بُني */}
      <section>
        <h2 className="text-h3 font-bold text-ink mb-3 flex items-center gap-2">
          <Global className="h-5 w-5 text-primary" /> ما بُني حتى الآن
        </h2>
        <ul className="space-y-2 text-body text-muted-600 leading-relaxed">
          <li>• موقع ويب وتطبيقا أندرويد (للمستخدمين وللإدارة) ولوحة تحكّم كاملة.</li>
          <li>• عرض العقارات والخدمات والطلبات، ومحادثات فورية داخل المنصّة.</li>
          <li>• بيانات جغرافية لستّة أسواق: {formatNumber(cities)} مدينة ومحافظة وآلاف الأحياء.</li>
          <li>• أدوات ومحتوى عربيّ: حاسبات عقارية، أدلّة مدن، ومؤشّرات أسعار محسوبة من المعروض.</li>
          <li>• بنية تشغيل مستقلّة: خوادم وقاعدة بيانات ووسائط ورصد أعطال.</li>
        </ul>
      </section>

      {/* ④ الصدق الذي يحمي الطرفين */}
      <section className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <h2 className="text-h3 font-bold text-ink mb-3 flex items-center gap-2">
          <InfoCircle className="h-5 w-5 text-gold-700" /> ما لم يتحقّق بعد
        </h2>
        <ul className="space-y-2 text-body text-muted-700 leading-relaxed">
          <li>
            • <strong className="text-ink">أغلب المعروض مُستورَد</strong> من مصادر
            عامّة لبناء المحتوى الأوّليّ، لا منشوراً من ملّاك مسجّلين.
          </li>
          <li>
            • <strong className="text-ink">التفاعل في بدايته</strong>: عدد
            المستخدمين المسجّلين والمحادثات داخل المنصّة ما يزال صغيراً.
          </li>
          <li>
            • <strong className="text-ink">لا إيرادات تُذكر بعد.</strong> النموذج
            المخطّط إعلانيّ، ولا توجد عمولات ولا بوابة دفع.
          </li>
        </ul>
        <p className="text-caption text-muted-600 mt-3">
          نذكر هذا صراحةً لأنّ إبراز عدد العقارات وحده يُعطي صورةً غير صحيحة.
        </p>
      </section>

      {/* ⑤ التواصل */}
      <section>
        <h2 className="text-h3 font-bold text-ink mb-3 flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" /> للتواصل
        </h2>
        <p className="text-body text-muted-600 leading-relaxed mb-4">
          للاستفسار أو طلب لقاء، تواصل مع الفريق مباشرةً. أيّ ترتيبٍ ماليّ
          يُناقَش في قناة خاصّة، ولا يُعرض على هذه الصفحة.
        </p>
        <div className="flex flex-wrap gap-3">
          {phone && (
            <>
              <a href={`tel:${phone}`}
                 className="rounded-xl bg-primary text-white px-5 py-2.5 text-body font-semibold">
                اتصال — <span dir="ltr">{phone}</span>
              </a>
              {digits && (
                <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer"
                   className="rounded-xl border border-muted-200 bg-white px-5 py-2.5 text-body font-semibold text-ink">
                  واتساب
                </a>
              )}
            </>
          )}
          <Link href="/contact"
                className="rounded-xl border border-muted-200 bg-white px-5 py-2.5 text-body font-semibold text-ink">
            صفحة التواصل
          </Link>
          <Link href="/about"
                className="rounded-xl border border-muted-200 bg-white px-5 py-2.5 text-body font-semibold text-ink">
            من نحن
          </Link>
        </div>
      </section>

      <p className="text-micro text-muted border-t border-muted-100 pt-4">
        هذه الصفحة تعريفية ولا تُعدّ دعوةً للاكتتاب ولا عرضاً لبيع حصّة، ولا
        تتضمّن وعداً بعائد. الأرقام الحيّة تُقرأ من المنصّة، والمقيسة بتاريخ{" "}
        {MEASURED_ON}.
      </p>
    </div>
  );
}
