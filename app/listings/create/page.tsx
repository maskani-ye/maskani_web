"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { City, PropertyTypeItem } from "@/types";
import { Button } from "@/components/ui/Button";
import {
  ListingFormFields, emptyListingForm, buildListingFormData,
  type ListingFormState,
} from "@/components/listings/ListingFormFields";
import { Buildings2, CloudUpload, CloseCircle, AltArrowRight } from "@solar-icons/react";
import { toast } from "sonner";

export default function CreateListingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeItem[]>([]);
  const [form, setForm] = useState<ListingFormState>(emptyListingForm);
  const [images, setImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    api.get("/cities/").then((r) => setCities(r.data.results ?? [])).catch(() => {});
    api.get("/listings/property-types/").then((r) => setPropertyTypes(r.data.results ?? r.data ?? [])).catch(() => {});
    // عبّئ رقم التواصل من هاتف المستخدم كافتراضي
  }, []);

  useEffect(() => {
    if (user?.phone) setForm((p) => (p.contact_phone ? p : { ...p, contact_phone: user.phone }));
  }, [user]);

  const setField = <K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImages((p) => [...p, ...Array.from(e.target.files!)].slice(0, 15));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.property_type || !form.city || !form.price) {
      toast.error("يرجى تعبئة الحقول المطلوبة");
      return;
    }
    setSaving(true);
    try {
      const fd = buildListingFormData(form, images);
      const { data } = await api.post("/listings/create/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("تم نشر الإعلان بنجاح");
      router.push(`/listings/${data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/listings" className="hover:text-primary">الإعلانات</Link>
        <AltArrowRight className="h-3.5 w-3.5" />
        <span className="text-gray-700 font-medium">إعلان جديد</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Buildings2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">أضف إعلان عقاري</h1>
          <p className="text-gray-500 text-sm">اعرض عقارك على آلاف الباحثين</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl card-shadow p-6 space-y-5">
        <ListingFormFields form={form} setField={setField} cities={cities} propertyTypes={propertyTypes} />

        {/* رفع الصور */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">صور الإعلان (حتى 15 صورة — الأولى رئيسية)</label>
          <label className="flex items-center justify-center gap-2 h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
            <CloudUpload className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-400">اضغط لرفع الصور</span>
            <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
          </label>
          {images.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-16 rounded-xl overflow-hidden">
                  <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                  {i === 0 && <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-md">رئيسية</span>}
                  <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <CloseCircle className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" fullWidth loading={saving} size="lg">
          <Buildings2 className="h-4 w-4" /> نشر الإعلان
        </Button>
      </form>
    </div>
  );
}
