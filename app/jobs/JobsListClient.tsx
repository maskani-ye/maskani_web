"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { formatRelativeTime, formatPrice } from "@/lib/utils";
import { JobCard } from "@/components/jobs/JobCard";
import type { PaginatedResponse, City } from "@/types";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { RequestsTabs } from "@/components/layout/RequestsTabs";
import { Select } from "@/components/ui/Select";
import { Settings, AddCircle, MapPoint, Dollar, ClockCircle, AltArrowRight } from "@solar-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { useCity } from "@/context/CityContext";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbList, sectionLabel } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
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
  const { requireAuth } = useAuthGate();
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
      <JsonLd data={breadcrumbList([{ name: "الرئيسية", path: "/" }, { name: sectionLabel("jobs"), path: "/jobs" }])} />
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: sectionLabel("jobs") }]} />
      <div className="mb-6">
        <PageHeader as="h2" icon={<Settings />} title="طلبات الخدمات" subtitle={`${total} طلب نشط`}
          actions={
            <Button onClick={() => requireAuth(() => router.push("/jobs/create"))}>
              <AddCircle className="h-4 w-4" /> اطلب خدمة
            </Button>
          } />
      </div>

      <RequestsTabs active="service" />

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
            <JobCard key={req.id} job={req} />
          ))}
        </div>
      )}
    </div>
  );
}
