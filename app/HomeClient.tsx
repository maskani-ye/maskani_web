"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatPrice, offerTypeLabels } from "@/lib/utils";
import type { Listing, City } from "@/types";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import {
  Search, Building2, ShieldAlert, Wrench, MessageSquarePlus, ArrowLeft,
  MapPin, BedDouble, Maximize2, Eye,
} from "lucide-react";
import { motion } from "framer-motion";

export default function HomeClient() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    city: "", property_type: "", offer_type: "",
  });

  useEffect(() => {
    api.get("/cities/").then((r) => setCities(Array.isArray(r.data) ? r.data : r.data.results ?? [])).catch(() => {});
    api.get("/listings/?page_size=8").then((r) => setListings(r.data.results)).catch(() => {});
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchFilters.city) params.set("city", searchFilters.city);
    if (searchFilters.property_type) params.set("property_type", searchFilters.property_type);
    if (searchFilters.offer_type) params.set("offer_type", searchFilters.offer_type);
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <div>
      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-primary-800 via-primary to-primary-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-gold blur-2xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
              ابحث عن <span className="text-gold">مسكنك</span> المثالي
            </h1>
            <p className="text-primary-100 text-lg md:text-xl max-w-2xl mx-auto">
              منصة عقارية اجتماعية — بيع، إيجار، خدمات، ومجتمع لمكافحة الاحتيال
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-3xl p-5 shadow-2xl max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Select
                options={cities.map((c) => ({ value: c.id, label: c.name_ar }))}
                value={searchFilters.city}
                onChange={(e) => setSearchFilters((p) => ({ ...p, city: e.target.value }))}
                placeholder="المدينة"
              />
              <Select
                options={[
                  { value: "apartment", label: "شقة" },
                  { value: "house", label: "بيت / فيلا" },
                  { value: "land", label: "أرض" },
                  { value: "commercial", label: "محل تجاري" },
                ]}
                value={searchFilters.property_type}
                onChange={(e) => setSearchFilters((p) => ({ ...p, property_type: e.target.value }))}
                placeholder="نوع العقار"
              />
              <Select
                options={[
                  { value: "sale", label: "للبيع" },
                  { value: "rent_monthly", label: "إيجار شهري" },
                  { value: "rent_yearly", label: "إيجار سنوي" },
                ]}
                value={searchFilters.offer_type}
                onChange={(e) => setSearchFilters((p) => ({ ...p, offer_type: e.target.value }))}
                placeholder="نوع العرض"
              />
              <Button onClick={handleSearch} size="lg" className="w-full">
                <Search className="h-4 w-4" />
                بحث
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Building2, label: "إعلانات للبيع والإيجار", color: "bg-primary/10 text-primary", href: "/listings" },
            { icon: Wrench, label: "خدمات عقارية متخصصة", color: "bg-gold/10 text-gold", href: "/services" },
            { icon: ShieldAlert, label: "مجتمع الشكاوي", color: "bg-red-50 text-red-600", href: "/fraud-reports" },
            { icon: MessageSquarePlus, label: "طلبات العملاء", color: "bg-blue-50 text-blue-600", href: "/requests" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className="bg-white rounded-2xl p-5 card-shadow hover:card-shadow-hover transition-all duration-200 text-center cursor-pointer">
                  <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Latest Listings ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">أحدث الإعلانات</h2>
            <p className="text-gray-500 text-sm mt-1">أحدث العقارات المتاحة على المنصة</p>
          </div>
          <Link href="/listings">
            <Button variant="outline" size="sm">
              عرض الكل <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-primary/5 border-y border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            هل تعرّضت لاحتيال عقاري؟
          </h2>
          <p className="text-gray-500 mb-6 max-w-xl mx-auto">
            شارك تجربتك مع المجتمع وساعد الآخرين على تجنّب المحتالين
          </p>
          <Link href="/fraud-reports/create">
            <Button size="lg" variant="danger">
              <ShieldAlert className="h-5 w-5" />
              رفع بلاغ احتيال
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="bg-white rounded-2xl card-shadow hover:card-shadow-hover transition-all duration-200 overflow-hidden cursor-pointer group">
        <div className="relative h-44 bg-gray-100 overflow-hidden">
          {listing.main_image ? (
            <img
              src={listing.main_image}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="h-12 w-12 text-gray-300" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              listing.offer_type === "sale" ? "bg-primary text-white" : "bg-gold text-white"
            }`}>
              {offerTypeLabels[listing.offer_type]}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-1">
            {listing.title}
          </h3>
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{listing.city_name}{listing.neighborhood && ` — ${listing.neighborhood}`}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            {listing.rooms && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5 text-primary" /> {listing.rooms}
              </span>
            )}
            {listing.area && (
              <span className="flex items-center gap-1">
                <Maximize2 className="h-3.5 w-3.5 text-primary" /> {listing.area}م²
              </span>
            )}
            <span className="flex items-center gap-1 mr-auto">
              <Eye className="h-3.5 w-3.5" /> {listing.views_count}
            </span>
          </div>
          <p className="text-primary font-extrabold text-base">
            {formatPrice(listing.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}
