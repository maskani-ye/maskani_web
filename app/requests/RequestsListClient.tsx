"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { formatRelativeTime, formatPrice, propertyTypeName } from "@/lib/utils";
import { RequestCard } from "@/components/requests/RequestCard";
import type { ClientRequest, PaginatedResponse, City } from "@/types";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { RequestsTabs } from "@/components/layout/RequestsTabs";
import { PenNewSquare, AddCircle, MapPoint, Bed, Dollar, ClockCircle, AltArrowRight } from "@solar-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { useCity } from "@/context/CityContext";
import { useCountry } from "@/context/CountryContext";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbList, sectionLabel } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { toast } from "sonner";

export default function RequestsPage() {
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const { cityId, setCity } = useCity();
  // كل قائمة محصورة بدولة الزائر: سوق واحد في الشاشة لا خليط أسواق.
  const { code: countryCode } = useCountry();
  const router = useRouter();
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [filters, setFilters] = useState({ property_type: "", offer_type: "" });

  useEffect(() => {
    api.get("/cities/", { params: countryCode ? { country: countryCode } : {} })
      .then((r) => setCities(r.data.results ?? [])).catch(() => {});
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { offset: "0", limit: "20" };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      if (cityId) params.city = cityId;
      if (countryCode) params.country = countryCode;
      const { data } = await api.get<PaginatedResponse<ClientRequest>>("/requests/", { params });
      setRequests(data.results);
      setTotal(data.count);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [filters, cityId, countryCode]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const offerTypeLabels: Record<string, string> = {
    sale: "للشراء", rent_monthly: "إيجار شهري", rent_yearly: "إيجار سنوي", any: "أي نوع",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <JsonLd data={breadcrumbList([{ name: "الرئيسية", path: "/" }, { name: sectionLabel("requests"), path: "/requests" }])} />
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: sectionLabel("requests") }]} />
      <div className="mb-6">
        <PageHeader as="h2" icon={<PenNewSquare />} title="طلبات العملاء" subtitle={`${total} طلب نشط`}
          actions={
            <Button onClick={() => requireAuth(() => router.push("/requests/create"))}>
              <AddCircle className="h-4 w-4" /> نشر طلب
            </Button>
          } />
      </div>

      <RequestsTabs active="property" />

      {/* Filters */}
      <div className="bg-white rounded-2xl card-shadow p-4 mb-6 grid grid-cols-3 gap-3">
        <Select
          options={cities.map((c) => ({ value: c.id, label: c.name_ar }))}
          value={cityId}
          onChange={(e) => {
            const id = e.target.value;
            const name = cities.find((c) => String(c.id) === id)?.name_ar ?? "";
            setCity(id, name);
          }}
          placeholder="المدينة"
        />
        <Select
          options={[
            { value: "apartment", label: "شقة" }, { value: "house", label: "بيت/فيلا" },
            { value: "land", label: "أرض" }, { value: "commercial", label: "محل" }, { value: "any", label: "أي نوع" },
          ]}
          value={filters.property_type}
          onChange={(e) => setFilters((p) => ({ ...p, property_type: e.target.value }))}
          placeholder="النوع"
        />
        <Select
          options={[
            { value: "sale", label: "للشراء" }, { value: "rent_monthly", label: "إيجار شهري" },
            { value: "rent_yearly", label: "إيجار سنوي" }, { value: "any", label: "أي نوع" },
          ]}
          value={filters.offer_type}
          onChange={(e) => setFilters((p) => ({ ...p, offer_type: e.target.value }))}
          placeholder="نوع العرض"
        />
      </div>

      {/* Requests */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl card-shadow p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <PenNewSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد طلبات حالياً</p>
          <p className="text-gray-400 text-sm mt-1">كن أول من ينشر طلبه!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
  );
}
