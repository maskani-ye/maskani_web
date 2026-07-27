"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { formatRelativeTime, formatPrice } from "@/lib/utils";
import type { PaginatedResponse, City } from "@/types";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Settings, AddCircle, MapPoint, Dollar, ClockCircle, AltArrowRight } from "@solar-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useCity } from "@/context/CityContext";
import { toast } from "sonner";

interface ServiceCategory { id: number; name_ar: string }
interface ServiceRequestItem {
  id: number;
  title: string;
  category: { id: number; name_ar: string } | null;
  city_name: string;
  client_name: string;
  budget_max: string | null;
  currency: string;
  offers_count: number;
  created_at: string;
}

export default function JobsPage() {
  const { user } = useAuth();
  const { cityId, setCity } = useCity();
  const router = useRouter();
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [category, setCategory] = useState("");

  useEffect(() => {
    api.get("/cities/").then((r) => setCities(r.data.results ?? [])).catch(() => {});
    api.get("/services/categories/").then((r) => setCategories(r.data.results ?? r.data ?? [])).catch(() => {});
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { offset: "0", limit: "20" };
      if (category) params.category = category;
      if (cityId) params.city = cityId;
      const { data } = await api.get<PaginatedResponse<ServiceRequestItem>>("/jobs/", { params });
      setRequests(data.results);
      setTotal(data.count);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [category, cityId]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> طلبات الخدمات
          </h1>
          <p className="text-gray-500 text-sm mt-1">{total} طلب نشط</p>
        </div>
        <Button onClick={() => user ? router.push("/jobs/create") : router.push("/auth/login")}>
          <AddCircle className="h-4 w-4" /> اطلب خدمة
        </Button>
      </div>

      <div className="bg-white rounded-2xl card-shadow p-4 mb-6 grid grid-cols-2 gap-3">
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
          options={categories.map((c) => ({ value: c.id, label: c.name_ar }))}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="التخصص"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl card-shadow p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد طلبات خدمات حالياً</p>
          <p className="text-gray-400 text-sm mt-1">كن أول من يطلب خدمة!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Link key={req.id} href={`/jobs/${req.id}`}>
              <div className="bg-white rounded-2xl card-shadow hover:card-shadow-hover transition-all duration-200 p-5 cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {req.category && (
                        <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                          {req.category.name_ar}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-gray-800 mb-2 truncate">{req.title}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><MapPoint className="h-3.5 w-3.5 text-primary" /> {req.city_name}</span>
                      {req.budget_max && <span className="flex items-center gap-1"><Dollar className="h-3.5 w-3.5 text-gold" /> حتى {formatPrice(req.budget_max, req.currency)}</span>}
                    </div>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <div className="text-sm font-bold text-primary">{req.offers_count} عرض</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <ClockCircle className="h-3.5 w-3.5" /> {formatRelativeTime(req.created_at)}
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
