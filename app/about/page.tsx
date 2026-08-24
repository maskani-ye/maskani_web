import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "من نحن — مسكني",
  description:
    "مسكني منصّة عقارية عربية تربط صاحب العقار بالباحث عنه مباشرةً بلا وسيط وبلا عمولة، في اليمن والسعودية والأردن ومصر والعراق.",
  alternates: { canonical: "/about" },
};

export const revalidate = 86400;

/**
 * صفحة «من نحن».
 *
 * ليست حشواً: مراجعة الناشرين (AdSense) وزوّار السوق العقاريّ كلاهما يسأل «من
 * يقف خلف هذا الموقع؟» — وغياب الجواب إشارةُ عدم شفافية في سوقٍ الاحتيال فيه
 * همٌّ يوميّ. فالصفحة تخدم الثقة أولاً، والمراجعة تبعاً.
 */
export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mb-3">من نحن</h1>
        <p className="text-gray-600 leading-relaxed">
          <strong>مسكني</strong> منصّة عقارية عربية تصل صاحب العقار بالباحث عنه
          مباشرةً — بلا وسيط، وبلا عمولة، وبلا بوّابة دفع. تنشر عقارك أو خدمتك أو
          طلبك، فيراك من يبحث عنه في مدينتك ويتواصل معك على رقمك.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-ink">ما الذي نحلّه</h2>
        <p className="text-gray-600 leading-relaxed">
          السوق العقاريّ العربيّ يعيش في مجموعات التواصل: إعلانات مكرّرة، وأسعار
          بلا مرجع، ووسطاء بين المالك والباحث يرفعون الكلفة على الطرفين، واحتيالٌ
          يصعب تمييزه. بنينا مسكني على ثلاثة أسس:
        </p>
        <ul className="space-y-2 text-gray-600 leading-relaxed list-disc ps-6">
          <li>
            <strong>تواصل مباشر:</strong> رقم صاحب العقار ظاهر، والمراسلة داخل
            المنصّة — لا سمسار ولا عمولة.
          </li>
          <li>
            <strong>إشارات ثقة:</strong> توثيق الحساب، وعمر الحساب، ومؤشّر سرعة
            الردّ، و<Link href="/reports" className="text-primary hover:underline">بلاغات الاحتيال</Link>{" "}
            التي يكتبها المستخدمون ويصوّت عليها غيرهم.
          </li>
          <li>
            <strong>أسعار قابلة للمقارنة:</strong> كل مبلغ يُقارَن بقيمته المرجعية
            بالدولار، فلا يُقاس مليون ريال يمنيّ بألف دينار أردنيّ.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-ink">أين نعمل</h2>
        <p className="text-gray-600 leading-relaxed">
          نغطّي خمسة أسواق بمدنها وأحيائها:{" "}
          <Link href="/properties/country/yemen" className="text-primary hover:underline">اليمن</Link> ·{" "}
          <Link href="/properties/country/saudi-arabia" className="text-primary hover:underline">السعودية</Link> ·{" "}
          <Link href="/properties/country/jordan" className="text-primary hover:underline">الأردن</Link> ·{" "}
          <Link href="/properties/country/egypt" className="text-primary hover:underline">مصر</Link> ·{" "}
          <Link href="/properties/country/iraq" className="text-primary hover:underline">العراق</Link>
          {" "}— لكلٍّ منها عملته ووحدات مساحته ومصطلحاته العقارية، لأن سوقاً لا
          يُقاس بمقاييس سوقٍ آخر.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-ink">ماذا نقدّم</h2>
        <ul className="space-y-2 text-gray-600 leading-relaxed list-disc ps-6">
          <li>نشر العقارات وتصفّحها بالفلترة والخريطة والبحث الذكيّ.</li>
          <li>طلبات الباحثين، فيصل الطلب إلى ملّاك العقارات المطابقة.</li>
          <li>مزوّدو الخدمات العقارية (صيانة · نقل · تشطيب) وتقييماتهم.</li>
          <li>
            <Link href="/tools" className="text-primary hover:underline">أدوات حسابية</Link>{" "}
            (محوّل المساحات · تكلفة البناء · العائد الإيجاري) و
            <Link href="/blog" className="text-primary hover:underline">مدونة</Link>{" "}
            بمحتوى محلّيّ لكل سوق.
          </li>
        </ul>
      </section>

      <section className="rounded-2xl bg-cream border border-gray-100 p-5">
        <h2 className="text-lg font-bold text-ink mb-2">للتواصل</h2>
        <p className="text-gray-600 leading-relaxed">
          للاستفسارات والملاحظات وطلبات إزالة المحتوى:{" "}
          <Link href="/contact" className="text-primary font-semibold hover:underline">
            صفحة التواصل
          </Link>
          . ولمعرفة كيف نتعامل مع بياناتك اقرأ{" "}
          <Link href="/privacy" className="text-primary hover:underline">سياسة الخصوصية</Link>{" "}
          و<Link href="/terms" className="text-primary hover:underline">شروط الاستخدام</Link>.
        </p>
      </section>
    </div>
  );
}
