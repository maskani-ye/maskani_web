"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, getErrorMessage, getErrorStatus } from "@/lib/api";
import {
  formatPrice, formatRelativeTime, formatDate,
  propertyTypeLabels, offerTypeLabels, furnishingLabels, statusColors, statusLabels, propertyTypeName } from "@/lib/utils";
import type { Listing } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import {
  MapPoint, Bed, Ruler, Eye, Heart, Phone, ChatSquare, ChatRoundDots,
  CheckCircle, CloseCircle, Buildings2, Share, AltArrowRight, User, PenNewSquare,
  Bath, Layers, TagPrice, WiFiRouter, CloudBolt, Shield, Leaf, Bolt, Box, Paw,
  Refresh, DangerTriangle,
} from "@solar-icons/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import MiniMap from "@/components/map/MiniMap";

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

interface ListingComment {
  id: number;
  user?: number | null;
  user_name: string;
  user_avatar: string | null;
  text: string;
  created_at: string;
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ notFound: boolean; message: string } | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<ListingComment[]>([]);
  const [startingChat, setStartingChat] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const loadListing = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get<Listing>(`/listings/${id}/`)
      .then((r) => { setListing(r.data); })
      .catch((err) => {
        // 404 حقيقي فقط يعني "غير موجود"؛ غير ذلك خطأ شبكة/خادم قابل لإعادة المحاولة.
        const status = getErrorStatus(err);
        if (status === 404) {
          setError({ notFound: true, message: "الإعلان غير موجود" });
        } else {
          setError({ notFound: false, message: getErrorMessage(err) });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadListing();

    api.get(`/social/listings/${id}/comments/`)
      .then((r) => setComments(r.data.results || r.data))
      .catch(() => {});
  }, [id, loadListing]);

  const handleFavorite = async () => {
    if (!user) { router.push("/auth/login"); return; }
    try {
      const { data } = await api.post(`/social/favorites/${id}/toggle/`);
      setFavorited(data.favorited);
      toast.success(data.message);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  // مساعد موحّد لبدء/فتح محادثة خاصة (DM) مع مستخدم مع ربطها بالإعلان.
  const startDM = async (recipientId: number) => {
    if (!user) { router.push("/auth/login"); return; }
    if (!listing) return;
    try {
      const { data } = await api.post("/chat/conversations/", {
        recipient_id: recipientId,
        listing: listing.id,
      });
      router.push(`/chat/${data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // "مراسلة المُعلن" — DM مع صاحب الإعلان.
  const startConversation = async () => {
    if (!user) { router.push("/auth/login"); return; }
    if (typeof listing?.user !== "object") return;
    setStartingChat(true);
    try {
      await startDM(listing.user.id);
    } finally {
      setStartingChat(false);
    }
  };

  // "رد خاص" — DM مع كاتب تعليق عام (نمط حراج: تعليق عام + رد خاص بالاسم).
  const startPrivateReply = async (commentId: number, authorId: number) => {
    if (!user) { router.push("/auth/login"); return; }
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
    if (!user) { router.push("/auth/login"); return; }
    if (!comment.trim()) return;
    try {
      const { data } = await api.post(`/social/listings/${id}/comments/add/`, { text: comment });
      setComments((p) => [...p, data]);
      setComment("");
      toast.success("تم إضافة التعليق");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-80 bg-gray-200 rounded-3xl mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="h-48 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  );

  // خطأ شبكة/خادم (ليس 404) — اعرض رسالة واضحة + إعادة المحاولة، لا "غير موجود".
  if (!listing && error && !error.notFound) return (
    <div className="max-w-md mx-auto text-center py-20 px-4">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
        <DangerTriangle className="h-7 w-7 text-red-500" />
      </div>
      <p className="text-gray-800 font-bold text-lg mb-1">تعذّر تحميل الإعلان</p>
      <p className="text-gray-500 text-sm mb-5">{error.message}</p>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={loadListing}>
          <Refresh className="h-4 w-4" /> إعادة المحاولة
        </Button>
        <Link href="/listings"><Button variant="outline">العودة للإعلانات</Button></Link>
      </div>
    </div>
  );

  // 404 حقيقي أو غياب البيانات — الإعلان غير موجود فعلاً.
  if (!listing) return (
    <div className="text-center py-20">
      <p className="text-gray-500 text-lg">الإعلان غير موجود</p>
      <Link href="/listings"><Button className="mt-4">العودة للإعلانات</Button></Link>
    </div>
  );

  const images = listing.images || (listing.main_image ? [{ id: 0, image: listing.main_image, is_main: true, order: 0 }] : []);

  const lat = listing.latitude != null ? parseFloat(listing.latitude) : NaN;
  const lng = listing.longitude != null ? parseFloat(listing.longitude) : NaN;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-primary">الرئيسية</Link>
        <AltArrowRight className="h-3.5 w-3.5" />
        <Link href="/listings" className="hover:text-primary">الإعلانات</Link>
        <AltArrowRight className="h-3.5 w-3.5" />
        <span className="text-gray-700 font-medium line-clamp-1">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Image Gallery */}
          <div className="bg-white rounded-3xl overflow-hidden card-shadow">
            <div className="relative h-72 md:h-96 bg-gray-100">
              {images.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    src={images[activeImage]?.image}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Buildings2 className="h-20 w-20 text-gray-300" />
                </div>
              )}
              {/* Overlay Badges */}
              <div className="absolute top-4 right-4 flex gap-2">
                <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${listing.offer_type === "sale" ? "bg-primary text-white" : "bg-gold text-white"}`}>
                  {offerTypeLabels[listing.offer_type]}
                </span>
                <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${statusColors[listing.status]}`}>
                  {statusLabels[listing.status]}
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
                    <img src={img.image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl card-shadow p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{listing.title}</h1>
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <MapPoint className="h-4 w-4 text-primary" />
                  <span>{listing.city_name}{listing.neighborhood && ` — ${listing.neighborhood}`}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleFavorite} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors">
                  <Heart className={`h-5 w-5 ${favorited ? "fill-red-500 text-red-500" : "text-gray-400"}`} />

                </button>
                <button onClick={handleShare} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <Share className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { icon: Buildings2, label: "النوع", value: propertyTypeName(listing.property_type) },
                ...(listing.rooms != null ? [{ icon: Bed, label: "الغرف", value: `${listing.rooms} غرف` }] : []),
                ...(listing.bathrooms != null ? [{ icon: Bath, label: "الحمامات", value: `${listing.bathrooms}` }] : []),
                ...(listing.area ? [{ icon: Ruler, label: "المساحة", value: `${listing.area} م²` }] : []),
                ...(listing.floor != null ? [{ icon: Layers, label: "الطابق", value: `${listing.floor}` }] : []),
                ...(listing.furnishing ? [{ icon: Box, label: "التأثيث", value: furnishingLabels[listing.furnishing] }] : []),
              ].map((spec, i) => {
                const Icon = spec.icon;
                return (
                  <div key={i} className="bg-cream rounded-xl p-3 text-center">
                    <Icon className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-gray-400">{spec.label}</p>
                    <p className="text-sm font-bold text-gray-800">{spec.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Features */}
            <div className="mb-5">
              <h3 className="font-bold text-gray-800 mb-3">المميزات</h3>
              <div className="flex flex-wrap gap-2">
                {featuresList.map(({ key, label, icon: Icon }) => {
                  const has = listing[key as keyof Listing] as boolean;
                  return (
                    <span key={key} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${has ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400 line-through"}`}>
                      {has ? <CheckCircle className="h-3.5 w-3.5" /> : <CloseCircle className="h-3.5 w-3.5" />}
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-bold text-gray-800 mb-2">الوصف</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {listing.views_count} مشاهدة</span>
              <span>نُشر {formatRelativeTime(listing.created_at)}</span>
            </div>
          </div>

          {/* Location — يظهر فقط عند توفّر الإحداثيات */}
          {hasCoords && (
            <div className="bg-white rounded-2xl card-shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
                  <MapPoint className="h-5 w-5 text-primary" /> الموقع
                </h3>
                <Link href={`/listings?view=map&lat=${lat}&lng=${lng}`}>
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
            <h3 className="font-bold text-gray-800 mb-4">التعليقات ({comments.length})</h3>
            {user && (
              <div className="flex gap-3 mb-5">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="اكتب تعليقك..."
                  className="flex-1 h-10 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                        <span className="font-semibold text-sm text-gray-800">{c.user_name}</span>
                        <span className="text-xs text-gray-400">{formatRelativeTime(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-600">{c.text}</p>
                      {canReply && (
                        <button
                          onClick={() => startPrivateReply(c.id, c.user as number)}
                          disabled={replyingTo === c.id}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
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
          {typeof listing.user === "object" && user?.id === listing.user.id && (
            <Link href={`/listings/${listing.id}/edit`}>
              <Button fullWidth variant="outline" className="mb-4">
                <PenNewSquare className="h-4 w-4" /> تعديل الإعلان
              </Button>
            </Link>
          )}

          {/* Price Card */}
          <div className="bg-white rounded-2xl card-shadow p-5 sticky top-20">
            <p className="text-3xl font-extrabold text-primary mb-1">{formatPrice(listing.price, listing.currency)}</p>
            {listing.offer_type !== "sale" && (
              <p className="text-sm text-gray-400">{listing.offer_type === "rent_monthly" ? "شهرياً" : "سنوياً"}</p>
            )}

            <hr className="my-4 border-gray-100" />

            {/* Contact */}
            <div className="space-y-3">
              {typeof listing.user === "object" && user?.id !== listing.user.id && (
                <Button fullWidth variant="primary" onClick={startConversation} loading={startingChat}>
                  <ChatRoundDots className="h-4 w-4" />
                  مراسلة المُعلن
                </Button>
              )}
              {listing.contact_phone && (
                <a href={`tel:${listing.contact_phone}`}>
                  <Button fullWidth variant="primary">
                    <Phone className="h-4 w-4" />

                    اتصال: {listing.contact_phone}
                  </Button>
                </a>
              )}
              {listing.contact_whatsapp && (
                <a href={`https://wa.me/${listing.contact_whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                  <Button fullWidth variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                    <ChatSquare className="h-4 w-4" />
                    واتساب
                  </Button>
                </a>
              )}
            </div>

            <hr className="my-4 border-gray-100" />

            {/* Owner Card */}
            {typeof listing.user === "object" && (
              <Link href={`/users/${listing.user.id}`}>
                <div className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-2 transition-colors">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {listing.user.avatar ? (
                      <img src={listing.user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm flex items-center gap-1">
                      {listing.user.full_name}
                      {listing.user.is_verified && <CheckCircle className="h-3.5 w-3.5 text-primary" />}
                    </p>
                    {listing.user.average_rating && (
                      <StarRating rating={listing.user.average_rating} size="sm" />
                    )}
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
