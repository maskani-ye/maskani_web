"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatPrice, offerTypeLabels } from "@/lib/utils";
import type { Listing, ServiceProvider, ClientRequest } from "@/types";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { getServiceIcon } from "@/lib/serviceIcons";
import {
  Buildings2, ShieldWarning, AltArrowLeft, MapPoint, Bed, Ruler, Eye,
  Star, UsersGroupRounded, Wallet, ClipboardList,
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

export default function HomeClient() {
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [services, setServices] = useState<ServiceProvider[] | null>(null);
  const [requests, setRequests] = useState<ClientRequest[] | null>(null);
  const [serviceReqs, setServiceReqs] = useState<ServiceRequest[] | null>(null);

  useEffect(() => {
    api.get("/listings/?limit=4&offset=0").then((r) => setListings(r.data.results ?? [])).catch(() => setListings([]));
    api.get("/services/?limit=4&offset=0").then((r) => setServices(r.data.results ?? [])).catch(() => setServices([]));
    api.get("/requests/?limit=4&offset=0").then((r) => setRequests(r.data.results ?? [])).catch(() => setRequests([]));
    api.get("/jobs/?limit=4&offset=0").then((r) => setServiceReqs(r.data.results ?? [])).catch(() => setServiceReqs([]));
  }, []);

  return (
    <div>
      {/* ─── Hero + بحث ──────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-primary-800 via-primary to-primary-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-gold blur-2xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
              ابحث عن <span className="text-gold">مسكنك</span> المثالي
            </h1>
            <p className="text-primary-100 text-base md:text-xl max-w-2xl mx-auto">
              منصة عقارية اجتماعية — إعلانات، خدمات، طلبات، ومجتمع لمكافحة الاحتيال
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        {/* ─── الخريطة ────────────────────────────────────────────────────── */}
        <Link href="/listings?view=map" className="block">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-primary-800 via-primary to-primary-600 text-white p-6 sm:p-7 flex items-center gap-4 card-shadow hover:card-shadow-hover transition-all">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0"><MapPoint weight="Bold" className="h-7 w-7" /></div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold">تصفّح العقارات على الخريطة</h2>
              <p className="text-primary-100 text-sm mt-0.5">اكتشف الإعلانات حسب موقعها الجغرافي</p>
            </div>
            <AltArrowLeft className="h-5 w-5 flex-shrink-0" />
          </div>
        </Link>

        {/* ─── الإعلانات ──────────────────────────────────────────────────── */}
        <HomeSection title="الإعلانات" subtitle="أحدث العقارات للبيع والإيجار" href="/listings">
          <CardGrid loading={listings === null} empty={listings?.length === 0}
            emptyIcon={<Buildings2 className="h-10 w-10" />} emptyText="لا توجد إعلانات بعد">
            {listings?.slice(0, 4).map((l) => <ListingCard key={l.id} listing={l} />)}
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

function CardGrid({ loading, empty, emptyIcon, emptyText, children }: {
  loading: boolean; empty?: boolean; emptyIcon: React.ReactNode; emptyText: string; children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl card-shadow overflow-hidden">
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="p-4 space-y-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-5 w-1/3" /></div>
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
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{children}</div>;
}

// ─── بطاقة إعلان ─────────────────────────────────────────────────────────
function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="bg-white rounded-2xl card-shadow hover:card-shadow-hover transition-all duration-200 overflow-hidden cursor-pointer group h-full">
        <div className="relative h-40 bg-gray-100 overflow-hidden">
          {listing.main_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.main_image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : <div className="w-full h-full flex items-center justify-center"><Buildings2 className="h-12 w-12 text-gray-300" /></div>}
          <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full ${listing.offer_type === "sale" ? "bg-primary text-white" : "bg-gold text-white"}`}>
            {offerTypeLabels[listing.offer_type]}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-1">{listing.title}</h3>
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
            <MapPoint className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{listing.city_name}{listing.neighborhood && ` — ${listing.neighborhood}`}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            {listing.rooms ? <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5 text-primary" /> {listing.rooms}</span> : null}
            {listing.area ? <span className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5 text-primary" /> {listing.area}م²</span> : null}
            <span className="flex items-center gap-1 mr-auto"><Eye className="h-3.5 w-3.5" /> {listing.views_count}</span>
          </div>
          <p className="text-primary font-extrabold text-base">{formatPrice(listing.price, listing.currency)}</p>
        </div>
      </div>
    </Link>
  );
}

// ─── بطاقة خدمة ──────────────────────────────────────────────────────────
// category قد تصل ككائن {name_ar,icon} أو كسلسلة (نوع legacy) — نحلّها بأمان.
function categoryOf(cat: unknown): { name: string; icon?: string } {
  if (cat && typeof cat === "object") {
    const o = cat as { name_ar?: string; icon?: string };
    return { name: o.name_ar ?? "", icon: o.icon };
  }
  return { name: typeof cat === "string" ? cat : "" };
}

function ServiceCard({ service }: { service: ServiceProvider }) {
  const cat = categoryOf(service.category);
  const Icon = getServiceIcon(cat.icon);
  const city = service.cities_names?.[0];
  return (
    <Link href={`/services/${service.id}`}>
      <div className="bg-white rounded-2xl card-shadow hover:card-shadow-hover transition-all duration-200 p-4 cursor-pointer h-full flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-gold/10 text-gold flex items-center justify-center flex-shrink-0"><Icon className="h-5 w-5" /></div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{service.title}</h3>
            <p className="text-gray-400 text-xs line-clamp-1">{cat.name}</p>
          </div>
        </div>
        <p className="text-gray-500 text-xs line-clamp-2 mb-3 flex-1">{service.description}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {typeof service.average_rating === "number" && service.average_rating > 0 && (
            <span className="flex items-center gap-1"><Star weight="Bold" className="h-3.5 w-3.5 text-gold" /> {service.average_rating.toFixed(1)}</span>
          )}
          {city && <span className="flex items-center gap-1"><MapPoint className="h-3.5 w-3.5" /> {city}</span>}
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
      <div className="bg-white rounded-2xl card-shadow hover:card-shadow-hover transition-all duration-200 p-4 cursor-pointer h-full flex flex-col">
        <span className="self-start text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-2">{offer}</span>
        <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">يبحث عن {type}</h3>
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
          <MapPoint className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{request.city_name}{request.neighborhood && ` — ${request.neighborhood}`}</span>
        </div>
        {budget && <p className="text-primary font-bold text-sm flex items-center gap-1 mb-2"><Wallet className="h-4 w-4" /> {budget}</p>}
        <span className="mt-auto text-xs text-gray-400">{request.offers_count} عرض مُقدَّم</span>
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
      <div className="bg-white rounded-2xl card-shadow hover:card-shadow-hover transition-all duration-200 p-4 cursor-pointer h-full flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><Icon className="h-5 w-5" /></div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{job.title}</h3>
            <p className="text-gray-400 text-xs line-clamp-1">{cat.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-2"><MapPoint className="h-3.5 w-3.5" /> {job.city_name}</div>
        {budget && <p className="text-primary font-bold text-sm flex items-center gap-1 mb-2"><Wallet className="h-4 w-4" /> {budget}</p>}
        <span className="mt-auto text-xs text-gray-400">{job.offers_count} عرض مُقدَّم</span>
      </div>
    </Link>
  );
}
