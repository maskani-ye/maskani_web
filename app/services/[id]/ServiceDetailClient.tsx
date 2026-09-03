"use client";

import { useState, useEffect, useCallback, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/nav/MarketLink";
import { api, getErrorMessage } from "@/lib/api";
import { trackVisitEvent } from "@/lib/track";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { serviceCategoryLabels, formatRelativeTime } from "@/lib/utils";
import type { ServiceProvider, ServiceReview } from "@/types";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { ShareButton } from "@/components/ui/ShareButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Settings, User, CheckCircle, MapPoint, Phone, ChatSquare, ChatRoundDots,
  Star, AltArrowRight, Case, Gallery,
} from "@solar-icons/react";
import { toast } from "sonner";
import { YouTubePlayer } from "@/components/ui/YouTubePlayer";

const asIcon = (I: ComponentType<{ className?: string }>) => I;

// category قد تأتي متداخلة ككائن {id,name_ar,icon} أو كسلسلة
function categoryName(cat: unknown): string {
  if (cat && typeof cat === "object" && "name_ar" in cat) return String((cat as { name_ar: string }).name_ar);
  if (typeof cat === "string") return serviceCategoryLabels[cat] ?? cat;
  return String(cat ?? "");
}

export default function ServiceDetailClient({ id, initialProvider }: { id: string; initialProvider: ServiceProvider | null }) {
  const router = useRouter();
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const [provider, setProvider] = useState<ServiceProvider | null>(initialProvider);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [loading, setLoading] = useState(!initialProvider);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  // معرّف مستخدم مزوّد الخدمة (قد يصل user ككائن أو كرقم).
  const providerUserId =
    provider && typeof provider.user === "object" ? provider.user.id : (provider?.user as number | undefined);
  const isSelf = !!user && providerUserId != null && user.id === providerUserId;

  // "مراسلة" — بدء/فتح محادثة خاصة (DM) مع مزوّد الخدمة.
  const startConversation = async () => {
    if (!requireAuth()) return;
    if (providerUserId == null) return;
    trackVisitEvent("chat_started", { targetType: "service", targetId: id });
    setStartingChat(true);
    try {
      const { data } = await api.post("/chat/conversations/", { recipient_id: providerUserId });
      router.push(`/chat/${data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStartingChat(false);
    }
  };

  const loadReviews = useCallback(() => {
    api.get(`/services/${id}/reviews/`)
      .then((r) => setReviews(r.data.results ?? r.data ?? []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    api.get<ServiceProvider>(`/services/${id}/`)
      .then((r) => setProvider(r.data))
      .catch(() => toast.error("لم يتم العثور على الخدمة"))
      .finally(() => setLoading(false));
    loadReviews();
  }, [id, loadReviews]);

  const submitReview = async () => {
    if (!requireAuth()) return;
    if (!comment.trim()) { toast.error("اكتب تعليقاً"); return; }
    setSubmitting(true);
    try {
      await api.post(`/services/${id}/reviews/`, { rating, comment });
      toast.success("تم إضافة تقييمك");
      setComment("");
      setRating(5);
      loadReviews();
      // حدّث متوسط التقييم بإعادة الجلب
      api.get<ServiceProvider>(`/services/${id}/`).then((r) => setProvider(r.data)).catch(() => {});
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

  if (!provider) return (
    <div className="text-center py-20">
      <p className="text-muted-500 text-h3">الخدمة غير موجودة</p>
      <Link href="/services"><Button className="mt-4">العودة للخدمات</Button></Link>
    </div>
  );

  const wa = provider.contact_whatsapp?.replace(/\D/g, "");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-body text-muted mb-6">
        <Link href="/" className="hover:text-primary">الرئيسية</Link>
        <AltArrowRight className="h-3.5 w-3.5" />
        <Link href="/services" className="hover:text-primary">الخدمات</Link>
        <AltArrowRight className="h-3.5 w-3.5" />
        <span className="text-muted-700 font-medium line-clamp-1">{provider.title}</span>
        <ShareButton title={provider.title} text={`خدمة على مسكني: ${provider.title}`} className="mr-auto w-9 h-9 bg-muted-50 rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="bg-white rounded-2xl card-shadow p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {provider.user_avatar ? (
                  <img src={provider.user_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Settings className="h-8 w-8 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-h3 font-bold text-ink">{provider.title}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-caption bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
                    {categoryName(provider.category)}
                  </span>
                  <span className="text-caption text-muted-500 flex items-center gap-1">
                    <Case className="h-3.5 w-3.5" /> {provider.experience_years} سنة خبرة
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {provider.average_rating ? (
                    <>
                      <StarRating rating={provider.average_rating} size="sm" />
                      <span className="text-caption text-muted-500">{provider.average_rating} ({provider.reviews_count} تقييم)</span>
                    </>
                  ) : (
                    <span className="text-caption text-muted">لا يوجد تقييم بعد</span>
                  )}
                </div>
              </div>
            </div>

            {provider.user_name && (
              <Link href={typeof provider.user === "number" ? `/users/${provider.user}` : `/users/${(provider.user as { id: number }).id}`}>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-muted-100 text-body text-muted-600 hover:text-primary transition-colors">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{provider.user_name}</span>
                  {provider.user_verified && <CheckCircle className="h-3.5 w-3.5 text-primary" />}
                </div>
              </Link>
            )}
          </div>

          {/* Description */}
          {provider.description && (
            <div className="bg-white rounded-2xl card-shadow p-6">
              <h2 className="font-bold text-ink mb-2">نبذة عن الخدمة</h2>
              <p className="text-muted-600 text-body leading-relaxed whitespace-pre-line">{provider.description}</p>
              {provider.cities_names && provider.cities_names.length > 0 && (
                <div className="flex items-center gap-1.5 mt-4 text-body text-muted-500">
                  <MapPoint className="h-4 w-4 text-primary" />
                  <span>{provider.cities_names.join("، ")}</span>
                </div>
              )}
            </div>
          )}

          {/* فيديو الخدمة — أعمال المزوّد المصوّرة أقنع من وصف مكتوب. */}
          {provider.video_url && (
            <div className="bg-white rounded-2xl card-shadow p-6">
              <h2 className="font-bold text-ink mb-3">فيديو</h2>
              <YouTubePlayer url={provider.video_url} title={provider.title} />
            </div>
          )}

          {/* Portfolio */}
          {provider.portfolio && provider.portfolio.length > 0 && (
            <div className="bg-white rounded-2xl card-shadow p-6">
              <h2 className="font-bold text-ink mb-3 flex items-center gap-1.5">
                <Gallery className="h-5 w-5 text-primary" /> معرض الأعمال
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {provider.portfolio.map((item) => (
                  <div key={item.id} className="rounded-xl overflow-hidden border border-muted-100">
                    <img src={item.image} alt={item.title} className="w-full h-32 object-cover" />
                    {item.title && <p className="text-caption text-muted-600 p-2 line-clamp-1">{item.title}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-2xl card-shadow p-6">
            <h2 className="font-bold text-ink mb-4">التقييمات ({reviews.length})</h2>

            {/* Add review */}
            <div className="bg-cream rounded-2xl p-4 mb-5">
              {user ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-body text-muted-600">تقييمك:</span>
                    <StarRating rating={rating} interactive onChange={setRating} />
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="شاركنا تجربتك مع مزوّد الخدمة..."
                    className="w-full border border-muted-200 rounded-xl px-4 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none bg-white"
                  />
                  <Button size="sm" onClick={submitReview} loading={submitting} className="mt-3">
                    <Star className="h-4 w-4" /> إرسال التقييم
                  </Button>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-body text-muted-500">سجّل الدخول لإضافة تقييم</p>
                  <Button size="sm" variant="outline" onClick={() => requireAuth()}>تسجيل الدخول</Button>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <EmptyState icon={asIcon(Star)} title="لا توجد تقييمات بعد" message="كن أول من يقيّم هذه الخدمة" />
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {rev.reviewer_avatar ? <img src={rev.reviewer_avatar} className="w-full h-full object-cover" alt="" /> : <User className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-body text-ink">{rev.reviewer_name}</span>
                        <StarRating rating={rev.rating} size="sm" />
                        <span className="text-caption text-muted mr-auto">{formatRelativeTime(rev.created_at)}</span>
                      </div>
                      {rev.comment && <p className="text-body text-muted-600">{rev.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contact sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl card-shadow p-5 sticky top-20 space-y-3">
            <h3 className="font-bold text-ink">تواصل مع مزوّد الخدمة</h3>
            {!isSelf && providerUserId != null && (
              <Button fullWidth variant="primary" onClick={startConversation} loading={startingChat}>
                <ChatRoundDots className="h-4 w-4" /> مراسلة
              </Button>
            )}
            {provider.contact_phone && (
              <a
                href={`tel:${provider.contact_phone}`}
                onClick={() => trackVisitEvent("call_click", { targetType: "service", targetId: id })}
              >
                <Button fullWidth variant="primary">
                  <Phone className="h-4 w-4" /> اتصال
                </Button>
              </a>
            )}
            {wa && (
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackVisitEvent("whatsapp_click", { targetType: "service", targetId: id })}
              >
                <Button fullWidth variant="outline" className="border-success-500 text-success-600 hover:bg-success-50">
                  <ChatSquare className="h-4 w-4" /> واتساب
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
