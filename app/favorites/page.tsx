"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { formatPrice } from "@/lib/utils";
import { PropertyCard } from "@/components/properties/PropertyCard";
import type { Property, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "sonner";
import { Heart, Buildings2, MapPoint, TrashBinTrash } from "@solar-icons/react";

interface FavoriteItem {
  id: number;
  property: number;
  property_details: Property;
  created_at: string;
}

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const { requireAuth } = useAuthGate();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    if (!authLoading && !user) requireAuth(undefined, () => router.push("/"));
  }, [user, authLoading, router]);

  const fetchFavorites = async (off = 0) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<FavoriteItem>>("/social/favorites/", {
        params: { offset: off, limit: LIMIT },
      });
      setFavorites(res.data.results);
      setTotal(res.data.count);
      setOffset(off);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!authLoading && user) fetchFavorites(0);
  }, [authLoading, user]);

  const removeFavorite = async (propertyId: number) => {
    try {
      await api.post(`/social/favorites/${propertyId}/toggle/`);
      setFavorites((prev) => prev.filter((f) => f.property !== propertyId));
      setTotal((t) => t - 1);
      toast.success("تم الحذف من المفضّلة");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <PageHeader icon={<Heart />} title="المفضّلة" subtitle={`${total} عقار`} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-2xl animate-pulse card-shadow" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Heart className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm mb-4">لا توجد عقارات في المفضّلة</p>
          <Button onClick={() => router.push("/properties")} variant="outline" size="sm">تصفّح العقارات</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favorites.map((fav) => {
              const l = fav.property_details;
              if (!l) return null;
              return (
                <PropertyCard key={fav.id} property={l}
                  favorited onToggleFavorite={() => removeFavorite(l.id)} />
              );
            })}
          </div>

          {total > LIMIT && (
            <div className="flex items-center justify-between mt-6">
              <span className="text-sm text-gray-500">{offset + 1}–{Math.min(offset + LIMIT, total)} من {total}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => fetchFavorites(offset - LIMIT)}>السابق</Button>
                <Button size="sm" variant="outline" disabled={offset + LIMIT >= total} onClick={() => fetchFavorites(offset + LIMIT)}>التالي</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
