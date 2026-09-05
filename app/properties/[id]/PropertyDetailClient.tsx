"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/nav/MarketLink";
import { api, getErrorMessage, getErrorStatus } from "@/lib/api";
import { trackVisitEvent } from "@/lib/track";
import {
  formatPrice, formatRelativeTime,
  offerTypeLabels, furnishingLabels, statusColors, statusLabels, propertyTypeName } from "@/lib/utils";
import type { Property } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { Button } from "@/components/ui/Button";
import { AskPropertyBox } from "@/components/ai/AskPropertyBox";
import { StarRating } from "@/components/ui/StarRating";
import {
  MapPoint, Bed, Ruler, Eye, Heart, Phone, ChatSquare, ChatRoundDots,
  CheckCircle, CloseCircle, Buildings2, Share, AltArrowRight, User, PenNewSquare,
  Bath, Layers, TagPrice, WiFiRouter, CloudBolt, Shield, Leaf, Bolt, Box, Paw,
  Refresh, DangerTriangle,
} from "@solar-icons/react";
import { toast } from "sonner";
import { YouTubePlayer } from "@/components/ui/YouTubePlayer";
import { motion, AnimatePresence } from "framer-motion";
import MiniMap from "@/components/map/MiniMap";
import { MatchingRequests } from "@/components/properties/MatchingRequests";
import { AvailabilityPrompt } from "@/components/properties/AvailabilityPrompt";
import { TrustSignals } from "@/components/properties/TrustSignals";

const featuresList = [
  { key: "has_elevator", label: "مصعد", icon: Layers },
  { key: "has_parking", label: "موقف سيارة", icon: TagPrice },
  { key: "has_garden", label: "حديقة", icon: Leaf },
  { key: "has_pool", label: "مسبح", icon: Box },
  { key: "has_security", label: "أمن وحراسة", icon: Shield },
  { key: "has_internet", label: "إنترنت", icon: WiFiRouter },
  { key: "has_ac", label: "تكييف", icon: CloudBolt },
  { key: "has_generator", label: "مولد كهربائي", icon: Bolt },
  { key: "has_storage", label: "غرفة تخزين", icon: Box },
  { key: "pets_allowed", label: "يسمح بالحيوانات", icon: Paw },
] as const;

// نوع العقار قد يصل ككائن {id,name_ar,icon} (جدول PropertyType) أو كسلسلة قديمة.

interface PropertyComment {
  id: number;
  user?: number | null;
  user_name: string;
  user_avatar: string | null;
  text: string;
  created_at: string;
}

// جزيرة تفاعلية (client) — تستقبل بيانات العقار المُصيَّرة من الخادم (initialProperty)
// كي يظهر المحتوى في HTML الخام فورًا (SSR) بدل هيكل تحميل فارغ؛ ثم تُحدّثها بهدوء.
export default function PropertyDetailClient(
  { id, initialProperty }: { id: string; initialProperty: Property | null },
) {
  const router = useRouter();
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const [property, setProperty] = useState<Property | null>(initialProperty);
  const [loading, setLoading] = useState(!initialProperty);
  const [error, setError] = useState<{ notFound: boolean; message: string } | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<PropertyComment[]>([]);
  const [startingChat, setStartingChat] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const loadProperty = useCallback(() => {
    // لا نُظهر هيكل التحميل إن كان المحتوى المُصيَّر خادميًا حاضرًا — تحديث صامت.
    if (!initialProperty) setLoading(true);
    setError(null);
    api.get<Property>(`/properties/${id}/`)
      .then((r) => { setProperty(r.data); })
      .catch((err) => {
        // 404 حقيقي فقط يعني "غير موجود"؛ غير ذلك خطأ شبكة/خادم قابل لإعادة المحاولة.
        const status = getErrorStatus(err);
        if (status === 404) {
          setError({ notFound: true, message: "العقار غير موجود" });
        } else {
          setError({ notFound: false, message: getErrorMessage(err) });
        }
      })
      .finally(() => setLoading(false));
  }, [id, initialProperty]);

  useEffect(() => {
    loadProperty();

    api.get(`/social/properties/${id}/comments/`)
      .then((r) => setComments(r.data.results || r.data))
      .catch(() => {});
  }, [id, loadProperty]);

  const handleFavorite = async () => {
    if (!requireAuth()) return;
    try {
      const { data } = await api.post(`/social/favorites/${id}/toggle/`);
      setFavorited(data.favorited);
      toast.success(data.message);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  // مساعد موحّد لبدء/فتح محادثة خاصة (DM) مع مستخدم مع ربطها بالعقار.
  const startDM = async (recipientId: number) => {
    if (!requireAuth()) return;
    if (!property) return;
    try {
      const { data } = await api.post("/chat/conversations/", {
        recipient_id: recipientId,
        property: property.id,
      });
      router.push(`/chat/${data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // "مراسلة المُعلن" — DM مع صاحب العقار.
  const startConversation = async () => {
    if (!requireAuth()) return;
    if (typeof property?.user !== "object") return;
    trackVisitEvent("chat_started", { targetType: "property", targetId: property.id });
    setStartingChat(true);
    try {
      await startDM(property.user.id);
    } finally {
      setStartingChat(false);
    }
  };

  // "رد خاص" — DM مع كاتب تعليق عام (نمط حراج: تعليق عام + رد خاص بالاسم).
  const startPrivateReply = async (commentId: number, authorId: number) => {
    if (!requireAuth()) return;
    setReplyingTo(commentId);
    try {
      await startDM(authorId);
    } finally {
      setReplyingTo(null);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("تم نسخ الرابط");
  };

  const handleComment = async () => {
    if (!requireAuth()) return;
    if (!comment.trim()) return;
    try {
      const { data } = await api.post(`/social/properties/${id}/comments/add/`, { text: comment });
      setComments((p) => [...p, data]);
      setComment("");
      toast.success("تم إضافة التعليق");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-80 bg-muted-200 rounded-3xl mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="h-8 bg-muted-200 rounded w-3/4" />
          <div className="h-4 bg-muted-200 rounded w-1/2" />
        </div>
        <div className="h-48 bg-muted-200 rounded-2xl" />
      </div>
    </div>
  );

  // خطأ شبكة/خادم (ليس 404) — اعرض رسالة واضحة + إعادة المحاولة، لا "غير موجود".
  if (!property && error && !error.notFound) return (
    <div className="max-w-md mx-auto text-center py-20 px-4">
      <div className="w-14 h-14 rounded-2xl bg-danger-50 flex items-center justify-center mx-auto mb-4">
        <DangerTriangle className="h-7 w-7 text-danger-500" />
      </div>
      <p className="text-ink font-bold text-h3 mb-1">تعذّر تحميل العقار</p>
      <p className="text-muted-500 text-body mb-5">{error.message}</p>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={loadProperty}>
          <Refresh className="h-4 w-4" /> إعادة المحاولة
        </Button>
        <Link href="/properties"><Button variant="outline">العودة للعقارات</Button></Link>
      </div>
    </div>
  );

  // 404 حقيقي أو غياب البيانات — العقار غير موجود فعلاً.
  if (!property) return (
    <div className="text-center py-20">
      <p className="text-muted-500 text-h3">العقار غير موجود</p>
      <Link href="/properties"><Button className="mt-4">العودة للعقارات</Button></Link>
    </div>
  );

  const images = property.images || (property.main_image ? [{ id: 0, image: property.main_image, is_main: true, order: 0 }] : []);

  const lat = property.latitude != null ? parseFloat(property.latitude) : NaN;
  const lng = property.longitude != null ? parseFloat(property.longitude) : NaN;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-body text-muted mb-6">
        <Link href="/" className="hover:text-primary">الرئيسية</Link>
        <AltArrowRight className="h-3.5 w-3.5" />
        <Link href="/properties" className="hover:text-primary">العقارات</Link>
        <AltArrowRight className="h-3.5 w-3.5" />
        <span className="text-muted-700 font-medium line-clamp-1">{property.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Image Gallery */}
          <div className="bg-white rounded-3xl overflow-hidden card-shadow">
            <div className="relative h-72 md:h-96 bg-muted-100">
              {images.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    src={images[activeImage]?.image}
                    alt={property.title}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Buildings2 className="h-20 w-20 text-muted-200" />
                </div>
              )}
              {/* Overlay Badges */}
              <div className="absolute top-4 right-4 flex gap-2">
                <span className={`text-body font-bold px-3 py-1.5 rounded-full ${property.offer_type === "sale" ? "bg-primary text-white" : "bg-gold text-white"}`}>
                  {offerTypeLabels[property.offer_type]}
                </span>
                <span className={`text-body font-bold px-3 py-1.5 rounded-full ${statusColors[property.status]}`}>
                  {statusLabels[property.status]}
                </span>
              </div>
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-16 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === activeImage ? "border-primary" : "border-transparent"}`}
                  >
                    <img src={img.image} alt={`${property.title} — صورة ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl card-shadow p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-h2 font-bold text-ink mb-1">{property.title}</h1>
                <div className="flex items-center gap-1 text-muted-500 text-body">
                  <MapPoint className="h-4 w-4 text-primary" />
                  <span>{property.city_name}{property.neighborhood && ` — ${property.neighborhood}`}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleFavorite} className="w-10 h-10 bg-muted-50 rounded-xl flex items-center justify-center hover:bg-danger-50 transition-colors">
                  <Heart className={`h-5 w-5 ${favorited ? "fill-danger-500 text-danger-500" : "text-muted"}`} />

                </button>
                <button onClick={handleShare} className="w-10 h-10 bg-muted-50 rounded-xl flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <Share className="h-5 w-5 text-muted" />
                </button>
              </div>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { icon: Buildings2, label: "النوع", value: propertyTypeName(property.property_type) },
                ...(property.rooms != null ? [{ icon: Bed, label: "الغرف", value: `${property.rooms} غرف` }] : []),
                ...(property.bathrooms != null ? [{ icon: Bath, label: "الحمامات", value: `${property.bathrooms}` }] : []),
                ...(property.area ? [{ icon: Ruler, label: "المساحة", value: `${property.area} م²` }] : []),
                ...(property.floor != null ? [{ icon: Layers, label: "الطابق", value: `${property.floor}` }] : []),
                ...(property.furnishing ? [{ icon: Box, label: "التأثيث", value: furnishingLabels[property.furnishing] }] : []),
              ].map((spec, i) => {
                const Icon = spec.icon;
                return (
                  <div key={i} className="bg-cream rounded-xl p-3 text-center">
                    <Icon className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-caption text-muted">{spec.label}</p>
                    <p className="text-body font-bold text-ink">{spec.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Features */}
            <div className="mb-5">
              <h3 className="font-bold text-ink mb-3">المميزات</h3>
              <div className="flex flex-wrap gap-2">
                {featuresList.map(({ key, label }) => {
                  const has = property[key as keyof Property] as boolean;
                  return (
                    <span key={key} className={`flex items-center gap-1.5 text-caption px-3 py-1.5 rounded-full font-medium ${has ? "bg-primary/10 text-primary" : "bg-muted-100 text-muted line-through"}`}>
                      {has ? <CheckCircle className="h-3.5 w-3.5" /> : <CloseCircle className="h-3.5 w-3.5" />}
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-bold text-ink mb-2">الوصف</h3>
              <p className="text-muted-600 text-body leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>

            {/* فيديو الإعلان — يُعرض بعد الوصف مباشرةً حيث يبحث عنه المهتمّ. */}
            {property.video_url && (
              <div>
                <h3 className="font-bold text-ink mb-2">فيديو</h3>
                <YouTubePlayer url={property.video_url} title={property.title} />
              </div>
            )}

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-muted-100 text-caption text-muted">
              <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {property.views_count} مشاهدة</span>
              <span>نُشر {formatRelativeTime(property.created_at)}</span>
            </div>
          </div>

          {/* اسأل عن العقار (ذكاء اصطناعي) */}
          <AskPropertyBox propertyId={property.id} />

          {/* Location — يظهر فقط عند توفّر الإحداثيات */}
          {hasCoords && (
            <div className="bg-white rounded-2xl card-shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex min-w-0 items-center gap-1.5 truncate font-bold text-ink">
                  <MapPoint className="h-5 w-5 shrink-0 text-primary" /> الموقع
                </h3>
                <Link href={`/properties?view=map&lat=${lat}&lng=${lng}`}>
                  <Button variant="outline" size="sm">
                    <MapPoint className="h-4 w-4" /> عرض على الخريطة الكاملة
                  </Button>
                </Link>
              </div>
              <div className="h-64 w-full overflow-hidden rounded-2xl">
                <MiniMap lat={lat} lng={lng} />
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-white rounded-2xl card-shadow p-6">
            <h3 className="font-bold text-ink mb-4">التعليقات ({comments.length})</h3>
            {user && (
              <div className="flex gap-3 mb-5">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="اكتب تعليقك..."
                  className="flex-1 h-10 border border-muted-200 rounded-xl px-4 text-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <Button size="sm" onClick={handleComment}>نشر</Button>
              </div>
            )}
            <div className="space-y-4">
              {comments.map((c) => {
                const canReply = c.user != null && c.user !== user?.id;
                return (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {c.user_avatar ? <img src={c.user_avatar} alt="" className="w-full h-full rounded-full object-cover" /> : <User className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-body text-ink">{c.user_name}</span>
                        <span className="text-caption text-muted">{formatRelativeTime(c.created_at)}</span>
                      </div>
                      <p className="text-body text-muted-600">{c.text}</p>
                      {canReply && (
                        <button
                          onClick={() => startPrivateReply(c.id, c.user as number)}
                          disabled={replyingTo === c.id}
                          className="mt-2 inline-flex items-center gap-1 text-caption font-semibold text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
                        >
                          <ChatRoundDots className="h-3.5 w-3.5" />
                          {replyingTo === c.id ? "جارٍ الفتح…" : "رد خاص"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right Column ──────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Owner-only edit */}
          {typeof property.user === "object" && user?.id === property.user.id && (
            <Link href={`/properties/${property.id}/edit`}>
              <Button fullWidth variant="outline" className="mb-4">
                <PenNewSquare className="h-4 w-4" /> تعديل العقار
              </Button>
            </Link>
          )}

          {/* «هل ما زال متاحًا؟» — للمالك حين يقترب انتهاء العرض */}
          {typeof property.user === "object" && user?.id === property.user.id && (
            <AvailabilityPrompt
              propertyId={property.id}
              expiresAt={property.expires_at}
              onDone={loadProperty}
            />
          )}

          {/* الباحثون المطابقون — للمالك وحده (المسار محميّ في الخادم أيضاً) */}
          {typeof property.user === "object" && user?.id === property.user.id && (
            <MatchingRequests propertyId={property.id} />
          )}

          {/* Price Card */}
          <div className="bg-white rounded-2xl card-shadow p-5 sticky top-20">
            {(property.is_promoted || property.price_reduced) && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {property.is_promoted && (
                  <span className="text-caption font-bold px-2.5 py-1 rounded-full bg-gold text-white">مميّز</span>
                )}
                {property.price_reduced && (
                  <span className="text-caption font-bold px-2.5 py-1 rounded-full bg-success-600 text-white">انخفض السعر</span>
                )}
              </div>
            )}
            {property.price_reduced && property.previous_price && (
              <p className="text-body text-muted line-through">{formatPrice(property.previous_price, property.currency)}</p>
            )}
            <p className="text-h1 font-extrabold text-primary mb-1">{formatPrice(property.price, property.currency)}</p>
            {property.offer_type !== "sale" && (
              <p className="text-body text-muted">{property.offer_type === "rent_monthly" ? "شهرياً" : "سنوياً"}</p>
            )}

            <hr className="my-4 border-muted-100" />

            {/* Contact */}
            <div className="space-y-3">
              {typeof property.user === "object" && user?.id !== property.user.id && (
                <Button fullWidth variant="primary" onClick={startConversation} loading={startingChat}>
                  <ChatRoundDots className="h-4 w-4" />
                  مراسلة المُعلن
                </Button>
              )}
              {property.contact_phone && (
                <a
                  href={`tel:${property.contact_phone}`}
                  onClick={() => trackVisitEvent("call_click", { targetType: "property", targetId: property.id })}
                >
                  <Button fullWidth variant="primary">
                    <Phone className="h-4 w-4" />

                    اتصال: {property.contact_phone}
                  </Button>
                </a>
              )}
              {property.contact_whatsapp && (
                <a
                  href={`https://wa.me/${property.contact_whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackVisitEvent("whatsapp_click", { targetType: "property", targetId: property.id })}
                >
                  <Button fullWidth variant="outline" className="border-success-500 text-success-600 hover:bg-success-50">
                    <ChatSquare className="h-4 w-4" />
                    واتساب
                  </Button>
                </a>
              )}
            </div>

            <hr className="my-4 border-muted-100" />

            {/* Owner Card */}
            {typeof property.user === "object" && (
              <Link href={`/users/${property.user.id}`}>
                <div className="flex items-center gap-3 hover:bg-muted-50 rounded-xl p-2 transition-colors">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {property.user.avatar ? (
                      <img src={property.user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-ink text-body flex items-center gap-1">
                      {property.user.full_name}
                      {property.user.is_verified && <CheckCircle className="h-3.5 w-3.5 text-primary" />}
                    </p>
                    {property.user.average_rating && (
                      <StarRating rating={property.user.average_rating} size="sm" />
                    )}
                    {/* مؤشّر الاستجابة — محسوب من بيانات الشات لا من ادّعاء
                        المُعلِن. الخادم يخفيه حين تكون العيّنة غير كافية. */}
                    {property.user_response_label && (
                      <p className="text-caption text-muted-500 mt-0.5 flex items-center gap-1">
                        <ChatRoundDots className="h-3 w-3 text-primary" />
                        {property.user_response_label}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* إشارات التحقّق — وصف محايد يبني عليه الباحث قراره */}
          <TrustSignals property={property} />
        </div>
      </div>
    </div>
  );
}
