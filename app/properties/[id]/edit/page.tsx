"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import type { City, PropertyTypeItem, Property, PropertyImage } from "@/types";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  PropertyFormFields, emptyPropertyForm, buildPropertyPatch,
  type PropertyFormState,
} from "@/components/properties/PropertyFormFields";
import { CloudUpload, TrashBinTrash, CheckCircle, Star, AltArrowRight } from "@solar-icons/react";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageCompression";

// property_type يأتي متداخلاً ككائن {id,...} في الاستجابة، بينما النوع مُعلَن كسلسلة
function ptId(pt: unknown): string {
  if (pt && typeof pt === "object" && "id" in pt) return String((pt as { id: number }).id);
  return pt ? String(pt) : "";
}
function ownerId(u: Property["user"]): number | null {
  if (u && typeof u === "object") return (u as { id: number }).id;
  return typeof u === "number" ? u : null;
}

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { requireAuth } = useAuthGate();
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeItem[]>([]);
  const [form, setForm] = useState<PropertyFormState>(emptyPropertyForm);
  const [propertyImages, setPropertyImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    api.get("/cities/").then((r) => setCities(r.data.results ?? [])).catch(() => {});
    api.get("/properties/property-types/").then((r) => setPropertyTypes(r.data.results ?? r.data ?? [])).catch(() => {});
  }, []);

  const loadProperty = useCallback(async () => {
    try {
      const { data } = await api.get<Property>(`/properties/${id}/`);
      setForm({
        title: data.title ?? "",
        description: data.description ?? "",
        property_type: ptId(data.property_type),
        offer_type: data.offer_type ?? "sale",
        price: data.price != null ? String(data.price) : "",
        currency: data.currency ?? "YER",
        area: data.area != null ? String(data.area) : "",
        rooms: data.rooms != null ? String(data.rooms) : "",
        bathrooms: data.bathrooms != null ? String(data.bathrooms) : "",
        floor: data.floor != null ? String(data.floor) : "",
        total_floors: data.total_floors != null ? String(data.total_floors) : "",
        furnishing: data.furnishing ?? "",
        city: data.city != null ? String(data.city) : "",
        neighborhood: data.neighborhood ?? "",
        neighborhood_ref: data.neighborhood_ref ? String(data.neighborhood_ref) : "",
        address: data.address ?? "",
        contact_phone: data.contact_phone ?? "",
        contact_whatsapp: data.contact_whatsapp ?? "",
        status: data.status ?? "available",
        has_elevator: !!data.has_elevator,
        has_parking: !!data.has_parking,
        has_garden: !!data.has_garden,
        has_pool: !!data.has_pool,
        has_security: !!data.has_security,
        has_internet: !!data.has_internet,
        has_ac: !!data.has_ac,
        has_generator: !!data.has_generator,
        has_storage: !!data.has_storage,
        pets_allowed: !!data.pets_allowed,
      });
      setPropertyImages(data.images ?? []);
      return data;
    } catch {
      toast.error("لم يتم العثور على العقار");
      router.push("/properties");
      return null;
    }
  }, [id, router]);

  // انتظر انتهاء المصادقة، ثم تحقّق من الملكية
  useEffect(() => {
    if (authLoading) return;
    if (!user) { requireAuth(undefined, () => router.push("/")); return; }
    (async () => {
      const data = await loadProperty();
      if (!data) return;
      if (ownerId(data.user) !== user.id) {
        toast.error("لا يمكنك تعديل عقار لا تملكه");
        router.push(`/properties/${id}`);
        return;
      }
      setAuthorized(true);
      setLoading(false);
    })();
  }, [authLoading, user, id, loadProperty, router]);

  const setField = <K extends keyof PropertyFormState>(key: K, value: PropertyFormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/properties/${id}/update/`, buildPropertyPatch(form));
      toast.success("تم حفظ التعديلات");
      router.push(`/properties/${id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(e.target.files)) {
        const fd = new FormData();
        fd.append("images", await compressImage(file));
        const { data } = await api.post<PropertyImage[]>(`/properties/${id}/images/add/`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        // الخادم يعيد قائمة بالصور المُنشأة (getlist('images'))
        setPropertyImages((p) => [...p, ...(Array.isArray(data) ? data : [data])]);
      }
      toast.success("تمت إضافة الصور");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteImage = async (imgId: number) => {
    try {
      await api.delete(`/properties/${id}/images/${imgId}/delete/`);
      setPropertyImages((p) => p.filter((im) => im.id !== imgId));
      toast.success("تم حذف الصورة");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleSetMain = async (imgId: number) => {
    try {
      await api.post(`/properties/${id}/images/${imgId}/set-main/`);
      setPropertyImages((p) => p.map((im) => ({ ...im, is_main: im.id === imgId })));
      toast.success("تم تعيين الصورة الرئيسية");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (loading || !authorized) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/properties" className="hover:text-primary">العقارات</Link>
        <AltArrowRight className="h-3.5 w-3.5" />
        <Link href={`/properties/${id}`} className="hover:text-primary">التفاصيل</Link>
        <AltArrowRight className="h-3.5 w-3.5" />
        <span className="text-gray-700 font-medium">تعديل</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">تعديل العقار</h1>

      <form onSubmit={handleSave} className="bg-white rounded-3xl card-shadow p-6 space-y-5">
        <PropertyFormFields form={form} setField={setField} cities={cities} propertyTypes={propertyTypes} />
        <Button type="submit" fullWidth loading={saving} size="lg">حفظ التعديلات</Button>
      </form>

      {/* إدارة الصور */}
      <div className="bg-white rounded-3xl card-shadow p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">صور العقار</h2>
          <label className="inline-flex items-center gap-2 text-sm text-primary font-semibold cursor-pointer hover:underline">
            <CloudUpload className="h-4 w-4" /> {uploading ? "جارٍ الرفع..." : "إضافة صور"}
            <input type="file" multiple accept="image/*" onChange={handleAddImages} className="hidden" disabled={uploading} />
          </label>
        </div>

        {propertyImages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">لا توجد صور بعد</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {propertyImages.map((img) => (
              <div key={img.id} className="relative rounded-xl overflow-hidden border border-gray-100 group">
                <img src={img.image} alt="" className="w-full h-32 object-cover" />
                {img.is_main && (
                  <span className="absolute top-1.5 right-1.5 flex items-center gap-1 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-md">
                    <CheckCircle className="h-3 w-3" /> رئيسية
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                  {!img.is_main && (
                    <button type="button" onClick={() => handleSetMain(img.id)} className="flex items-center gap-1 text-[11px] text-white bg-white/20 hover:bg-white/30 px-2 py-1 rounded-md">
                      <Star className="h-3 w-3" /> رئيسية
                    </button>
                  )}
                  <button type="button" onClick={() => handleDeleteImage(img.id)} className="mr-auto flex items-center gap-1 text-[11px] text-white bg-red-500/80 hover:bg-red-600 px-2 py-1 rounded-md">
                    <TrashBinTrash className="h-3 w-3" /> حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
