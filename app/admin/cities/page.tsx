"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Country, City, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import {
  MapPoint, AddCircle, CloseCircle, Magnifer,
  Buildings2, Global, CheckCircle, DangerCircle,
} from "@solar-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────

interface CityForm {
  name_ar: string;
  name_en: string;
  region: string;
  country: number | "";
  is_active: boolean;
}

interface CountryForm {
  name_ar: string;
  name_en: string;
  code: string;
  is_active: boolean;
}

const emptyCityForm: CityForm = { name_ar: "", name_en: "", region: "", country: "", is_active: true };
const emptyCountryForm: CountryForm = { name_ar: "", name_en: "", code: "", is_active: true };

// ─── Component ────────────────────────────────────────────────────────────

export default function AdminCitiesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<"cities" | "countries">("cities");
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [search, setSearch] = useState("");
  const [filterCountry, setFilterCountry] = useState<number | "">("");
  const [loading, setLoading] = useState(true);

  // Modals
  const [cityModal, setCityModal] = useState<{ open: boolean; editing: City | null }>({ open: false, editing: null });
  const [countryModal, setCountryModal] = useState<{ open: boolean; editing: Country | null }>({ open: false, editing: null });
  const [cityForm, setCityForm] = useState<CityForm>(emptyCityForm);
  const [countryForm, setCountryForm] = useState<CountryForm>(emptyCountryForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "city" | "country"; id: number } | null>(null);

  // Guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/");
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, citRes] = await Promise.all([
        api.get<PaginatedResponse<Country>>("/cities/countries/"),
        api.get<PaginatedResponse<City>>("/cities/", { params: { limit: 100, offset: 0 } }),
      ]);
      setCountries(cRes.data.results ?? []);
      setCities(citRes.data.results ?? []);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filtered lists ────────────────────────────────────────────────────
  const filteredCities = cities.filter((c) => {
    const matchSearch = !search || c.name_ar.includes(search) || c.name_en.toLowerCase().includes(search.toLowerCase());
    const matchCountry = filterCountry === "" || c.country === filterCountry;
    return matchSearch && matchCountry;
  });

  const filteredCountries = countries.filter((c) =>
    !search || c.name_ar.includes(search) || c.name_en.toLowerCase().includes(search.toLowerCase())
  );

  // ── City CRUD ──────────────────────────────────────────────────────────
  const openAddCity = () => {
    setCityForm({ ...emptyCityForm, country: filterCountry || (countries[0]?.id ?? "") });
    setCityModal({ open: true, editing: null });
  };

  const openEditCity = (city: City) => {
    setCityForm({ name_ar: city.name_ar, name_en: city.name_en, region: city.region, country: city.country, is_active: true });
    setCityModal({ open: true, editing: city });
  };

  const saveCity = async () => {
    if (!cityForm.name_ar || !cityForm.name_en || !cityForm.country) {
      toast.error("الاسم بالعربية والإنجليزية والدولة مطلوبة");
      return;
    }
    setSaving(true);
    try {
      if (cityModal.editing) {
        await api.patch(`/cities/${cityModal.editing.id}/`, cityForm);
        toast.success("تم تعديل المدينة");
      } else {
        await api.post("/cities/", cityForm);
        toast.success("تم إضافة المدينة");
      }
      setCityModal({ open: false, editing: null });
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const toggleCityActive = async (city: City) => {
    try {
      await api.patch(`/cities/${city.id}/`, { is_active: !city.is_active });
      toast.success(city.is_active ? "تم تعطيل المدينة" : "تم تفعيل المدينة");
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const deleteCity = async (id: number) => {
    try {
      await api.delete(`/cities/${id}/`);
      toast.success("تم حذف المدينة");
      setDeleteConfirm(null);
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  // ── Country CRUD ───────────────────────────────────────────────────────
  const openAddCountry = () => {
    setCountryForm(emptyCountryForm);
    setCountryModal({ open: true, editing: null });
  };

  const openEditCountry = (country: Country) => {
    setCountryForm({ name_ar: country.name_ar, name_en: country.name_en, code: country.code, is_active: country.is_active });
    setCountryModal({ open: true, editing: country });
  };

  const saveCountry = async () => {
    if (!countryForm.name_ar || !countryForm.name_en || !countryForm.code) {
      toast.error("جميع حقول الدولة مطلوبة");
      return;
    }
    setSaving(true);
    try {
      if (countryModal.editing) {
        await api.patch(`/cities/countries/${countryModal.editing.id}/`, countryForm);
        toast.success("تم تعديل الدولة");
      } else {
        await api.post("/cities/countries/", countryForm);
        toast.success("تم إضافة الدولة");
      }
      setCountryModal({ open: false, editing: null });
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const deleteCountry = async (id: number) => {
    try {
      await api.delete(`/cities/countries/${id}/`);
      toast.success("تم حذف الدولة");
      setDeleteConfirm(null);
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPoint className="h-6 w-6 text-primary" />
            إدارة المدن والدول
          </h1>
          <p className="text-sm text-gray-400 mt-1">{cities.length} مدينة — {countries.length} دولة</p>
        </div>
        <Button onClick={tab === "cities" ? openAddCity : openAddCountry}>
          <AddCircle className="h-4 w-4" />
          {tab === "cities" ? "إضافة مدينة" : "إضافة دولة"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {(["cities", "countries"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-white text-primary card-shadow" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t === "cities" ? <span className="flex items-center gap-1.5"><MapPoint className="h-4 w-4" />المدن</span> : <span className="flex items-center gap-1.5"><Global className="h-4 w-4" />الدول</span>}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl card-shadow p-4 mb-5 flex flex-wrap gap-3">
        <Input
          placeholder="بحث..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startIcon={<Magnifer className="h-4 w-4" />}
          className="w-56"
        />
        {tab === "cities" && (
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value === "" ? "" : Number(e.target.value))}
            className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">كل الدول</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name_ar}</option>
            ))}
          </select>
        )}
        <span className="text-sm text-gray-400 self-center">
          {tab === "cities" ? `${filteredCities.length} مدينة` : `${filteredCountries.length} دولة`}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tab === "cities" ? (
        <CitiesTable
          cities={filteredCities}
          onEdit={openEditCity}
          onToggle={toggleCityActive}
          onDelete={(id) => setDeleteConfirm({ type: "city", id })}
        />
      ) : (
        <CountriesTable
          countries={filteredCountries}
          onEdit={openEditCountry}
          onDelete={(id) => setDeleteConfirm({ type: "country", id })}
        />
      )}

      {/* ── City Modal ── */}
      {cityModal.open && (
        <Modal title={cityModal.editing ? "تعديل مدينة" : "إضافة مدينة"} onClose={() => setCityModal({ open: false, editing: null })}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="الاسم بالعربية *" value={cityForm.name_ar} onChange={(e) => setCityForm((p) => ({ ...p, name_ar: e.target.value }))} />
              <Input label="الاسم بالإنجليزية *" value={cityForm.name_en} onChange={(e) => setCityForm((p) => ({ ...p, name_en: e.target.value }))} />
            </div>
            <Input label="المنطقة / المحافظة" value={cityForm.region} onChange={(e) => setCityForm((p) => ({ ...p, region: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الدولة *</label>
              <select
                value={cityForm.country}
                onChange={(e) => setCityForm((p) => ({ ...p, country: Number(e.target.value) }))}
                className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">اختر الدولة</option>
                {countries.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={cityForm.is_active} onChange={(e) => setCityForm((p) => ({ ...p, is_active: e.target.checked }))} className="rounded" />
              <span className="text-sm text-gray-700">مفعّلة</span>
            </label>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={saveCity} loading={saving} fullWidth>حفظ</Button>
            <Button variant="outline" onClick={() => setCityModal({ open: false, editing: null })} fullWidth>إلغاء</Button>
          </div>
        </Modal>
      )}

      {/* ── Country Modal ── */}
      {countryModal.open && (
        <Modal title={countryModal.editing ? "تعديل دولة" : "إضافة دولة"} onClose={() => setCountryModal({ open: false, editing: null })}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="الاسم بالعربية *" value={countryForm.name_ar} onChange={(e) => setCountryForm((p) => ({ ...p, name_ar: e.target.value }))} />
              <Input label="الاسم بالإنجليزية *" value={countryForm.name_en} onChange={(e) => setCountryForm((p) => ({ ...p, name_en: e.target.value }))} />
            </div>
            <Input label="رمز الدولة (مثال: YE، SA) *" value={countryForm.code} onChange={(e) => setCountryForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={countryForm.is_active} onChange={(e) => setCountryForm((p) => ({ ...p, is_active: e.target.checked }))} className="rounded" />
              <span className="text-sm text-gray-700">مفعّلة</span>
            </label>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={saveCountry} loading={saving} fullWidth>حفظ</Button>
            <Button variant="outline" onClick={() => setCountryModal({ open: false, editing: null })} fullWidth>إلغاء</Button>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <Modal title="تأكيد الحذف" onClose={() => setDeleteConfirm(null)}>
          <p className="text-gray-600 text-sm mb-6">
            {deleteConfirm.type === "country"
              ? "سيتم حذف الدولة وجميع مدنها المرتبطة بها. هذا الإجراء لا يمكن التراجع عنه."
              : "سيتم حذف المدينة نهائياً. هذا الإجراء لا يمكن التراجع عنه."}
          </p>
          <div className="flex gap-3">
            <Button
              variant="danger"
              fullWidth
              onClick={() => deleteConfirm.type === "city" ? deleteCity(deleteConfirm.id) : deleteCountry(deleteConfirm.id)}
            >
              حذف
            </Button>
            <Button variant="outline" fullWidth onClick={() => setDeleteConfirm(null)}>إلغاء</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function CitiesTable({ cities, onEdit, onToggle, onDelete }: {
  cities: City[];
  onEdit: (c: City) => void;
  onToggle: (c: City) => void;
  onDelete: (id: number) => void;
}) {
  if (cities.length === 0) return (
    <div className="text-center py-16 text-gray-400">
      <MapPoint className="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p>لا توجد مدن مطابقة</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl card-shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs">
            <th className="text-right py-3 px-4 font-semibold">#</th>
            <th className="text-right py-3 px-4 font-semibold">الاسم بالعربية</th>
            <th className="text-right py-3 px-4 font-semibold">الاسم بالإنجليزية</th>
            <th className="text-right py-3 px-4 font-semibold">المنطقة</th>
            <th className="text-right py-3 px-4 font-semibold">الدولة</th>
            <th className="text-right py-3 px-4 font-semibold">الحالة</th>
            <th className="text-right py-3 px-4 font-semibold">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {cities.map((city, i) => (
            <tr key={city.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="py-3 px-4 text-gray-400">{i + 1}</td>
              <td className="py-3 px-4 font-semibold text-gray-800">{city.name_ar}</td>
              <td className="py-3 px-4 text-gray-500">{city.name_en}</td>
              <td className="py-3 px-4 text-gray-500">{city.region || "—"}</td>
              <td className="py-3 px-4">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                  {city.country_name}
                </span>
              </td>
              <td className="py-3 px-4">
                <button onClick={() => onToggle(city)} className="flex items-center gap-1">
                  {city.is_active !== false ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <CheckCircle className="h-3.5 w-3.5" /> مفعّلة
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      <DangerCircle className="h-3.5 w-3.5" /> معطّلة
                    </span>
                  )}
                </button>
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-2">
                  <button onClick={() => onEdit(city)} className="text-xs text-primary hover:underline font-medium">تعديل</button>
                  <button onClick={() => onDelete(city.id)} className="text-xs text-red-500 hover:underline font-medium">حذف</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CountriesTable({ countries, onEdit, onDelete }: {
  countries: Country[];
  onEdit: (c: Country) => void;
  onDelete: (id: number) => void;
}) {
  if (countries.length === 0) return (
    <div className="text-center py-16 text-gray-400">
      <Global className="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p>لا توجد دول مطابقة</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl card-shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs">
            <th className="text-right py-3 px-4 font-semibold">الاسم بالعربية</th>
            <th className="text-right py-3 px-4 font-semibold">الاسم بالإنجليزية</th>
            <th className="text-right py-3 px-4 font-semibold">الرمز</th>
            <th className="text-right py-3 px-4 font-semibold">عدد المدن</th>
            <th className="text-right py-3 px-4 font-semibold">الحالة</th>
            <th className="text-right py-3 px-4 font-semibold">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {countries.map((country) => (
            <tr key={country.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="py-3 px-4 font-semibold text-gray-800">{country.name_ar}</td>
              <td className="py-3 px-4 text-gray-500">{country.name_en}</td>
              <td className="py-3 px-4">
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{country.code}</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                  <Buildings2 className="h-3 w-3 inline ml-1" />
                  {country.cities?.length ?? 0} مدينة
                </span>
              </td>
              <td className="py-3 px-4">
                {country.is_active ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                    <CheckCircle className="h-3.5 w-3.5" /> مفعّلة
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full w-fit">
                    <DangerCircle className="h-3.5 w-3.5" /> معطّلة
                  </span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-2">
                  <button onClick={() => onEdit(country)} className="text-xs text-primary hover:underline font-medium">تعديل</button>
                  <button onClick={() => onDelete(country.id)} className="text-xs text-red-500 hover:underline font-medium">حذف</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl card-shadow w-full max-w-md p-6 relative">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <CloseCircle className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
