"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCity } from "@/context/CityContext";
import { useCountry } from "@/context/CountryContext";
import { api } from "@/lib/api";
import { formatPrice, offerTypeLabels } from "@/lib/utils";
import type { Property, ServiceProvider, ClientRequest } from "@/types";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { HeroSearch } from "@/components/home/HeroSearch";
import { HomeMapPreview } from "@/components/home/HomeMapPreview";
import { TrustStrip } from "@/components/home/TrustStrip";
import { getServiceIcon } from "@/lib/serviceIcons";
import {
  Buildings2, ShieldWarning, AltArrowLeft, MapPoint,
  Star, UsersGroupRounded, ClipboardList, Home2,
} from "@solar-icons/react";
import { motion } from "framer-motion";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "شقة", house: "بيت / فيلا", land: "أرض", commercial: "محل تجاري",
};

// طلب خدمة (jobs) — نوع محلّي (يصل category ككائن {name_ar,icon}).
interface ServiceRequest {
  id: number; title: string; description: string;
  category: { name_ar?: string; icon?: string } | string;
  city_name: string; budget_min: string | null; budget_max: string | null;
  currency: string; offers_count: number;
}

interface City { id: number; name_ar: string; image?: string | null; image_popout?: string | null; properties_count?: number }

export default function HomeClient() {
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [services, setServices] = useState<ServiceProvider[] | null>(null);
  const [requests, setRequests] = useState<ClientRequest[] | null>(null);
  const [serviceReqs, setServiceReqs] = useState<ServiceRequest[] | null>(null);
  const [featured, setFeatured] = useState<Property[] | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  const { cityId, cityName, cities, loading: cityLoading } = useCity();
  const { code: countryCode, country } = useCountry();

  // موضع البيانات المعروضة — يُذكَر صراحةً في حالات الفراغ. «لا توجد عقارات بعد»
  // مجرّدةً تقول للزائر إن المنصّة فارغة؛ «لا توجد عقارات في القاهرة بعد» تقول
  // له إن سوقه هو الجديد، وهذا فرق في المعنى لا في الصياغة.
  const where = cityName || country?.name_ar || "منطقتك";

  /**
   * ⚠️ خلفية الهيرو كانت `/cities/_hero.webp` — صنعاء القديمة — ثابتةً لكل
   * الأسواق الستّة. وهي عنصر LCP، أي أوّل وأكبر ما تراه العين: فتقول لأربعة
   * أخماس الجمهور «هذا ليس بلدك». نستعمل صورة المدينة المختارة حين تتوفّر،
   * وإلا صورةً محايدة.
   */
  const heroImage =
    cities.find((c) => String(c.id) === cityId)?.image || "/cities/_hero.webp";

  /**
   * ⚠️ كانت التبعيات فارغة والطلبات بلا فلتر: تجلب الرئيسية مرّة واحدة ولا
   * تعرف المدينة ولا الدولة إطلاقاً. فمن يبدّل إلى القاهرة يبقى أمام عقارات
   * صنعاء — والرئيسية أوّل ما يراه الزائر، فالخطأ فيها يقول له «هذا الموقع
   * ليس لبلدك». الفلترة على المدينة، والدولة احتياطٌ حين لا مدينة بعد.
   */
  useEffect(() => {
    if (cityLoading) return; // لا نجلب بمدينةٍ لم تُطابَق بعد مع الدولة
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

    // `/stats/` أرقام المنصّة كلّها عمداً («أرقام مسكني») — لا تُضيَّق بمدينة،
    // فتضييقها يعرض «0 عقار» لسوقٍ جديد فتبدو المنصّة ميتة. لا نمرّر فلتراً
    // يبتلعه الخادم صامتاً.
    api.get("/stats/").then((r) => setStats(r.data ?? null)).catch(() => setStats(null));
    api.get("/properties/featured/", q({ limit: 8 })).then((r) => setFeatured(rows(r) as Property[])).catch(() => setFeatured([]));
    api.get("/properties/", q({ limit: 8, offset: 0 })).then((r) => setProperties(rows(r) as Property[])).catch(() => setProperties([]));
    api.get("/services/", q({ limit: 4, offset: 0 })).then((r) => setServices(rows(r) as ServiceProvider[])).catch(() => setServices([]));
    api.get("/requests/", q({ limit: 4, offset: 0 })).then((r) => setRequests(rows(r) as ClientRequest[])).catch(() => setRequests([]));
    api.get("/jobs/", q({ limit: 4, offset: 0 })).then((r) => setServiceReqs(rows(r) as ServiceRequest[])).catch(() => setServiceReqs([]));
  }, [cityId, countryCode, cityLoading]);

  return (
    <div>
      {/* ─── الهيرو: بحث أولاً ─────────────────────────────────────────────
          كان هيروًا طويلاً (pt-24 pb-16) بعنوان يقول «ابحث عن مسكنك المثالي»
          وفيه **صفر** حقل بحث — والباحث يمرّر ثلاث مرّات قبل أن يرى عقاراً.
          الرئيسية في منصّة عقارية حقلُ إدخال لا لوحة إعلانات. */}
      <section className="relative bg-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0">
          {/* هذه الصورة هي عنصر LCP للصفحة. كـ<img> خام كانت تُحمَّل بحجمها
              الكامل (243 ك.ب) وبلا أولوية، فبلغ LCP على الجوّال 9.8 ثانية.
              next/image يقدّمها بمقاس الجهاز وبصيغة AVIF، و`priority` يحقنها
              في رأس الصفحة كـpreload بدل انتظار دورها في الطابور. */}
          <Image
            src={heroImage}
            alt=""
            aria-hidden
            fill
            priority
            sizes="100vw"
            quality={70}
            className="object-cover object-center opacity-45"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/80 via-primary-800/82 to-primary-900/90" />
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute bottom-0 left-10 w-56 h-56 rounded-full bg-gold blur-[90px]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 md:pt-16 pb-10 md:pb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
            className="text-center"
          >
            <h1 className="text-h1 md:text-display text-balance">
              ابحث عن <span className="text-gold">مسكنك</span>
              {where !== "منطقتك" ? ` في ${where}` : " المثالي"}
            </h1>
            <p className="text-body-lg text-white/80 max-w-2xl mx-auto mt-3">
              تواصل مع صاحب العقار مباشرةً — بلا وسيط وبلا عمولة
            </p>
          </motion.div>

          <div className="mt-7">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* ─── دعوة النشر — أهمّ ما تحتاجه المنصّة اليوم ────────────────────
          108 زائراً وصلوا هذه الصفحة في أسبوع، ولم يُطلب من أحدهم نشر عقاره
          ولا مرّة. المخزون هو سقف المنصّة، والطلب الصريح أرخص وسيلة لرفعه. */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <Link
          href="/properties/create"
          className="flex items-center gap-4 rounded-3xl bg-gradient-to-l from-gold/95 to-gold p-5 sm:p-6 shadow-card hover:shadow-card-hover transition-all"
        >
          <span className="w-12 h-12 rounded-2xl bg-ink/10 flex items-center justify-center flex-shrink-0">
            <Home2 weight="Bold" className="h-6 w-6 text-ink" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-lg sm:text-xl font-extrabold text-ink">عندك عقار للبيع أو الإيجار؟</span>
            <span className="block text-ink/70 text-body mt-0.5">
              انشره مجاناً في دقيقة — ويصلك الباحث على رقمك مباشرة بلا وسيط ولا عمولة
            </span>
          </span>
          <span className="rounded-xl bg-ink px-4 py-2.5 text-body font-bold text-white flex-shrink-0 hidden sm:block">
            أضف عقارك
          </span>
          <AltArrowLeft className="h-5 w-5 text-ink sm:hidden flex-shrink-0" />
        </Link>
      </div>

      {/* ─── شريط الأقسام السريعة ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <CategoryStrip />
      </div>

      {/* ─── المدن (وجهات بأسلوب Gathern + بوردر أكتيف) ───────────────────── */}
      {/* ارتفاع محجوز: الشريط يصل بعد الجلب، وبلا حجزٍ يدفع كل ما تحته للأسفل
          (كان أكبر مصدر لقفزات التخطيط في الصفحة). */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 min-h-[152px] sm:min-h-[178px]">
        <CitiesStrip cities={cities} />
      </div>

      {/* ─── عقارات مميّزة — كاروسيل أفقي (الأكثر رواجًا) ─────────────────── */}
      {/* نفس المبدأ: نحجز ارتفاع الصفّ أثناء التحميل، ونطويه فقط حين نتيقّن
          أنه فارغ — فلا تُزاح الصفحة تحت إصبع القارئ. */}
      {featured === null ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 min-h-[300px]" aria-hidden />
      ) : featured.length > 0 ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
          <FeaturedRow properties={featured} />
        </div>
      ) : null}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        {/* ─── الخريطة — معاينة حيّة بدبابيس حقيقية ────────────────────────
            كانت مستطيل تدرّج بنفسجيّ مكتوباً عليه اسمها. الخريطة أقوى إغراء
            بصريّ في العقار، والمنصّة تملك `/properties/map/` ولا تعرض منه شيئاً. */}
        <HomeMapPreview cityId={cityId} countryCode={countryCode} />

        {/* ─── العقارات ──────────────────────────────────────────────────── */}
        <HomeSection title="العقارات" subtitle="أحدث العقارات للبيع والإيجار" href="/properties" tone="primary">
          <CardGrid loading={properties === null} empty={properties?.length === 0}
            emptyIcon={<Buildings2 className="h-10 w-10" />}
            emptyText={`لا توجد عقارات معروضة في ${where} بعد`}
            emptyAction={
              <Link href="/properties/create" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-body font-bold text-white hover:bg-primary/90 transition-colors">
                كن أوّل من ينشر عقاراً هنا
              </Link>
            }>
            {properties?.slice(0, 8).map((l) => <PropertyCard key={l.id} property={l} />)}
          </CardGrid>
        </HomeSection>

        {/* ─── الخدمات ────────────────────────────────────────────────────── */}
        <HomeSection title="الخدمات" subtitle="مزوّدو خدمات عقارية متخصّصون" href="/services">
          <CardGrid loading={services === null} empty={services?.length === 0}
            media={false}
            emptyIcon={<UsersGroupRounded className="h-10 w-10" />}
            emptyText={`لا يوجد مزوّد خدمة في ${where} بعد`}
            emptyAction={
              <Link href="/services/my" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-body font-bold text-white hover:bg-primary/90 transition-colors">أضِف خدمتك</Link>
            }>
            {services?.slice(0, 4).map((s) => <ServiceCard key={s.id} service={s} />)}
          </CardGrid>
        </HomeSection>

        {/* ─── طلبات عقارية (demands) ─────────────────────────────────────── */}
        <HomeSection title="طلبات عقارية" subtitle="عملاء يبحثون عن عقارات — قدّم عرضك" href="/requests">
          <CardGrid loading={requests === null} empty={requests?.length === 0}
            media={false}
            emptyIcon={<ClipboardList className="h-10 w-10" />}
            emptyText={`لا توجد طلبات عقارية في ${where} بعد`}
            emptyAction={
              <Link href="/requests/create" className="inline-flex items-center gap-2 rounded-xl border border-primary/30 px-5 py-2.5 text-body font-bold text-primary hover:bg-primary/5 transition-colors">انشر طلبك العقاري</Link>
            }>
            {requests?.slice(0, 4).map((r) => <RequestCard key={r.id} request={r} />)}
          </CardGrid>
        </HomeSection>

        {/* ─── طلبات خدمات (jobs) ─────────────────────────────────────────── */}
        <HomeSection title="طلبات خدمات" subtitle="عملاء يبحثون عن حِرفيين ومزوّدي خدمات" href="/jobs">
          <CardGrid loading={serviceReqs === null} empty={serviceReqs?.length === 0}
            media={false}
            emptyIcon={<ClipboardList className="h-10 w-10" />}
            emptyText={`لا توجد طلبات خدمات في ${where} بعد`}
            emptyAction={
              <Link href="/jobs/create" className="inline-flex items-center gap-2 rounded-xl border border-primary/30 px-5 py-2.5 text-body font-bold text-primary hover:bg-primary/5 transition-colors">اطلب حِرفياً أو مزوّد خدمة</Link>
            }>
            {serviceReqs?.slice(0, 4).map((j) => <JobCard key={j.id} job={j} />)}
          </CardGrid>
        </HomeSection>

        {/* ─── لماذا مسكني — إشارات ثقة بدل أرقامٍ تفضح الفراغ ───────────── */}
        <TrustStrip />
      </div>

      {/* دعوة الإبلاغ — تُذكَر مرّة واحدة في القاع بعد أن انتقل التعريف بالميزة
          إلى شريط الثقة أعلى الصفحة بصياغة إيجابية. */}
      <section className="bg-primary/[0.04] border-t border-ink/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-start">
          <span className="w-12 h-12 rounded-2xl bg-danger-50 text-danger flex items-center justify-center flex-shrink-0">
            <ShieldWarning weight="Bold" className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <h2 className="text-h3 text-ink">تعرّضت لاحتيال عقاري؟</h2>
            <p className="text-caption text-muted mt-0.5">
              بلاغك يحمي غيرك — يراه المجتمع ويصوّت عليه
            </p>
          </div>
          <Link href="/reports/create" className="flex-shrink-0">
            <Button variant="danger">رفع بلاغ</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

// ─── شريط الأقسام السريعة ────────────────────────────────────────────────
const CATEGORIES = [
  { href: "/properties", label: "العقارات", Icon: Buildings2 },
  { href: "/services", label: "الخدمات", Icon: UsersGroupRounded },
  { href: "/requests", label: "طلبات عقارية", Icon: ClipboardList },
  { href: "/jobs", label: "طلبات خدمات", Icon: Home2 },
  { href: "/properties?view=map", label: "الخريطة", Icon: MapPoint },
];

function CategoryStrip() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 sm:justify-center scrollbar-none">
      {CATEGORIES.map(({ href, label, Icon }) => (
        <Link
          key={label}
          href={href}
          className="group flex flex-col items-center gap-2 flex-shrink-0 w-24 sm:w-28"
        >
          <div className="w-14 h-14 rounded-2xl bg-white card-shadow flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white group-hover:-translate-y-0.5 transition-all duration-200">
            <Icon weight="Bold" className="h-6 w-6" />
          </div>
          <span className="text-caption font-semibold text-ink group-hover:text-primary transition-colors">{label}</span>
        </Link>
      ))}
    </div>
  );
}

// ─── عقارات مميّزة — كاروسيل أفقي (بطاقات أكبر بأسلوب Gathern) ────────────
function FeaturedRow({ properties }: { properties: Property[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-h2 text-ink">عقارات مميّزة</h2>
          <p className="text-muted text-body mt-0.5">الأكثر رواجًا الآن</p>
        </div>
        <Link href="/properties">
          <Button variant="outline" size="sm">عرض الكل <AltArrowLeft className="h-4 w-4" /></Button>
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-x min-h-[300px]">
        {properties.map((p) => (
          <div key={p.id} className="w-[260px] sm:w-[288px] flex-shrink-0 snap-start">
            <PropertyCard property={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── المدن (وجهات) — دوائر صور المحافظات + بوردر أكتيف للمدينة المحدّدة ────
function CitiesStrip({ cities }: { cities: City[] }) {
  const router = useRouter();
  const { cityId, setCity } = useCity();

  if (!cities.length) return null;

  /**
   * المدن ذات المخزون أولاً، ثم الترتيب المُدار من الخادم (`order` — العاصمة
   * فالكبرى). في سوقٍ ناشئ مدينةٌ واحدة قد تحمل كل العقارات، ودفنها خلف عشرين
   * دائرة فارغة يعني ألّا يصل إليها أحد. وحين يمتلئ السوق يعود الترتيب المُدار
   * تلقائياً — فالقاعدة تتحلّل بلطف بلا تدخّل.
   */
  const ordered = [...cities].sort(
    (a, b) => Number((b.properties_count ?? 0) > 0) - Number((a.properties_count ?? 0) > 0),
  );

  const pick = (c: City) => {
    setCity(String(c.id), c.name_ar);      // المدينة العامة (نفس مصدر التطبيق/المودال)
    router.push(`/properties?city=${c.id}`);
  };

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-h2 text-ink">في كل مكان لك بيت</h2>
        <p className="text-caption text-muted mt-1">
          اختر مدينتك — الرقم تحت كل اسم هو عدد العقارات المعروضة فيها
        </p>
      </div>
      <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-3 scrollbar-none">
        {ordered.map((c) => {
          const on = cityId === String(c.id);
          return (
            <button
              key={c.id}
              onClick={() => pick(c)}
              className="flex flex-col items-center gap-2 flex-shrink-0 w-[72px] sm:w-[84px] group"
              aria-pressed={on}
            >
              {/* حاوية موحّدة الارتفاع، الدائرة في الأسفل — تتحاذى كل المدن على نفس الخط.
                  عند وجود image_popout: يبرز المعلم فوق الدائرة (أسلوب Gathern). */}
              <div className="relative w-[64px] h-[89px] sm:w-[76px] sm:h-[106px] flex items-end justify-center">
                {c.image_popout ? (
                  <>
                    <div className={`absolute bottom-0 inset-x-0 aspect-square rounded-full transition-all duration-200 ${on ? "ring-[3px] ring-primary shadow-[0_4px_16px_rgba(79,35,150,0.35)]" : "ring-1 ring-black/5"}`} />
                    {/* صورة المعلم البارز (215 ك.ب من R2 لعنصر بعرض 76 بكسل). */}
                    <Image
                      src={c.image_popout}
                      alt={c.name_ar}
                      width={228}
                      height={318}
                      loading="lazy"
                      quality={70}
                      className="absolute bottom-0 inset-x-0 w-full h-auto pointer-events-none select-none origin-bottom group-hover:scale-[1.06] transition-transform duration-300"
                    />
                  </>
                ) : (
                  <div className={`rounded-full p-[3px] transition-all duration-200 ${on ? "bg-primary shadow-[0_4px_16px_rgba(79,35,150,0.35)]" : "bg-transparent"}`}>
                    <div className="w-[64px] h-[64px] sm:w-[76px] sm:h-[76px] rounded-full overflow-hidden bg-gradient-to-br from-primary-700 to-primary ring-1 ring-black/5">
                      {/* دائرة 76 بكسل كانت تُنزّل صورة 90 ك.ب بحجمها الأصلي
                          × 21 محافظة. next/image يقصّها إلى مقاس العرض. */}
                      <Image
                        src={c.image || `/cities/${c.id}.webp`}
                        alt={c.name_ar}
                        width={152}
                        height={152}
                        loading="lazy"
                        quality={70}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>
                )}
              </div>
              <span className={`text-caption font-semibold line-clamp-1 max-w-full ${on ? "text-primary" : "text-ink"}`}>
                {c.name_ar}
              </span>
              {/* ⚠️ العدد ضرورة لا زينة: الدوائر منقولة من Gathern حيث صورة
                  الوجهة تبيع الرغبة. في العقار يحتاج المستخدم رقماً — ومعلمٌ
                  جميل لمدينة خلفه صفر عقار فخٌّ يقود إلى صفحة فارغة. */}
              {/* السطر محجوز دائماً لتتحاذى الدوائر، ويُملأ حين يوجد مخزون
                  فقط: كتابة «لا عقارات» تحت كل دائرة تُميت الشريط بصرياً بلا
                  أن تفيد أحداً. */}
              <span className="text-[11px] tabular-nums leading-none text-muted h-3">
                {(c.properties_count ?? 0) > 0
                  ? `${c.properties_count!.toLocaleString("ar")} عقار`
                  : ""}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─── قسم صفحة رئيسية موحّد: عنوان + «عرض الكل» ────────────────────────────
/**
 * ⚠️ كانت الأقسام الأربعة متطابقة تماماً: نفس التخطيط ونفس حجم البطاقة ونفس
 * «عرض الكل» — فيُعطى **المنتج الأساسي** (العقارات) وزنَ «طلبات خدمات» التي
 * فيها عنصر واحد في المنصّة كلّها. `tone` يفصل الرئيسيّ عن الثانويّ.
 */
function HomeSection({ title, subtitle, href, tone = "secondary", children }: {
  title: string; subtitle: string; href: string;
  tone?: "primary" | "secondary"; children: React.ReactNode;
}) {
  const isPrimary = tone === "primary";
  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h2 className={isPrimary ? "text-h2 text-ink" : "text-h3 text-ink"}>{title}</h2>
          <p className="text-caption text-muted mt-1">{subtitle}</p>
        </div>
        <Link href={href} className="flex-shrink-0">
          <Button variant={isPrimary ? "primary" : "outline"} size="sm">
            عرض الكل <AltArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      {children}
    </section>
  );
}

// صفّ كاروسيل أفقي (بأسلوب Gathern) — بديل الشبكة الجامدة.
/**
 * ⚠️ كانت كاروسيلاً أفقياً بأربعة عناصر كحدّ أقصى (`limit: 4`). الكاروسيل وعدٌ
 * بأن «هناك المزيد على اليسار»؛ بأربع بطاقات في حاوية 1200 بكسل تحصل على فراغ
 * واسع وإيماءة كاذبة. وكانت العروض ثلاثة مختلفة (240 · 270 · 300) فلا تتحاذى
 * الصفوف فيما بينها. شبكةٌ تعرض كل ما لديك بلا ادّعاء.
 */
function CardGrid({ loading, empty, emptyIcon, emptyText, emptyAction, media = true, children }: {
  loading: boolean; empty?: boolean; emptyIcon: React.ReactNode; emptyText: string;
  emptyAction?: React.ReactNode;
  /** بطاقات وسائطية (صورة) أم نصّية — يحدّد الارتفاع المحجوز */
  media?: boolean;
  children: React.ReactNode;
}) {
  // الارتفاع الأدنى موحّد في الحالات الثلاث (تحميل/فارغ/محتوى): اختلافه كان
  // يُقفز الصفحة تحت إصبع القارئ عند وصول البيانات (CLS = 0.184).
  //
  // ⚠️ لكنّه يجب أن يطابق **ارتفاع البطاقة الحقيقي**: فرضُ 320 بكسل على بطاقة
  // نصّية ارتفاعها ~190 يُنتج فراغاً أبيض هائلاً وسطها — رأيناه في الطلبات
  // والخدمات بعد تحويلها إلى بطاقات نصّية.
  const reserve = media ? "min-h-[320px]" : "min-h-[190px]";
  const grid = `grid grid-cols-2 lg:grid-cols-4 gap-4 ${reserve}`;

  if (loading) {
    return (
      <div className={grid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-2 ring-1 ring-ink/[0.06] shadow-e1">
            {media && <Skeleton className="aspect-[3/2] w-full rounded-lg" />}
            <div className="px-1.5 pt-3 space-y-2.5">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (empty) {
    return (
      <div className={`bg-white rounded-2xl ring-1 ring-ink/[0.06] shadow-e1 ${reserve} flex flex-col items-center justify-center text-primary-200 px-6 text-center`}>
        {emptyIcon}
        <p className="text-body text-muted mt-3">{emptyText}</p>
        {/* سوقٌ جديد يبدأ فارغاً بالضرورة. صندوقٌ رماديّ صامت يقول للزائر «المنصّة
            ميتة»؛ ودعوةٌ صريحة تقول «كن أوّل من ينشر هنا» — وهي أرخص وسيلة لرفع
            المخزون، وهو سقف المنصّة الحقيقي. */}
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    );
  }
  return <div className={grid}>{children}</div>;
}

// ملاحظة: بطاقة العقار موحّدة في components/properties/PropertyCard (لا تكرار محلي).

// ─── بطاقة خدمة ──────────────────────────────────────────────────────────
// category قد تصل ككائن {name_ar,icon} أو كسلسلة (نوع legacy) — نحلّها بأمان.
function categoryOf(cat: unknown): { name: string; icon?: string } {
  if (cat && typeof cat === "object") {
    const o = cat as { name_ar?: string; icon?: string };
    return { name: o.name_ar ?? "", icon: o.icon };
  }
  return { name: typeof cat === "string" ? cat : "" };
}

// كل البطاقات التالية توحّد شكل بطاقة Gathern: رأس وسائط (صورة/تدرّج+أيقونة)
// بحواف دائرية، ثم محتوى نظيف بعنوان وموقع وفاصل وسطر سفلي.
function ServiceCard({ service }: { service: ServiceProvider }) {
  const cat = categoryOf(service.category);
  const Icon = getServiceIcon(cat.icon);
  const city = service.cities_names?.[0];
  const rating = typeof service.average_rating === "number" && service.average_rating > 0 ? service.average_rating : null;
  return (
    <Link href={`/services/${service.id}`} className="group block h-full">
      <article className="h-full flex flex-col bg-white rounded-2xl ring-1 ring-ink/[0.06] shadow-e1 hover:shadow-e3 transition-shadow duration-200 overflow-hidden">
        {/* ⚠️ كانت كتلة ذهبية بنسبة 4:3 تشغل 60% من البطاقة — لوحٌ صارخ لمزوّد
            خدمة لا صورة له. الشريط الرفيع يحمل هوية القسم بلا ادّعاء وسائط. */}
        <span className="h-1 bg-gold flex-shrink-0" />
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-gold-50 text-gold-800 flex items-center justify-center flex-shrink-0">
              <Icon weight="Bold" className="h-5 w-5" />
            </span>
            <span className="text-caption font-bold text-ink line-clamp-1">{cat.name || "خدمة"}</span>
            {rating && (
              <span className="ms-auto flex items-center gap-1 text-caption font-bold text-ink flex-shrink-0 tabular-nums">
                <Star weight="Bold" className="h-4 w-4 text-gold-500" />
                {rating.toLocaleString("ar-EG", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
            )}
          </div>

          <h3 className="text-body font-semibold text-ink mt-3 line-clamp-2 leading-snug">{service.title}</h3>

          <div className="flex items-center gap-1.5 text-caption text-muted mt-1.5">
            <MapPoint className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{city || "عدّة مدن"}</span>
          </div>

          <div className="mt-auto pt-3 border-t border-ink/[0.06]">
            <span className="text-caption font-bold text-primary flex items-center gap-1">
              عرض الخدمة <AltArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─── بطاقة طلب عقاري ─────────────────────────────────────────────────────
/**
 * ⚠️ بطاقات الطلبات كانت تُقلّد بطاقة العقار: كتلة بنسبة 4:3 تشغل ~60% من
 * البطاقة، وفيها أيقونة فوق تدرّج بنفسجي — لأن الطلب لا صورة له أصلاً. أربع
 * بطاقات متجاورة = أربعة ألواح بنفسجية متطابقة تسحق قسم العقارات الذي فوقها.
 *
 * الطلب **بيانات نصّية** (نوع · مكان · ميزانية · عدد العروض) فلا يجوز أن يرتدي
 * تخطيطاً وسائطياً ويترك 60% منه فارغاً. البطاقة صارت نصّية مضغوطة: شريط لونيّ
 * رفيع يحمل الهوية بلا ادّعاء صورة.
 */
function RequestCard({ request }: { request: ClientRequest }) {
  const type = PROPERTY_TYPE_LABELS[request.property_type] ?? request.property_type;
  const offer = offerTypeLabels[request.offer_type] ?? request.offer_type;
  const budget =
    request.budget_min && request.budget_max ? `${formatPrice(request.budget_min, request.currency)} — ${formatPrice(request.budget_max, request.currency)}`
    : request.budget_max ? `حتى ${formatPrice(request.budget_max, request.currency)}`
    : request.budget_min ? `من ${formatPrice(request.budget_min, request.currency)}` : null;
  return (
    <Link href={`/requests/${request.id}`} className="group block h-full">
      <article className="h-full flex flex-col bg-white rounded-2xl ring-1 ring-ink/[0.06] shadow-e1 hover:shadow-e3 transition-shadow duration-200 overflow-hidden">
        <span className="h-1 bg-primary/70 flex-shrink-0" />
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center flex-shrink-0">
              <ClipboardList weight="Bold" className="h-5 w-5" />
            </span>
            <span className="text-caption font-bold text-primary line-clamp-1">مطلوب · {type}</span>
            <span className="ms-auto text-caption font-bold px-2 py-0.5 rounded-md bg-cream text-ink flex-shrink-0">{offer}</span>
          </div>

          <h3 className="text-body font-semibold text-ink mt-3 line-clamp-2 leading-snug">
            {request.title || `يبحث عن ${type}`}
          </h3>

          <div className="flex items-center gap-1.5 text-caption text-muted mt-1.5">
            <MapPoint className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{request.city_name}{request.neighborhood && ` — ${request.neighborhood}`}</span>
          </div>

          <div className="mt-auto pt-3 border-t border-ink/[0.06] flex items-baseline justify-between gap-2">
            {budget
              ? <span className="text-price-sm text-primary line-clamp-1">{budget}</span>
              : <span className="text-body text-muted">حسب العرض</span>}
            <span className="text-caption text-muted flex-shrink-0 tabular-nums">
              {request.offers_count > 0
                ? `${request.offers_count.toLocaleString("ar-EG")} عرض`
                : "لا عروض بعد"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─── بطاقة طلب خدمة (jobs) ───────────────────────────────────────────────
function JobCard({ job }: { job: ServiceRequest }) {
  const cat = categoryOf(job.category);
  const Icon = getServiceIcon(cat.icon);
  const budget =
    job.budget_min && job.budget_max ? `${formatPrice(job.budget_min, job.currency)} — ${formatPrice(job.budget_max, job.currency)}`
    : job.budget_max ? `حتى ${formatPrice(job.budget_max, job.currency)}`
    : job.budget_min ? `من ${formatPrice(job.budget_min, job.currency)}` : null;
  return (
    <Link href={`/jobs/${job.id}`} className="group block h-full">
      <article className="h-full flex flex-col bg-white rounded-2xl ring-1 ring-ink/[0.06] shadow-e1 hover:shadow-e3 transition-shadow duration-200 overflow-hidden">
        <span className="h-1 bg-gold flex-shrink-0" />
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-gold-50 text-gold-800 flex items-center justify-center flex-shrink-0">
              <Icon weight="Bold" className="h-5 w-5" />
            </span>
            <span className="text-caption font-bold text-ink line-clamp-1">{cat.name || "طلب خدمة"}</span>
          </div>

          <h3 className="text-body font-semibold text-ink mt-3 line-clamp-2 leading-snug">{job.title}</h3>

          <div className="flex items-center gap-1.5 text-caption text-muted mt-1.5">
            <MapPoint className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{job.city_name}</span>
          </div>

          <div className="mt-auto pt-3 border-t border-ink/[0.06] flex items-baseline justify-between gap-2">
            {budget
              ? <span className="text-price-sm text-primary line-clamp-1">{budget}</span>
              : <span className="text-body text-muted">حسب العرض</span>}
            <span className="text-caption text-muted flex-shrink-0 tabular-nums">
              {job.offers_count > 0
                ? `${job.offers_count.toLocaleString("ar-EG")} عرض`
                : "لا عروض بعد"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
