"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import type { Listing, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { Heart, Buildings2, MapPoint, TrashBinTrash } from "@solar-icons/react";

interface FavoriteItem {
  id: number;
  listing: number;
  listing_details: Listing;
  created_at: string;
}

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
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

  const removeFavorite = async (listingId: number) => {
    try {
      await api.post(`/social/favorites/${listingId}/toggle/`);
      setFavorites((prev) => prev.filter((f) => f.listing !== listingId));
      setTotal((t) => t - 1);
      toast.success("تم الحذف من المفضّلة");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
          <Heart className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">المفضّلة</h1>
          <p className="text-sm text-gray-500">{total} إعلان</p>
        </div>
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
          <p className="text-sm mb-4">لا توجد إعلانات في المفضّلة</p>
          <Button onClick={() => router.push("/listings")} variant="outline" size="sm">تصفّح الإعلانات</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favorites.map((fav) => {
              const l = fav.listing_details;
              if (!l) return null;
              return (
                <div key={fav.id} className="bg-white rounded-2xl card-shadow overflow-hidden group">
                  <Link href={`/listings/${l.id}`}>
                    <div className="relative h-40 bg-gray-100">
                      {l.main_image ? (
                        <Image src={l.main_image} alt={l.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Buildings2 className="h-10 w-10 text-gray-300" />
                        </div>
                      )}
                      <span className={`absolute top-2 right-2 text-xs font-bold text-white px-2 py-1 rounded-lg ${l.offer_type === "sale" ? "bg-primary" : "bg-gold"}`}>
                        {l.offer_type === "sale" ? "بيع" : l.offer_type === "rent_monthly" ? "إيجار شهري" : "إيجار سنوي"}
                      </span>
                    </div>
                  </Link>
                  <div className="p-4 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/listings/${l.id}`}>
                        <h3 className="font-semibold text-gray-900 truncate hover:text-primary transition-colors">{l.title}</h3>
                      </Link>
                      {l.city_name && (
                        <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <MapPoint className="h-3 w-3" />{l.city_name}
                        </p>
                      )}
                      <p className="text-primary font-bold mt-1">{formatPrice(l.price, l.currency)}</p>
                    </div>
                    <button
                      onClick={() => removeFavorite(l.id)}
                      className="shrink-0 p-2 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                      title="حذف من المفضّلة"
                    >
                      <TrashBinTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
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
