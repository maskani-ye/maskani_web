"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCity } from "@/context/CityContext";
import { api } from "@/lib/api";
import { formatPrice, offerTypeLabels } from "@/lib/utils";
import type { Property, ServiceProvider, ClientRequest } from "@/types";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { getServiceIcon } from "@/lib/serviceIcons";
import { DownloadAppBadge } from "@/components/download/DownloadAppBadge";
import {
  Buildings2, ShieldWarning, AltArrowLeft, MapPoint, Magnifer,
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

interface City { id: number; name_ar: string; image?: string | null; image_popout?: string | null }

export default function HomeClient() {
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [services, setServices] = useState<ServiceProvider[] | null>(null);
  const [requests, setRequests] = useState<ClientRequest[] | null>(null);
  const [serviceReqs, setServiceReqs] = useState<ServiceRequest[] | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [featured, setFeatured] = useState<Property[] | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    api.get("/stats/").then((r) => setStats(r.data ?? null)).catch(() => setStats(null));
    api.get("/properties/featured/?limit=8").then((r) => setFeatured(r.data.results ?? r.data ?? [])).catch(() => setFeatured([]));
    api.get("/properties/?limit=4&offset=0").then((r) => setProperties(r.data.results ?? [])).catch(() => setProperties([]));
    api.get("/services/?limit=4&offset=0").then((r) => setServices(r.data.results ?? [])).catch(() => setServices([]));
    api.get("/requests/?limit=4&offset=0").then((r) => setRequests(r.data.results ?? [])).catch(() => setRequests([]));
    api.get("/jobs/?limit=4&offset=0").then((r) => setServiceReqs(r.data.results ?? [])).catch(() => setServiceReqs([]));
    // `_t` يتجاوز كاش المتصفّح (المدن صارت قابلة للتحرير — صورة المحافظة تتغيّر).
    api.get("/cities/", { params: { _t: Date.now() } }).then((r) => setCities(r.data.results ?? r.data ?? [])).catch(() => setCities([]));
  }, []);

  return (
    <div>
      {/* ─── Hero + بحث (بأسلوب Gathern — صورة مدينة + تراكب بنفسجي) ──────── */}
      <section className="relative bg-primary-800 text-white overflow-hidden">
        {/* صورة معلم يمني (صنعاء القديمة) عريضة عالية الدقّة كخلفية للهيرو */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cities/_hero.webp" alt="" aria-hidden className="w-full h-full object-cover object-center opacity-45" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/80 via-primary-800/82 to-primary-900/90" />
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute bottom-0 left-10 w-56 h-56 rounded-full bg-gold blur-[90px]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-28 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-center"
          >
            <span className="inline-block text-xs font-bold tracking-wide bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-5 backdrop-blur-sm">
              منصّة عقارية اجتماعية · تواصل مباشر
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-[1.15] text-balance">
              ابحث عن <span className="text-gold">مسكنك</span> المثالي
            </h1>
            <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto">
              عقارات، خدمات، وطلبات — ومجتمع يحميك من الاحتيال العقاري
            </p>
            <div className="mt-7 flex justify-center">
              <DownloadAppBadge variant="light" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── بطاقة البحث العائمة ─────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 md:-mt-24 relative z-10">
        <HeroSearch cities={cities} />
      </div>

      {/* ─── المدن (وجهات بأسلوب Gathern + بوردر أكتيف) ───────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10">
        <CitiesStrip cities={cities} />
      </div>

      {/* ─── عقارات مميّزة — كاروسيل أفقي (الأكثر رواجًا) ─────────────────── */}
      {featured && featured.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-12">
          <FeaturedRow properties={featured} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        {/* ─── الخريطة ────────────────────────────────────────────────────── */}
        <Link href="/properties?view=map" className="block">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-primary-800 via-primary to-primary-600 text-white p-6 sm:p-7 flex items-center gap-4 card-shadow hover:card-shadow-hover transition-all">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0"><MapPoint weight="Bold" className="h-7 w-7" /></div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold">تصفّح العقارات على الخريطة</h2>
              <p className="text-primary-100 text-sm mt-0.5">اكتشف العقارات حسب موقعها الجغرافي</p>
            </div>
            <AltArrowLeft className="h-5 w-5 flex-shrink-0" />
          </div>
        </Link>

        {/* ─── العقارات ──────────────────────────────────────────────────── */}
        <HomeSection title="العقارات" subtitle="أحدث العقارات للبيع والإيجار" href="/properties">
          <CardGrid loading={properties === null} empty={properties?.length === 0}
            emptyIcon={<Buildings2 className="h-10 w-10" />} emptyText="لا توجد عقارات بعد">
            {properties?.slice(0, 4).map((l) => <PropertyCard key={l.id} property={l} />)}
          </CardGrid>
        </HomeSection>

        {/* ─── الخدمات ────────────────────────────────────────────────────── */}
        <HomeSection title="الخدمات" subtitle="مزوّدو خدمات عقارية متخصّصون" href="/services">
          <CardGrid loading={services === null} empty={services?.length === 0}
            emptyIcon={<UsersGroupRounded className="h-10 w-10" />} emptyText="لا توجد خدمات بعد">
            {services?.slice(0, 4).map((s) => <ServiceCard key={s.id} service={s} />)}
          </CardGrid>
        </HomeSection>

        {/* ─── طلبات عقارية (demands) ─────────────────────────────────────── */}
        <HomeSection title="طلبات عقارية" subtitle="عملاء يبحثون عن عقارات — قدّم عرضك" href="/requests">
          <CardGrid loading={requests === null} empty={requests?.length === 0}
            emptyIcon={<ClipboardList className="h-10 w-10" />} emptyText="لا توجد طلبات عقارية بعد">
            {requests?.slice(0, 4).map((r) => <RequestCard key={r.id} request={r} />)}
          </CardGrid>
        </HomeSection>

        {/* ─── طلبات خدمات (jobs) ─────────────────────────────────────────── */}
        <HomeSection title="طلبات خدمات" subtitle="عملاء يبحثون عن حِرفيين ومزوّدي خدمات" href="/jobs">
          <CardGrid loading={serviceReqs === null} empty={serviceReqs?.length === 0}
            emptyIcon={<ClipboardList className="h-10 w-10" />} emptyText="لا توجد طلبات خدمات بعد">
            {serviceReqs?.slice(0, 4).map((j) => <JobCard key={j.id} job={j} />)}
          </CardGrid>
        </HomeSection>

        {/* ─── أرقام مسكني (آخر قسم) ─────────────────────────────────────── */}
        {stats && <StatsSection stats={stats} />}
      </div>

      {/* ─── بلاغات الاحتيال (ثانوي) ─────────────────────────────────────── */}
      <section className="bg-primary/5 border-y border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">هل تعرّضت لاحتيال عقاري؟</h2>
          <p className="text-gray-500 mb-6 max-w-xl mx-auto">شارك تجربتك مع المجتمع وساعد الآخرين على تجنّب المحتالين</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/reports/create"><Button size="lg" variant="danger"><ShieldWarning className="h-5 w-5" /> رفع بلاغ احتيال</Button></Link>
            <Link href="/reports"><Button size="lg" variant="outline">تصفّح البلاغات</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── بطاقة البحث العائمة (بأسلوب Gathern) ────────────────────────────────
function HeroSearch({ cities }: { cities: City[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");

  const onSearch = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("search", q.trim());
    if (city) params.set("city", city);
    router.push(`/properties${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
      className="bg-white rounded-3xl shadow-[0_12px_48px_rgba(79,35,150,0.18)] border border-primary/5 p-3 sm:p-3.5"
    >
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1 flex items-center gap-2.5 bg-cream rounded-2xl px-4 py-3.5">
          <Magnifer className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="ابحث عن شقة، فيلا، أرض…"
            className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400 text-sm min-w-0"
          />
        </div>
        <div className="flex items-center gap-2.5 bg-cream rounded-2xl px-4 py-3.5 sm:w-48">
          <MapPoint className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-900 text-sm cursor-pointer min-w-0"
          >
            <option value="">كل المدن</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name_ar}</option>
            ))}
          </select>
        </div>
        <Button size="lg" onClick={onSearch} className="sm:px-8 rounded-2xl">
          <Magnifer weight="Bold" className="h-5 w-5" /> بحث
        </Button>
      </div>
    </motion.div>
  );
}

// ─── عقارات مميّزة — كاروسيل أفقي (بطاقات أكبر بأسلوب Gathern) ────────────
function FeaturedRow({ properties }: { properties: Property[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">عقارات مميّزة</h2>
          <p className="text-gray-500 text-sm mt-0.5">الأكثر رواجًا الآن</p>
        </div>
        <Link href="/properties">
          <Button variant="outline" size="sm">عرض الكل <AltArrowLeft className="h-4 w-4" /></Button>
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-x">
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

  const pick = (c: City) => {
    setCity(String(c.id), c.name_ar);      // المدينة العامة (نفس مصدر التطبيق/المودال)
    router.push(`/properties?city=${c.id}`);
  };

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">في كل مكان لك بيت</h2>
        <p className="text-gray-500 text-sm mt-0.5">اختر محافظتك — المحدّدة معلَّمة بإطار</p>
      </div>
      <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-3 scrollbar-none">
        {cities.map((c) => {
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.image_popout}
                      alt={c.name_ar}
                      loading="lazy"
                      className="absolute bottom-0 inset-x-0 w-full h-auto pointer-events-none select-none origin-bottom group-hover:scale-[1.06] transition-transform duration-300"
                    />
                  </>
                ) : (
                  <div className={`rounded-full p-[3px] transition-all duration-200 ${on ? "bg-primary shadow-[0_4px_16px_rgba(79,35,150,0.35)]" : "bg-transparent"}`}>
                    <div className="w-[64px] h-[64px] sm:w-[76px] sm:h-[76px] rounded-full overflow-hidden bg-gradient-to-br from-primary-700 to-primary ring-1 ring-black/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.image || `/cities/${c.id}.webp`}
                        alt={c.name_ar}
                        loading="lazy"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>
                )}
              </div>
              <span className={`text-xs font-semibold line-clamp-1 max-w-full ${on ? "text-primary" : "text-gray-700"}`}>{c.name_ar}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─── أرقام مسكني — إحصاءات المنصّة (آخر قسم) ──────────────────────────────
function StatsSection({ stats }: { stats: Record<string, number> }) {
  const items = [
    { key: "properties", label: "عقار", Icon: Buildings2 },
    { key: "services", label: "مزوّد خدمة", Icon: UsersGroupRounded },
    { key: "demands", label: "طلب عقاري", Icon: ClipboardList },
    { key: "jobs", label: "طلب خدمة", Icon: Home2 },
    { key: "users", label: "عضو", Icon: Star },
    { key: "cities", label: "محافظة", Icon: MapPoint },
  ];
  return (
    <section className="bg-gradient-to-br from-primary-800 to-primary-600 rounded-3xl px-4 sm:px-8 py-10 text-white overflow-hidden">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold">مسكني بالأرقام</h2>
        <p className="text-white/70 text-sm mt-1">مجتمع عقاري يمنيّ يكبر كل يوم</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
        {items.map(({ key, label, Icon }) => (
          <div key={key} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center text-center border border-white/10">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-3">
              <Icon weight="Bold" className="h-5 w-5 text-gold" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold tabular-nums">
              {(stats[key] ?? 0).toLocaleString("ar-EG")}
            </span>
            <span className="text-white/70 text-xs mt-1">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── قسم صفحة رئيسية موحّد: عنوان + «عرض الكل» ────────────────────────────
function HomeSection({ title, subtitle, href, children }: {
  title: string; subtitle: string; href: string; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>
        </div>
        <Link href={href}>
          <Button variant="outline" size="sm">عرض الكل <AltArrowLeft className="h-4 w-4" /></Button>
        </Link>
      </div>
      {children}
    </section>
  );
}

// صفّ كاروسيل أفقي (بأسلوب Gathern) — بديل الشبكة الجامدة.
function CardGrid({ loading, empty, emptyIcon, emptyText, children }: {
  loading: boolean; empty?: boolean; emptyIcon: React.ReactNode; emptyText: string; children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-[240px] sm:w-[270px] flex-shrink-0 bg-white rounded-2xl p-2.5 shadow-card">
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            <div className="p-1.5 pt-3 space-y-2.5"><Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-5 w-1/3" /></div>
          </div>
        ))}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="bg-white rounded-2xl card-shadow py-12 flex flex-col items-center text-gray-300">
        {emptyIcon}<p className="text-gray-400 text-sm mt-3">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-x">
      {React.Children.map(children, (ch) => (
        <div className="w-[240px] sm:w-[270px] flex-shrink-0 snap-start">{ch}</div>
      ))}
    </div>
  );
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
    <Link href={`/services/${service.id}`}>
      <div className="bg-white rounded-2xl p-2.5 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer h-full flex flex-col group">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-gold-400 to-gold-600">
          <Icon weight="Bold" className="h-14 w-14 text-white/90 group-hover:scale-110 transition-transform duration-300" />
          {rating && (
            <span className="absolute top-2.5 right-2.5 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-white/95 text-gray-900 shadow-sm">
              <Star weight="Bold" className="h-3.5 w-3.5 text-gold-500" />{rating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="px-1.5 pt-3 pb-1 flex flex-col flex-1">
          <span className="text-xs font-bold text-gold-600 mb-1 line-clamp-1">{cat.name || "خدمة"}</span>
          <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{service.title}</h3>
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-2.5">
            <MapPoint className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{city || "عدّة مدن"}</span>
          </div>
          <div className="mt-auto pt-2.5 border-t border-gray-100">
            <span className="text-primary text-xs font-bold flex items-center gap-1">عرض الخدمة <AltArrowLeft className="h-3.5 w-3.5" /></span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── بطاقة طلب عقاري ─────────────────────────────────────────────────────
function RequestCard({ request }: { request: ClientRequest }) {
  const type = PROPERTY_TYPE_LABELS[request.property_type] ?? request.property_type;
  const offer = offerTypeLabels[request.offer_type] ?? request.offer_type;
  const budget =
    request.budget_min && request.budget_max ? `${formatPrice(request.budget_min, request.currency)} — ${formatPrice(request.budget_max, request.currency)}`
    : request.budget_max ? `حتى ${formatPrice(request.budget_max, request.currency)}`
    : request.budget_min ? `من ${formatPrice(request.budget_min, request.currency)}` : null;
  return (
    <Link href={`/requests/${request.id}`}>
      <div className="bg-white rounded-2xl p-2.5 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer h-full flex flex-col group">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
          <ClipboardList weight="Bold" className="h-14 w-14 text-white/85 group-hover:scale-110 transition-transform duration-300" />
          <span className="absolute top-2.5 right-2.5 text-xs font-bold px-3 py-1 rounded-full bg-white/95 text-primary shadow-sm">{offer}</span>
        </div>
        <div className="px-1.5 pt-3 pb-1 flex flex-col flex-1">
          <span className="text-xs font-bold text-primary mb-1">مطلوب · {type}</span>
          <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{request.title || `يبحث عن ${type}`}</h3>
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-2.5">
            <MapPoint className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{request.city_name}{request.neighborhood && ` — ${request.neighborhood}`}</span>
          </div>
          <div className="mt-auto pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
            {budget ? <span className="text-primary font-extrabold text-sm line-clamp-1">{budget}</span> : <span className="text-gray-400 text-xs">حسب العرض</span>}
            <span className="text-xs text-gray-400 flex-shrink-0">{request.offers_count} عرض</span>
          </div>
        </div>
      </div>
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
    <Link href={`/jobs/${job.id}`}>
      <div className="bg-white rounded-2xl p-2.5 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer h-full flex flex-col group">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
          <Icon weight="Bold" className="h-14 w-14 text-white/90 group-hover:scale-110 transition-transform duration-300" />
        </div>
        <div className="px-1.5 pt-3 pb-1 flex flex-col flex-1">
          <span className="text-xs font-bold text-primary mb-1 line-clamp-1">{cat.name || "طلب خدمة"}</span>
          <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{job.title}</h3>
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-2.5">
            <MapPoint className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{job.city_name}</span>
          </div>
          <div className="mt-auto pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
            {budget ? <span className="text-primary font-extrabold text-sm line-clamp-1">{budget}</span> : <span className="text-gray-400 text-xs">حسب العرض</span>}
            <span className="text-xs text-gray-400 flex-shrink-0">{job.offers_count} عرض</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
