"use client";

import { useState, useEffect, useCallback, type ComponentType } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { formatPrice, formatRelativeTime } from "@/lib/utils";
import type { User, Listing, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  User as UserIcon, CheckCircle, MapPoint, Buildings2, Star,
  UserPlus, UserMinus, ChatRoundDots,
} from "@solar-icons/react";
import { toast } from "sonner";

const asIcon = (I: ComponentType<{ className?: string }>) => I;

interface PublicUser extends User {
  is_following?: boolean;
}
interface UserRatingItem {
  id: number;
  rater: number;
  rater_name: string;
  rater_avatar: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();
  const { requireAuth } = useAuthGate();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [ratings, setRatings] = useState<UserRatingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetail, setReportDetail] = useState("");
  const [reportBusy, setReportBusy] = useState(false);

  const toggleBlock = async () => {
    setBlockBusy(true);
    try {
      const { data } = await api.post("/social/block/", { user_id: Number(id) });
      setBlocked(!!data.blocked);
      toast.success(data.message ?? (data.blocked ? "تم حظر المستخدم" : "تم إلغاء الحظر"));
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setBlockBusy(false); }
  };

  const submitReport = async () => {
    setReportBusy(true);
    try {
      await api.post("/social/report/", { user_id: Number(id), reason: reportReason, detail: reportDetail });
      toast.success("تم إرسال البلاغ");
      setReportOpen(false); setReportDetail("");
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setReportBusy(false); }
  };

  const isSelf = !!me && !!profile && me.id === profile.id;

  const startConversation = async () => {
    if (!requireAuth()) return;
    setStartingChat(true);
    try {
      const { data } = await api.post("/chat/conversations/", { recipient_id: Number(id) });
      router.push(`/chat/${data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStartingChat(false);
    }
  };

  const loadRatings = useCallback(() => {
    api.get(`/social/users/${id}/ratings/`)
      .then((r) => setRatings(r.data.results ?? r.data ?? []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    api.get<PublicUser>(`/auth/users/${id}/`)
      .then((r) => { setProfile(r.data); setFollowing(!!r.data.is_following); })
      .catch(() => toast.error("لم يتم العثور على المستخدم"))
      .finally(() => setLoading(false));

    api.get<PaginatedResponse<Listing>>("/listings/", { params: { user: id, offset: 0, limit: 20 } })
      .then((r) => setListings(r.data.results))
      .catch(() => {});

    loadRatings();
  }, [id, loadRatings]);

  const toggleFollow = async () => {
    if (!requireAuth()) return;
    setFollowBusy(true);
    try {
      const { data } = await api.post(`/social/follow/${id}/`);
      setFollowing(!!data.is_following);
      setProfile((p) => p ? { ...p, followers_count: p.followers_count + (data.is_following ? 1 : -1) } : p);
      toast.success(data.message);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setFollowBusy(false); }
  };

  const submitRating = async () => {
    if (!requireAuth()) return;
    setSubmitting(true);
    try {
      await api.post(`/social/users/${id}/rate/`, { rating, comment });
      toast.success("تم إرسال تقييمك");
      setComment("");
      setRating(5);
      loadRatings();
      api.get<PublicUser>(`/auth/users/${id}/`).then((r) => setProfile(r.data)).catch(() => {});
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );

  if (!profile) return (
    <div className="text-center py-20">
      <p className="text-gray-500 text-lg">المستخدم غير موجود</p>
      <Link href="/listings"><Button className="mt-4">العودة للإعلانات</Button></Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="bg-white rounded-2xl card-shadow p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="h-10 w-10 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{profile.full_name}</h1>
              {profile.is_verified && (
                <span className="flex items-center gap-0.5 text-xs text-green-600 font-medium">
                  <CheckCircle className="h-4 w-4" /> موثّق
                </span>
              )}
            </div>
            {profile.city_name && (
              <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <MapPoint className="h-3.5 w-3.5" /> {profile.city_name}
              </p>
            )}
            {profile.bio && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{profile.bio}</p>}
          </div>
          {!isSelf && (
            <div className="flex flex-col gap-2 shrink-0">
              {me && (
                <Button onClick={toggleFollow} loading={followBusy} variant={following ? "outline" : "primary"} size="sm">
                  {following ? <><UserMinus className="h-4 w-4" /> إلغاء المتابعة</> : <><UserPlus className="h-4 w-4" /> متابعة</>}
                </Button>
              )}
              <Button onClick={startConversation} loading={startingChat} variant="outline" size="sm">
                <ChatRoundDots className="h-4 w-4" /> مراسلة
              </Button>
              {me && (
                <>
                  <Button onClick={toggleBlock} loading={blockBusy} variant="outline" size="sm">
                    {blocked ? "إلغاء الحظر" : "حظر"}
                  </Button>
                  <Button onClick={() => setReportOpen(true)} variant="ghost" size="sm">
                    بلاغ
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{profile.listings_count}</p>
            <p className="text-xs text-gray-500">إعلان</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{profile.average_rating ?? "—"}</p>
            <p className="text-xs text-gray-500">متوسط التقييم</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{profile.followers_count}</p>
            <p className="text-xs text-gray-500">متابع</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Listings */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl card-shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-1.5">
              <Buildings2 className="h-5 w-5 text-primary" /> إعلانات {profile.full_name}
            </h2>
            {listings.length === 0 ? (
              <EmptyState icon={asIcon(Buildings2)} title="لا توجد إعلانات" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {listings.map((l) => (
                  <Link key={l.id} href={`/listings/${l.id}`}>
                    <div className="bg-cream rounded-2xl overflow-hidden group hover:card-shadow transition-all">
                      <div className="relative h-32 bg-gray-100">
                        {l.main_image ? (
                          <img src={l.main_image} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Buildings2 className="h-8 w-8 text-gray-300" /></div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-semibold text-gray-800 truncate">{l.title}</h3>
                        <p className="text-sm font-bold text-primary mt-0.5">{formatPrice(l.price, l.currency)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ratings */}
        <div className="space-y-5">
          {/* Rate form */}
          {!isSelf && (
            <div className="bg-white rounded-2xl card-shadow p-5">
              <h3 className="font-bold text-gray-800 mb-3">قيّم هذا المستخدم</h3>
              {me ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <StarRating rating={rating} interactive onChange={setRating} />
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="تعليق (اختياري)"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  />
                  <Button size="sm" onClick={submitRating} loading={submitting} fullWidth className="mt-3">
                    <Star className="h-4 w-4" /> إرسال التقييم
                  </Button>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-3">سجّل الدخول لتقييم المستخدم</p>
                  <Button size="sm" variant="outline" fullWidth onClick={() => requireAuth()}>تسجيل الدخول</Button>
                </div>
              )}
            </div>
          )}

          {/* Ratings list */}
          <div className="bg-white rounded-2xl card-shadow p-5">
            <h3 className="font-bold text-gray-800 mb-4">التقييمات ({ratings.length})</h3>
            {ratings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">لا توجد تقييمات بعد</p>
            ) : (
              <div className="space-y-4">
                {ratings.map((r) => (
                  <div key={r.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {r.rater_avatar ? <img src={r.rater_avatar} className="w-full h-full object-cover" alt="" /> : <UserIcon className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-gray-800">{r.rater_name}</span>
                        <StarRating rating={r.rating} size="sm" />
                      </div>
                      {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(r.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {reportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setReportOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-gray-900">الإبلاغ عن المستخدم</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">السبب</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full h-11 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="spam">إزعاج/سبام</option>
                <option value="harassment">تحرّش/إساءة</option>
                <option value="scam">احتيال</option>
                <option value="inappropriate">محتوى غير لائق</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">تفاصيل (اختياري)</label>
              <textarea
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
                rows={3}
                placeholder="اكتب تفاصيل إضافية..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={submitReport} loading={reportBusy} fullWidth>إرسال البلاغ</Button>
              <Button onClick={() => setReportOpen(false)} variant="outline">إلغاء</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
