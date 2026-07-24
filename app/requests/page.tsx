"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { formatRelativeTime, formatPrice, propertyTypeName } from "@/lib/utils";
import type { ClientRequest, PaginatedResponse, City } from "@/types";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { PenNewSquare, AddCircle, MapPoint, Bed, Dollar, ClockCircle, AltArrowRight } from "@solar-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useCity } from "@/context/CityContext";
import { toast } from "sonner";

export default function RequestsPage() {
  const { user } = useAuth();
  const { cityId, setCity } = useCity();
  const router = useRouter();
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [filters, setFilters] = useState({ property_type: "", offer_type: "" });

  useEffect(() => {
    api.get("/cities/").then((r) => setCities(r.data.results ?? [])).catch(() => {});
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { offset: "0", limit: "20" };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      if (cityId) params.city = cityId;
      const { data } = await api.get<PaginatedResponse<ClientRequest>>("/requests/", { params });
      setRequests(data.results);
      setTotal(data.count);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [filters, cityId]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const propertyTypeLabels: Record<string, string> = {
    apartment: "شقة", house: "بيت/فيلا", land: "أرض", commercial: "محل", any: "أي نوع",
  };
  const offerTypeLabels: Record<string, string> = {
    sale: "للشراء", rent_monthly: "إيجار شهري", rent_yearly: "إيجار سنوي", any: "أي نوع",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PenNewSquare className="h-6 w-6 text-primary" />
            طلبات العملاء
          </h1>
          <p className="text-gray-500 text-sm mt-1">{total} طلب نشط</p>
        </div>
        <Button onClick={() => user ? router.push("/requests/create") : router.push("/auth/login")}>
          <AddCircle className="h-4 w-4" /> نشر طلب
        </Button>
      </div>

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
            <Link key={req.id} href={`/requests/${req.id}`}>
              <div className="bg-white rounded-2xl card-shadow hover:card-shadow-hover transition-all duration-200 p-5 cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                        {propertyTypeName(req.property_type)}
                      </span>
                      <span className="text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-full font-semibold">
                        {offerTypeLabels[req.offer_type] || req.offer_type}
                      </span>
                    </div>
                    <p className="font-bold text-gray-800 mb-2">{req.client_name} يبحث عن عقار</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><MapPoint className="h-3.5 w-3.5 text-primary" /> {req.city_name}{req.neighborhood && ` — ${req.neighborhood}`}</span>
                      {req.budget_max && <span className="flex items-center gap-1"><Dollar className="h-3.5 w-3.5 text-gold" /> حتى {formatPrice(req.budget_max, req.currency)}</span>}
                      {req.rooms_needed && <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {req.rooms_needed} غرف</span>}
                    </div>
                    {req.additional_specs && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-1">{req.additional_specs}</p>
                    )}
                  </div>
                  <div className="text-left flex-shrink-0">
                    <div className="text-sm font-bold text-primary">{req.offers_count} عرض</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <ClockCircle className="h-3.5 w-3.5" />
                      {formatRelativeTime(req.created_at)}
                    </div>
                    <AltArrowRight className="h-4 w-4 text-gray-300 mt-2 mr-auto" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
