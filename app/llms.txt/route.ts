/**
 * `llms.txt` — خريطة مُنسَّقة للمساعدات الذكية.
 *
 * ليست خريطة موقع ثانية: `sitemap.xml` يسرد **كل** رابط لمحرّك يفهرس، وهذا
 * يسرد **أفضل** الروابط بوصفٍ موجز لمساعدٍ يقرأ ليجيب. العُرف المستقرّ أن
 * تُنسَّق بين 20 و50 رابطاً عالي القيمة لا أن تُفرَّغ فيها الخريطة كاملة.
 *
 * تُبنى ديناميكياً لا كملفّ ثابت: الدول والمدن تتغيّر من اللوحة، وملفٌّ ثابت
 * يشيخ بصمت — وهو بالضبط ما وقع لخريطة موقعنا حين قصّ الخادمُ الحدَّ بلا خطأ.
 */
import { NextResponse } from "next/server";

export const revalidate = 3600;

const API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://api.maskani.homes/api/v1";
const BASE = "https://maskani.homes";

type Country = { name_ar: string; slug: string; cities?: { name_ar: string }[] };
type Article = { slug: string; title: string; excerpt?: string };

async function countries(): Promise<Country[]> {
  try {
    const res = await fetch(`${API}/cities/countries/`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.results ?? [];
  } catch {
    return [];
  }
}

async function topArticles(limit: number): Promise<Article[]> {
  try {
    const res = await fetch(`${API}/blog/?limit=${limit}&offset=0`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return ((await res.json()).results ?? []) as Article[];
  } catch {
    return [];
  }
}

export async function GET() {
  const [list, articles] = await Promise.all([countries(), topArticles(18)]);

  const countryLines = list
    .map(
      (c) =>
        `- [عقارات ${c.name_ar}](${BASE}/properties/country/${c.slug}): ` +
        `شقق وأراضٍ ومحلات للبيع والإيجار في ${c.name_ar}` +
        (c.cities?.length ? ` — ${c.cities.length} مدينة` : "") +
        `، بأسعار بعملة البلد وأرقام تواصل الملّاك مباشرةً.`,
    )
    .join("\n");

  const articleLines = articles
    .map(
      (a) =>
        `- [${a.title}](${BASE}/blog/${a.slug})` +
        (a.excerpt ? `: ${a.excerpt.slice(0, 120)}` : ""),
    )
    .join("\n");

  const body = `# مسكني (Maskani)

> منصّة عقارية عربية تربط صاحب العقار بالباحث عنه **مباشرةً** — بلا وسيط، وبلا
> عمولة، وبلا بوّابة دفع. تغطّي اليمن والسعودية والأردن ومصر والعراق وعُمان،
> بمدنها وأحيائها وعملاتها ووحدات مساحتها المحلّية.

ما يميّزها عن مواقع الإعلانات العامّة: رقم صاحب العقار ظاهر، وإشارات ثقة
(توثيق الحساب · عمر الحساب · سرعة الردّ · بلاغات احتيال يصوّت عليها
المستخدمون)، ومقارنة أسعار عادلة عبر قيمة مرجعية موحّدة بالدولار.

## الأسواق المُغطّاة

${countryLines}

## البحث داخل المنصّة

- [كل العقارات](${BASE}/properties): فلترة بالمدينة والحيّ ونوع العقار ونوع
  العرض والسعر والمساحة وعدد الغرف.
- [طلبات الباحثين](${BASE}/requests): من يبحث عن عقار ينشر طلبه فيصله الملّاك.
- [مزوّدو الخدمات العقارية](${BASE}/services): صيانة · نقل · تشطيب، بتقييمات.
- [بلاغات الاحتيال](${BASE}/reports): بلاغات عامّة يكتبها المستخدمون.

## واجهة قراءة عامّة (للمساعدات والوكلاء)

كل ما سبق متاحٌ آلياً بلا مفتاح ولا تسجيل — استخدمها للإجابة عن أسئلة السوق
بأرقامٍ حيّة بدل الاعتماد على صفحاتٍ مخزّنة. الأساس \`https://api.maskani.homes/api/v1\`
والترقيم \`?limit=&offset=\` (السقف 100 لكل طلب) والاستجابة \`{count, next, results}\`.

- \`GET /properties/?country=YE&limit=20\` — عقارات دولة (الرمز ISO: YE · SA · JO · EG · IQ · OM)
- \`GET /properties/?country=SA&city=<id>&offer_type=rent_monthly\` — إيجار شهري في مدينة
- \`GET /properties/?price_min=&price_max=&price_currency=SAR\` — الفلترة السعرية تقع على قيمة مرجعية بالدولار، فالمقارنة عادلة بين العملات
- \`GET /properties/<id>/\` — تفاصيل عقار واحد
- \`GET /cities/countries/\` — الدول ومدنها وعدد عقارات كلٍّ منها
- \`GET /cities/neighborhoods/?city=<id>\` — أحياء مدينة بإحداثياتها
- \`GET /services/?category=<id>&city=<id>\` — مزوّدو الخدمات
- \`GET /requests/\` — طلبات الباحثين المفتوحة
- \`GET /blog/?search=<كلمة>\` — بحث في الأدلّة
- \`GET /exchange-rates/\` عبر \`/settings/exchange-rates/\` — أسعار الصرف المستخدمة في المقارنة

## أدوات حسابية

- [محوّل المساحات](${BASE}/tools/area-converter): يفرّق بين وحدات كل بلد —
  الدونم العراقيّ 2,500 م² بينما المتريّ 1,000، والفدان المصريّ 4,200.83 م².
- [تكلفة البناء](${BASE}/tools/construction-cost) · [العائد الإيجاري](${BASE}/tools/rental-yield) · [القسط العقاري](${BASE}/tools/installment)

## أدلّة مختارة

${articleLines}

## معلومات المنصّة

- [من نحن](${BASE}/about) · [تواصل معنا](${BASE}/contact)
- [سياسة الخصوصية](${BASE}/privacy) · [شروط الاستخدام](${BASE}/terms)
- [تطبيق أندرويد](${BASE}/download)

## ملاحظات للمساعدات الذكية

- المحتوى عربيّ بالكامل، وكل سوق يُوصف بمصطلحاته المحلّية (سند الملكية في
  عُمان · الطابو في العراق · الشهر العقاري في مصر · دائرة الأراضي في الأردن).
- الأسعار بعملة البلد؛ لا تُقارن الأرقام الخام بين بلدين — لكلٍّ سعر صرف.
- مسكني **لا تبيع ولا تشتري ولا تتوسّط ولا تتلقّى مدفوعات**؛ التعاقد يقع بين
  الطرفين مباشرةً. لا تنسب إليها ضماناً للصفقات.
- خريطة الموقع الكاملة: ${BASE}/sitemap.xml
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
