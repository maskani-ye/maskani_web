"use client";

/**
 * ════════════════════════════════════════════════════════════════════════
 *  الرئيسية — إعادة بناء كاملة (2026-08-24)
 * ════════════════════════════════════════════════════════════════════════
 *
 * النسخة السابقة كانت **قالباً نظيفاً لا منتَجاً**: ستّة نطاقات أفقية متطابقة
 * البنية (عنوان + زرّ + شبكة) على خلفية واحدة، وكلّ عنصر فيها بطاقة بيضاء ذات
 * حواف دائرية بلمسة بنفسجية. لا إيقاع، ولا لحظة تتوقّف عندها العين.
 *
 * القرارات التي تحكم هذا الملف:
 *
 * ① **الإيقاع قبل الجمال.** الصفحة تتناوب بين ثلاثة أسطح — أبيض للمحتوى،
 *    كِريميّ للأقسام الثانوية، وكحليّ داكن ممتدّ من حافة إلى حافة للخريطة.
 *    التناوب وحده يكسر الرتابة قبل أن يُلمس أي لون أو خطّ.
 *
 * ② **الصورة سيّدة.** العقار يُباع بصورته: الهيرو صورة ممتدّة بحجابٍ كحليّ
 *    محايد (كان لوحاً بنفسجياً يطمس الصورة تماماً)، وشبكة العقارات **تحريرية**
 *    لا متساوية: بطاقة صدارة كبيرة تحكم الصفّ وحولها بطاقات أصغر.
 *
 * ③ **انضباط لوني.** البنفسجي للفعل والسعر **فقط** — كان يفعل كل شيء (تصنيف،
 *    شارات، أيقونات، أزرار، دبابيس) فصار لا يعني شيئاً. الذهبي للتمييز وحده،
 *    والصور تحمل ألوان الصفحة.
 *
 * ④ **لا نطاق بلا وظيفة.** حُذفت اللافتة الذهبية الضخمة التي كانت أعلى تباين
 *    في الصفحة كلّها لصالح إعلانٍ عن أنفسنا، وحُذف قسم «الأرقام» الذي كان يعرض
 *    ٩ عقارات بجانب ٣١ ألف زيارة.
 */

import React, { useEffect, useState } from "react";
import Link from "@/components/nav/MarketLink";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCity } from "@/context/CityContext";
import { useCountry } from "@/context/CountryContext";
import { api } from "@/lib/api";
import { formatPrice, offerTypeLabels, NUMERIC_LOCALE } from "@/lib/utils";
import type { Property, ServiceProvider, ClientRequest } from "@/types";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { PropertyCard, PlaceholderSurface } from "@/components/properties/PropertyCard";
import { HeroSearch } from "@/components/home/HeroSearch";
import { MapBand } from "@/components/home/MapBand";
import { TrustStrip } from "@/components/home/TrustStrip";
import { getServiceIcon } from "@/lib/serviceIcons";
import {
  Buildings2, ShieldWarning, AltArrowLeft, MapPoint,
  Star, ClipboardList, Home2, CheckCircle,
} from "@solar-icons/react";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "شقة", house: "بيت / فيلا", land: "أرض", commercial: "محل تجاري",
};

interface ServiceRequest {
  id: number; title: string; description: string;
  category: { name_ar?: string; icon?: string } | string;
  city_name: string; budget_min: string | null; budget_max: string | null;
  currency: string; offers_count: number;
}

interface City {
  id: number; name_ar: string;
  image?: string | null; image_popout?: string | null;
  properties_count?: number;
}

/** شرائح النوع أسفل الهيرو — أوّل قرار بعد «بيع/إيجار». */
const TYPE_RAIL = [
  { label: "شقق", href: "/properties?property_type=apartment" },
  { label: "بيوت وفلل", href: "/properties?property_type=house" },
  { label: "أراضٍ", href: "/properties?property_type=land" },
  { label: "محلات تجارية", href: "/properties?property_type=commercial" },
  { label: "على الخريطة", href: "/properties?view=map" },
];

export default function HomeClient({
  serverMarket,
  marketImage = null,
  marketCredit = "",
}: {
  serverMarket: string;
  /** صورة السوق — **نفس صورة البوّابة** فيتّصل المشهدان بصرياً. */
  marketImage?: string | null;
  marketCredit?: string;
}) {
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [services, setServices] = useState<ServiceProvider[] | null>(null);
  const [requests, setRequests] = useState<ClientRequest[] | null>(null);
  const [serviceReqs, setServiceReqs] = useState<ServiceRequest[] | null>(null);
  const [featured, setFeatured] = useState<Property[] | null>(null);

  const { cityId, cityName, cities, loading: cityLoading } = useCity();
  const { code: countryCode, country } = useCountry();

  /**
   * ⚠️ `serverMarket` هو اسم سوق الزائر كما كشفه **الخادم** من ترويسة الوكيل.
   * كان الاحتياط هنا كلمة «منطقتك» الحرفية، فيرى زاحف جوجل «عقارات منطقتك»
   * عنواناً — لأنه لا يملك تخزيناً محلّياً ولا يُنفّذ سياقنا. الترتيب: المدينة
   * المختارة ← دولة السياق ← سوق الخادم. والقيمة الأخيرة هي نفسها في تصيير
   * الخادم وأوّل تصيير في المتصفّح، فلا عدم تطابق ترطيب.
   */
  const where = cityName || country?.name_ar || serverMarket;

  /**
   * كل جلبٍ مقيَّد بالمدينة (والدولة احتياطاً) ويُعاد عند تبديل أيّهما — كانت
   * التبعيات فارغة والطلبات بلا فلتر، فيرى زائر القاهرة عقارات صنعاء.
   */
  useEffect(() => {
    if (cityLoading) return;
    const scope: Record<string, string | number> = cityId
      ? { city: cityId }
      : countryCode
        ? { country: countryCode }
        : {};
    const q = (extra: Record<string, string | number>) => ({
      params: { ...scope, ...extra },
    });
    const rows = (r: { data: { results?: unknown[] } | unknown[] }) =>
      (Array.isArray(r.data) ? r.data : r.data.results) ?? [];

    api.get("/properties/featured/", q({ limit: 4 })).then((r) => setFeatured(rows(r) as Property[])).catch(() => setFeatured([]));
    api.get("/properties/", q({ limit: 8, offset: 0 })).then((r) => setProperties(rows(r) as Property[])).catch(() => setProperties([]));
    api.get("/services/", q({ limit: 3, offset: 0 })).then((r) => setServices(rows(r) as ServiceProvider[])).catch(() => setServices([]));
    api.get("/requests/", q({ limit: 3, offset: 0 })).then((r) => setRequests(rows(r) as ClientRequest[])).catch(() => setRequests([]));
    api.get("/jobs/", q({ limit: 3, offset: 0 })).then((r) => setServiceReqs(rows(r) as ServiceRequest[])).catch(() => setServiceReqs([]));
  }, [cityId, countryCode, cityLoading]);

  /**
   * الشبكة التحريرية: بطاقةُ صدارة واحدة (الأكثر رواجاً) ثمّ الأحدث حولها —
   * **بلا تكرار**. كان القسمان منفصلين فيعرضان العقارات نفسها: قِسناها فوجدنا
   * ٣ من ٤ مكرّرة، فيرى الزائر العقار مرّتين ويبدو المخزون أصغر ممّا هو.
   */
  const spotlight = featured?.[0] ?? properties?.[0] ?? null;

  /**
   * ⚠️ **لا أصول ثابتة للمدن**: كانت الخلفية `/cities/_hero.webp` (صنعاء
   * القديمة) وبلاطات المدن تسقط إلى `/cities/<id>.webp` — أي صورٌ في مستودع
   * الويب مربوطة بمعرّفات صفوف في قاعدة البيانات. تنكسر بصمت عند أي إعادة
   * ترقيم، ولا يملك المشرف تغييرها من اللوحة. نُقلت الـ21 صورة إلى `City.image`
   * (على R2) وصار الخادم مصدرها الوحيد.
   *
   * تسلسل الاحتياط كلّه من الخادم: صورة المدينة ← صورة عقارٍ حقيقيّ في السوق
   * ← سطحٌ محايد. لا صورة مُصمَّمة ولا أصل محلّي.
   */
  /**
   * ⚠️ **صورة السوق تسبق صورة المدينة.** الزائر يصل من البوّابة وقد رأى صورة
   * بلده مِلءَ الشاشة، فإن استقبلته صفحة السوق بصورةٍ أخرى انقطع المشهد وبدت
   * الصفحتان موقعين مختلفين. صورة السوق أوّلاً، ثم صورة مدينته المختارة إن
   * اختار، ثم عقارٌ حقيقيّ، ثم سطحٌ محايد.
   */
  const heroImage =
    marketImage ||
    cities.find((c) => String(c.id) === cityId)?.image ||
    spotlight?.main_image ||
    null;
  const grid = (properties ?? [])
    .filter((p) => p.id !== spotlight?.id)
    .slice(0, 4);
  const loadingProps = properties === null;
  /** الأعمدة الثلاثة خلت جميعاً (بعد التحميل) — يُطوى النطاق إلى دعوة واحدة. */
  const allQuietZone =
    services?.length === 0 && requests?.length === 0 && serviceReqs?.length === 0;

  return (
    <div className="bg-white">
      {/* ─── ① الهيرو — صورة ممتدّة بحجاب محايد ────────────────────────── */}
      <section className="relative isolate text-white">
        <div className="absolute inset-0 -z-10 bg-ink">
          {/* عنصر LCP: يُقدَّم بمقاس الجهاز وبأولوية. الحجاب **كحليّ محايد** لا
              بنفسجيّ: التراكب البنفسجي السابق بشفافية 80-90% كان يطمس صورة
              المدينة تماماً فتتساوى كل الأسواق في مظهر واحد. */}
          {heroImage && (
            <Image
              src={heroImage}
              alt=""
              aria-hidden
              fill
              priority
              sizes="100vw"
              quality={72}
              className="object-cover object-center"
            />
          )}
          {/* حجابٌ مطابق للبوّابة: يثقل تحت النصّ ويخفّ حيث لا نصّ. */}
          <div
            className={`absolute inset-0 ${
              heroImage
                ? "bg-gradient-to-b from-ink/70 via-ink/45 to-ink/85"
                : "bg-gradient-to-br from-primary-900 via-ink to-primary-800"
            }`}
          />
          {heroImage && (
            <div className="absolute inset-0 bg-gradient-to-l from-ink/10 via-transparent to-ink/70" />
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-20 md:pt-20 md:pb-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3.5 py-1.5 text-caption font-bold ring-1 ring-white/20">
              <CheckCircle weight="Bold" className="h-4 w-4 text-gold" />
              تواصل مباشر · بلا عمولة
            </span>

            {/* ⚠️ ارتفاع سطرين محجوز: اسم السوق يتغيّر بعد الترطيب (من سوق
                الخادم إلى مدينة المستخدم المحفوظة)، فيعيد العنوان الالتفاف
                وينمو الهيرو 59 بكسل — وهو ارتفاع سطر بمقاس `display` بالضبط —
                فيدفع كل ما تحته. قياس CLS نسبه إلى هذه اللحظة (t=2.67ث).
                الوحدة `em` كي تتبع المقاس عبر العتبات. */}
            <h1 className="text-h1 md:text-display mt-5 text-balance min-h-[2.25em]">
              ابحث عن مسكنك في {where}
            </h1>

            <p className="text-body-lg text-white/75 mt-4 max-w-xl leading-relaxed">
              تصفّح العقارات المعروضة، وتواصل مع صاحب العقار على رقمه مباشرةً —
              بلا نسبة من الصفقة ولا رسوم.
            </p>

            <div className="mt-8">
              <HeroSearch />
            </div>
          </div>
        </div>
        {/* نسب الصورة — شرط رخصة لا تجميل (صور المشاع تشترط ذكر المصوّر). */}
        {marketImage && marketCredit && (
          <p className="absolute bottom-1.5 inset-x-0 px-4 text-caption text-white/30 truncate text-center">
            الصورة: {marketCredit}
          </p>
        )}
      </section>

      {/* ─── ② شريط النوع — يتداخل مع الهيرو ليربط النطاقين بعمق ────────── */}
      <div className="relative z-10 -mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav
            aria-label="تصفّح حسب نوع العقار"
            className="flex gap-2 overflow-x-auto scrollbar-none bg-white rounded-2xl shadow-e2 ring-1 ring-ink/[0.06] p-2"
          >
            {TYPE_RAIL.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className="flex-shrink-0 rounded-xl px-5 py-2.5 text-body font-semibold text-ink hover:bg-cream hover:text-primary transition-colors whitespace-nowrap"
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* ─── ③ العقارات — شبكة تحريرية ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 md:pt-20 pb-14">
        <SectionHead
          title={`عقارات ${where}`}
          subtitle="المعروض الآن للبيع والإيجار — بأسعارها وصورها وموقعها"
          href="/properties"
        />

        {loadingProps ? (
          <EditorialSkeleton />
        ) : spotlight ? (
          /* بطاقة الصدارة تحكم الصفّ (عمودان × صفّان) والأحدث حولها — تراتبية
             بصرية بدل أربع بطاقات متساوية لا تقول أيّها الأهمّ. */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="sm:col-span-2 lg:row-span-2">
              <PropertyCard property={spotlight} variant="featured" />
            </div>
            {grid.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            Icon={Buildings2}
            title={`لا عقار معروض في ${where} بعد`}
            body="سوقٌ جديد يبدأ بأوّل إعلان. انشر عقارك مجاناً فيراه كل من يبحث هنا."
            cta={{ href: "/properties/create", label: "كن أوّل من ينشر" }}
          />
        )}
      </section>

      {/* ─── ④ الخريطة — نطاق داكن ممتدّ يكسر الإيقاع ─────────────────── */}
      <MapBand cityId={cityId} countryCode={countryCode} where={where} />

      {/* ─── ⑤ المدن — بلاطات بأعداد المخزون ───────────────────────────── */}
      <section className="bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20">
          <CitiesTiles cities={cities} />
        </div>
      </section>

      {/* ─── ⑥ الخدمات والطلبات — نطاق واحد بثلاثة أعمدة ───────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20">
        {/* ⚠️ **ترويسة أمّ تجمع الأعمدة الثلاثة.**
            قياس 2026-08-31: أربعة عناوين أقسام بـ36 بكسل وخمسة بـ20 بكسل في
            **المستوى البنيويّ نفسه** — فيقرأ الزائر «مزوّدو الخدمات» تابعاً لما
            قبله لا قسماً مستقلّاً، ويقرؤه قارئ الشاشة عنواناً من الرتبة الثانية
            بلا أمّ. الأعمدة الثلاثة وجهٌ واحد لسؤالٍ واحد: ما الذي يدور في
            السوق الآن؟ — فترويستها واحدة وعناوينها الداخلية من رتبة ثالثة. */}
        <SectionHead
          title="ما يدور في السوق الآن"
          subtitle="خدمات معروضة وطلبات مفتوحة — تصفّحها أو قدّم عرضك"
          href="/services"
        />
        {/* ⚠️ **ترويسة كبيرة فوق ثلاثة أعمدة تقول «لا يوجد» ثلاث مرّات.**
            هذا حال كل سوقٍ جديد، وهو أسوأ من غياب القسم: يَعِد الزائرَ بقسمٍ
            ثم يريه فراغاً مثلّثاً. حين تخلو الثلاثة جميعاً تُطوى إلى دعوةٍ
            واحدة — والفراغ يصير فرصة لا اعتذاراً. */}
        {allQuietZone ? (
          <div className="rounded-3xl bg-cream px-6 py-12 text-center ring-1 ring-ink/[0.06]">
            <p className="text-h3 text-ink">كن أوّل من يفتح هذا الباب في {where}</p>
            <p className="mx-auto mt-2 max-w-lg text-body leading-relaxed text-muted">
              لا خدمة معروضة ولا طلب مفتوح هنا بعد. اعرض خدمتك أو اطلب ما تحتاجه،
              فيصلك أهل السوق مباشرةً.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/services/create"
                className="rounded-xl bg-primary px-6 py-3 text-body font-bold text-white transition-colors hover:bg-primary-600"
              >
                اعرض خدمتك
              </Link>
              <Link
                href="/requests/create"
                className="rounded-xl bg-white px-6 py-3 text-body font-bold text-ink ring-1 ring-ink/10 transition-colors hover:bg-cream"
              >
                اطلب عقاراً
              </Link>
            </div>
          </div>
        ) : (
        <div className="grid gap-10 lg:gap-8 lg:grid-cols-3">
          <MiniSection
            title="مزوّدو الخدمات"
            subtitle="مقاولون ومهندسون وحرفيّون"
            href="/services"
            loading={services === null}
            empty={services?.length === 0}
            emptyText={`لا مزوّد خدمة في ${where} بعد`}
          >
            {services?.map((s) => <ServiceCard key={s.id} service={s} />)}
          </MiniSection>

          <MiniSection
            title="طلبات عقارية"
            subtitle="عملاء يبحثون — قدّم عرضك"
            href="/requests"
            loading={requests === null}
            empty={requests?.length === 0}
            emptyText={`لا طلب عقاري في ${where} بعد`}
          >
            {requests?.map((r) => <RequestCard key={r.id} request={r} />)}
          </MiniSection>

          <MiniSection
            title="طلبات خدمات"
            subtitle="عملاء يبحثون عن حِرفيّ"
            href="/jobs"
            loading={serviceReqs === null}
            empty={serviceReqs?.length === 0}
            emptyText={`لا طلب خدمة في ${where} بعد`}
          >
            {serviceReqs?.map((j) => <JobCard key={j.id} job={j} />)}
          </MiniSection>
        </div>
        )}
      </section>

      {/* ─── ⑦ لماذا مسكني ─────────────────────────────────────────────── */}
      <section className="bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20">
          <TrustStrip />
        </div>
      </section>

      {/* ─── ⑧ النشر والبلاغ — نطاق ختاميّ واحد ───────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20">
        <div className="mb-7">
          <h2 className="text-h1 text-ink text-balance">شارك في السوق</h2>
          <p className="text-body text-muted mt-2">
            المنصّة تكبر بما ينشره أهلها وبما يكشفونه من تجاوز
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <ClosingCard
            Icon={Home2}
            tone="primary"
            title="عندك عقار للبيع أو الإيجار؟"
            body="انشره مجاناً في دقيقة، ويصلك الباحث على رقمك مباشرةً."
            href="/properties/create"
            cta="أضِف عقارك"
          />
          <ClosingCard
            Icon={ShieldWarning}
            tone="danger"
            title="تعرّضت لاحتيال عقاري؟"
            body="بلاغك يحمي غيرك — يراه المجتمع ويصوّت عليه."
            href="/reports/create"
            cta="رفع بلاغ"
          />
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   عناصر الصفحة
   ═══════════════════════════════════════════════════════════════════════ */

/** ترويسة قسم رئيسي — عنوان كبير ورابط نصّي هادئ (لا زرّ يزاحم العنوان). */
function SectionHead({ title, subtitle, href }: {
  title: string; subtitle: string; href: string;
}) {
  return (
    <div className="flex items-end justify-between gap-6 mb-7">
      <div>
        <h2 className="text-h1 text-ink text-balance">{title}</h2>
        <p className="text-body text-muted mt-2">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="group hidden sm:flex items-center gap-1.5 text-body font-bold text-primary flex-shrink-0 hover:gap-2.5 transition-all"
      >
        عرض الكل
        <AltArrowLeft className="h-4 w-4" />
      </Link>
    </div>
  );
}

/** قسم فرعيّ داخل نطاق الأعمدة الثلاثة — وزنٌ أخفّ من القسم الرئيسي. */
function MiniSection({ title, subtitle, href, loading, empty, emptyText, children }: {
  title: string; subtitle: string; href: string;
  loading: boolean; empty?: boolean; emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-5 pb-3 border-b border-ink/[0.08]">
        <div>
          <h3 className="text-h3 text-ink">{title}</h3>
          <p className="text-caption text-muted mt-0.5">{subtitle}</p>
        </div>
        <Link href={href} className="text-caption font-bold text-primary flex-shrink-0 hover:underline">
          الكل
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : empty ? (
        <p className="text-caption text-muted py-10 text-center">{emptyText}</p>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </div>
  );
}

function EditorialSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div className="sm:col-span-2 lg:row-span-2">
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[330px] w-full rounded-2xl" />
      ))}
    </div>
  );
}

function EmptyState({ Icon, title, body, cta }: {
  Icon: React.ComponentType<{ className?: string; weight?: "Bold" | "Linear" }>;
  title: string; body: string; cta: { href: string; label: string };
}) {
  return (
    <div className="rounded-3xl bg-cream ring-1 ring-ink/[0.06] px-6 py-16 text-center">
      <span className="inline-flex w-14 h-14 rounded-2xl bg-white items-center justify-center text-primary/40 mb-4">
        <Icon weight="Linear" className="h-7 w-7" />
      </span>
      <p className="text-h3 text-ink">{title}</p>
      <p className="text-body text-muted mt-2 max-w-md mx-auto leading-relaxed">{body}</p>
      <Link
        href={cta.href}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-body font-bold text-white mt-6 hover:bg-primary-600 transition-colors"
      >
        {cta.label}
      </Link>
    </div>
  );
}

/**
 * بلاطات المدن.
 *
 * ⚠️ كانت **دوائر صور** منقولة من Gathern — وهي منصّة حجزٍ سياحي حيث صورة
 * الوجهة تبيع الرغبة. في العقار يحتاج المستخدم رقماً: معلمٌ جميل لمدينة خلفها
 * صفر عقار فخٌّ يقود إلى صفحة فارغة. البلاطة تحمل الصورة **والعدد**، والمدن
 * ذات المخزون تتقدّم.
 */
/** أسطح البلاطات — تدور بالترتيب فيتمايز الشريط بلا صور. */
const TILE_SURFACES = [
  "bg-gradient-to-br from-primary-400/90 via-primary-500 to-primary-700",
  "bg-gradient-to-tr from-primary-600 via-primary-500 to-primary-300/80",
  "bg-gradient-to-b from-primary-400 to-primary-800",
  "bg-gradient-to-bl from-primary-300/70 via-primary-500 to-primary-700",
];

function CitiesTiles({ cities }: { cities: City[] }) {
  const router = useRouter();
  const { cityId, setCity } = useCity();
  if (!cities.length) return null;

  const ordered = [...cities].sort(
    (a, b) => Number((b.properties_count ?? 0) > 0) - Number((a.properties_count ?? 0) > 0),
  );
  const shown = ordered.slice(0, 8);

  const pick = (c: City) => {
    setCity(String(c.id), c.name_ar);
    router.push(`/properties?city=${c.id}`);
  };

  return (
    <>
      <div className="mb-7">
        <h2 className="text-h1 text-ink">في كل مكان لك بيت</h2>
        <p className="text-body text-muted mt-2">
          اختر مدينتك — الرقم هو عدد العقارات المعروضة فيها الآن
        </p>
      </div>

      {/* ⚠️ **البلاطة لا تعتمد على الصورة.**
          قياس 2026-08-31: **صفر من مدن السعودية الثماني لها صورة** (`City.image`
          يُرفع من اللوحة، والأسواق الجديدة تصل قبل صورها) — فكان الشريط ثماني
          بلاطات رمادية متطابقة بنقشٍ مائل، وهي أسوأ ما في الصفحة. البديل يجعل
          **الرقم** بطل البلاطة: هو ما يبحث عنه المستخدم أصلاً («كم عقاراً في
          الرياض؟») وهو متوفّر دائماً، بينما الصورة زينةٌ تأتي إن جاءت. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {shown.map((c, i) => {
          const on = cityId === String(c.id);
          const count = c.properties_count ?? 0;
          return (
            <button
              key={c.id}
              onClick={() => pick(c)}
              aria-pressed={on}
              className={`group relative h-36 sm:h-40 overflow-hidden rounded-2xl bg-primary-500 text-start ring-1 transition-all ${
                on ? "ring-2 ring-gold shadow-e3" : "ring-ink/[0.06] hover:shadow-e3"
              }`}
            >
              {c.image ? (
                <Image
                  src={c.image}
                  alt=""
                  aria-hidden
                  fill
                  sizes="(max-width: 640px) 45vw, 300px"
                  quality={68}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                /* سطحٌ من لوحة العلامة لا نقشٌ رماديّ. والتفاوت **منفَّذ** لا
                   موصوف: أربعة اتجاهات تدور بالترتيب، فلا يبدو الشريط ثماني
                   نسخٍ من بلاطة واحدة. */
                <span
                  aria-hidden
                  className={`absolute inset-0 ${TILE_SURFACES[i % TILE_SURFACES.length]}`}
                />
              )}
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent"
              />

              <span className="absolute inset-x-0 bottom-0 p-3.5">
                {/* الرقم أوّلاً وبأكبر وزن — هو الجواب على سؤال الزائر. */}
                <span className="block text-h2 font-extrabold tabular-nums text-white">
                  {count > 0 ? count.toLocaleString(NUMERIC_LOCALE) : "—"}
                </span>
                <span className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-body font-bold text-white">{c.name_ar}</span>
                  <span className="text-caption text-white/60">
                    {count > 0 ? "عقار" : "قريباً"}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {ordered.length > shown.length && (
        <div className="mt-6 text-center">
          <Link href="/properties">
            <Button variant="outline">
              كل المدن ({ordered.length.toLocaleString(NUMERIC_LOCALE)})
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}

function ClosingCard({ Icon, tone, title, body, href, cta }: {
  Icon: React.ComponentType<{ className?: string; weight?: "Bold" | "Linear" }>;
  tone: "primary" | "danger"; title: string; body: string; href: string; cta: string;
}) {
  const isPrimary = tone === "primary";
  return (
    <div
      /* ⚠️ التراصّ العموديّ تحت 400 بكسل: الصفّ الأفقيّ (أيقونة + نصّ + زرّ)
         لا يتقلّص أكثر، فيفيض العنوان 28 بكسل على شاشة 320. */
      className={`rounded-3xl p-5 sm:p-7 flex flex-col xs:flex-row xs:items-center gap-4 sm:gap-5 text-center xs:text-start ring-1 ${
        isPrimary ? "bg-primary text-white ring-primary" : "bg-cream ring-ink/[0.06]"
      }`}
    >
      <span
        className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 mx-auto xs:mx-0 ${
          isPrimary ? "bg-white/15 text-white" : "bg-danger-50 text-danger"
        }`}
      >
        <Icon weight="Bold" className="h-6 w-6" />
      </span>
      <div className="flex-1 min-w-0">
        <h3 className={`text-h3 ${isPrimary ? "text-white" : "text-ink"}`}>{title}</h3>
        <p className={`text-caption mt-1 ${isPrimary ? "text-white/75" : "text-muted"}`}>{body}</p>
      </div>
      <Link href={href} className="flex-shrink-0 w-full xs:w-auto">
        <span
          className={`inline-flex w-full xs:w-auto items-center justify-center rounded-xl px-5 py-2.5 text-body font-bold transition-colors ${
            isPrimary ? "bg-white text-primary hover:bg-white/90" : "bg-ink text-white hover:bg-ink-light"
          }`}
        >
          {cta}
        </span>
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   بطاقات الأقسام الثانوية — أفقية مضغوطة
   ────────────────────────────────────────────────────────────────────────
   ⚠️ درسٌ من مراجعة: سطّحتُها مرّةً إلى نصٍّ بلا وسائط فأفقدتُها حضورها. كتلة
   الوسائط ضرورية — هي ما يمنح البطاقة وزناً. العيب كان في **كيفها** لا في
   وجودها: لوحٌ بنفسجيّ مشبع بأيقونة بحجم 56 بكسل يشغل 60% من البطاقة. هنا
   تعود ككتلة مربّعة صغيرة بسطحٍ هادئ (`PlaceholderSurface`) داخل بطاقة أفقية
   تناسب عموداً ضيّقاً.
   ═══════════════════════════════════════════════════════════════════════ */

function categoryOf(cat: unknown): { name: string; icon?: string } {
  if (cat && typeof cat === "object") {
    const o = cat as { name_ar?: string; icon?: string };
    return { name: o.name_ar ?? "", icon: o.icon };
  }
  return { name: typeof cat === "string" ? cat : "" };
}

function RowCard({ href, media, kicker, title, meta, footer }: {
  href: string; media: React.ReactNode;
  kicker: React.ReactNode; title: string;
  meta: React.ReactNode; footer: React.ReactNode;
}) {
  return (
    <Link href={href} className="group block">
      <article className="flex gap-3.5 bg-white rounded-2xl p-3 ring-1 ring-ink/[0.06] shadow-e1 hover:shadow-e3 hover:ring-ink/[0.10] transition-all">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0">
          {media}
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center gap-2 text-caption">{kicker}</div>
          <h3 className="text-body font-semibold text-ink mt-1 line-clamp-2 leading-snug">
            {title}
          </h3>
          <div className="flex items-center gap-1.5 text-caption text-muted mt-1">
            <MapPoint className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{meta}</span>
          </div>
          <div className="mt-auto pt-2 flex items-baseline justify-between gap-2">
            {footer}
          </div>
        </div>
      </article>
    </Link>
  );
}

function ServiceCard({ service }: { service: ServiceProvider }) {
  const cat = categoryOf(service.category);
  const Icon = getServiceIcon(cat.icon);
  const city = service.cities_names?.[0];
  const rating =
    typeof service.average_rating === "number" && service.average_rating > 0
      ? service.average_rating
      : null;

  return (
    <RowCard
      href={`/services/${service.id}`}
      media={<PlaceholderSurface Icon={Icon} tone="gold" />}
      kicker={<span className="font-bold text-ink line-clamp-1">{cat.name || "خدمة"}</span>}
      title={service.title}
      meta={city || "عدّة مدن"}
      footer={
        <>
          <span className="text-caption font-bold text-primary">عرض الخدمة</span>
          {rating && (
            <span className="flex items-center gap-1 text-caption font-bold text-ink tabular-nums">
              <Star weight="Bold" className="h-4 w-4 text-gold-500" />
              {rating.toLocaleString(NUMERIC_LOCALE, {
                minimumFractionDigits: 1, maximumFractionDigits: 1,
              })}
            </span>
          )}
        </>
      }
    />
  );
}

function budgetOf(
  min: string | null, max: string | null, currency: string,
): string | null {
  if (min && max) return `${formatPrice(min, currency)} — ${formatPrice(max, currency)}`;
  if (max) return `حتى ${formatPrice(max, currency)}`;
  if (min) return `من ${formatPrice(min, currency)}`;
  return null;
}

function OffersCount({ n }: { n: number }) {
  return (
    <span className="text-caption text-muted flex-shrink-0 tabular-nums">
      {n > 0 ? `${n.toLocaleString(NUMERIC_LOCALE)} عرض` : "لا عروض بعد"}
    </span>
  );
}

function RequestCard({ request }: { request: ClientRequest }) {
  const type = PROPERTY_TYPE_LABELS[request.property_type] ?? request.property_type;
  const offer = offerTypeLabels[request.offer_type] ?? request.offer_type;
  const budget = budgetOf(request.budget_min, request.budget_max, request.currency);

  return (
    <RowCard
      href={`/requests/${request.id}`}
      media={<PlaceholderSurface Icon={ClipboardList} tone="primary" />}
      kicker={
        <>
          <span className="font-bold text-primary line-clamp-1">مطلوب · {type}</span>
          <span className="ms-auto font-bold px-2 py-0.5 rounded-md bg-cream text-ink flex-shrink-0">
            {offer}
          </span>
        </>
      }
      title={request.title || `يبحث عن ${type}`}
      meta={`${request.city_name}${request.neighborhood ? ` — ${request.neighborhood}` : ""}`}
      footer={
        <>
          {budget
            ? <span className="text-price-sm text-primary line-clamp-1">{budget}</span>
            : <span className="text-caption text-muted">حسب العرض</span>}
          <OffersCount n={request.offers_count} />
        </>
      }
    />
  );
}

function JobCard({ job }: { job: ServiceRequest }) {
  const cat = categoryOf(job.category);
  const Icon = getServiceIcon(cat.icon);
  const budget = budgetOf(job.budget_min, job.budget_max, job.currency);

  return (
    <RowCard
      href={`/jobs/${job.id}`}
      media={<PlaceholderSurface Icon={Icon} tone="gold" />}
      kicker={<span className="font-bold text-ink line-clamp-1">{cat.name || "طلب خدمة"}</span>}
      title={job.title}
      meta={job.city_name}
      footer={
        <>
          {budget
            ? <span className="text-price-sm text-primary line-clamp-1">{budget}</span>
            : <span className="text-caption text-muted">حسب العرض</span>}
          <OffersCount n={job.offers_count} />
        </>
      }
    />
  );
}
