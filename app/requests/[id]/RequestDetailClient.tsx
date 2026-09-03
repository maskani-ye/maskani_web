"use client";

import { useState, useEffect, useCallback, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/nav/MarketLink";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useStartConversation } from "@/hooks/useStartConversation";
import { useAuthGate } from "@/context/AuthGate";
import { formatPrice, formatRelativeTime, propertyTypeName } from "@/lib/utils";
import type { ClientRequest, RequestOffer, Property, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { PropertyCard, type PropertyCardData } from "@/components/properties/PropertyCard";
import { Stars } from "@solar-icons/react";
import { PhoneField } from "@/components/ui/PhoneField";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  PenNewSquare, MapPoint, Bed, Dollar, ClockCircle, User, CheckCircle,
  Phone, AltArrowRight, Buildings2, ChatRound, ChatRoundDots,
} from "@solar-icons/react";
import { toast } from "sonner";
import { YouTubePlayer } from "@/components/ui/YouTubePlayer";
import { ShareButton } from "@/components/ui/ShareButton";

const asIcon = (I: ComponentType<{ className?: string }>) => I;

const offerTypeLabels: Record<string, string> = {
  sale: "للشراء", rent_monthly: "إيجار شهري", rent_yearly: "إيجار سنوي", any: "أي نوع",
};

export default function RequestDetailClient({ id, initialRequest }: { id: string; initialRequest: ClientRequest | null }) {
  const router = useRouter();
  const { start: startChatRaw, starting: startingChat } = useStartConversation();
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const [request, setRequest] = useState<ClientRequest | null>(initialRequest);
  const [offers, setOffers] = useState<RequestOffer[]>([]);
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(!initialRequest);
  const [message, setMessage] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // مطابقة العقارات بالذكاء الاصطناعي (تحميل عند الطلب)
  type MatchProperty = PropertyCardData & { match_score?: number; match_reason?: string };
  const [matches, setMatches] = useState<MatchProperty[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesLoaded, setMatchesLoaded] = useState(false);

  const fetchMatches = async () => {
    setMatchesLoading(true);
    try {
      const res = await api.get<{ matches: MatchProperty[] }>(`/requests/${id}/matches/`);
      setMatches(res.data.matches ?? []);
      setMatchesLoaded(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMatchesLoading(false);
    }
  };

  const isOwner = !!user && !!request && user.id === request.client;

  // "مراسلة" — بدء/فتح محادثة خاصة (DM) مع صاحب الطلب.

  // `request` قد يكون null قبل التحميل — الخطّاف نفسه يتجاهل المعرّف الفارغ.
  const startChat = () => startChatRaw(request?.client);

  const loadOffers = useCallback(() => {
    api.get(`/requests/${id}/offers/`)
      .then((r) => setOffers(r.data.results ?? r.data ?? []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    api.get<ClientRequest>(`/requests/${id}/`)
      .then((r) => setRequest(r.data))
      .catch(() => toast.error("لم يتم العثور على الطلب"))
      .finally(() => setLoading(false));
  }, [id]);

  // العروض: صاحب الطلب فقط يراها. غيره يقدّم عرضاً.
  useEffect(() => {
    if (isOwner) loadOffers();
  }, [isOwner, loadOffers]);

  // لمقدّمي العروض: جلب عقاراتي لربط عرض بعقار (اختياري)
  useEffect(() => {
    if (user && request && user.id !== request.client) {
      api.get<PaginatedResponse<Property>>("/properties/my/", { params: { offset: 0, limit: 100 } })
        .then((r) => setMyProperties(r.data.results))
        .catch(() => {});
    }
  }, [user, request]);

  useEffect(() => {
    if (user?.phone && !contactPhone) setContactPhone(user.phone);
  }, [user, contactPhone]);

  const submitOffer = async () => {
    if (!requireAuth()) return;
    if (!message.trim()) { toast.error("اكتب رسالة العرض"); return; }
    if (!contactPhone.trim()) { toast.error("أدخل رقم التواصل"); return; }
    setSubmitting(true);
    try {
      await api.post(`/requests/${id}/offers/create/`, {
        message,
        contact_phone: contactPhone,
        ...(selectedProperty ? { property: Number(selectedProperty) } : {}),
      });
      toast.success("تم إرسال عرضك");
      setMessage("");
      setSelectedProperty("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );

  if (!request) return (
    <div className="text-center py-20">
      <p className="text-muted-500 text-h3">الطلب غير موجود</p>
      <Link href="/requests"><Button className="mt-4">العودة للطلبات</Button></Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-body text-muted mb-6">
        <Link href="/requests" className="hover:text-primary">طلبات العملاء</Link>
        <AltArrowRight className="h-3.5 w-3.5" />
        <span className="text-muted-700 font-medium">تفاصيل الطلب</span>
        <ShareButton title="طلب عقاري على مسكني" text="طلب عقاري على منصّة مسكني" className="mr-auto w-9 h-9 bg-muted-50 rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors" />
      </div>

      {/* Request card */}
      <div className="bg-white rounded-2xl card-shadow p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-caption font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
            {(request.property_type_name || propertyTypeName(request.property_type))}
          </span>
          <span className="text-caption bg-gold/10 text-gold px-2.5 py-1 rounded-full font-semibold">
            {offerTypeLabels[request.offer_type] || request.offer_type}
          </span>
          {!request.is_active && <span className="text-caption bg-muted-100 text-muted-500 px-2.5 py-1 rounded-full">مغلق</span>}
          {request.is_expired && <span className="text-caption bg-danger-50 text-danger-500 px-2.5 py-1 rounded-full">منتهي</span>}
        </div>

        <h1 className="text-h3 font-bold text-ink mb-3">{request.title || `${request.client_name} يبحث عن عقار`}</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-cream rounded-xl p-3">
            <div className="flex items-center gap-1 text-caption text-muted mb-0.5"><MapPoint className="h-3.5 w-3.5" /> المدينة</div>
            <p className="text-body font-bold text-ink">{request.city_name}{request.neighborhood && ` — ${request.neighborhood}`}</p>
          </div>
          {(request.budget_min || request.budget_max) && (
            <div className="bg-cream rounded-xl p-3">
              <div className="flex items-center gap-1 text-caption text-muted mb-0.5"><Dollar className="h-3.5 w-3.5" /> الميزانية</div>
              <p className="text-body font-bold text-ink">
                {request.budget_min ? formatPrice(request.budget_min, request.currency) : "—"}
                {" - "}
                {request.budget_max ? formatPrice(request.budget_max, request.currency) : "—"}
              </p>
            </div>
          )}
          {request.rooms_needed != null && (
            <div className="bg-cream rounded-xl p-3">
              <div className="flex items-center gap-1 text-caption text-muted mb-0.5"><Bed className="h-3.5 w-3.5" /> الغرف</div>
              <p className="text-body font-bold text-ink">{request.rooms_needed} غرف</p>
            </div>
          )}
        </div>

        {request.additional_specs && (
          <div className="mb-4">
            <h3 className="font-bold text-ink text-body mb-1">مواصفات إضافية</h3>
            <p className="text-body text-muted-600 leading-relaxed whitespace-pre-line">{request.additional_specs}</p>
          </div>
        )}

        {/* فيديو الطلب — يوضّح ما يبحث عنه صاحب الطلب أدقّ من نصّ. */}
        {request.video_url && (
          <div className="mb-4">
            <h3 className="font-bold text-ink text-body mb-1">فيديو</h3>
            <YouTubePlayer url={request.video_url} title="طلب عقاري" />
          </div>
        )}

        <div className="flex items-center gap-3 pt-3 border-t border-muted-100 text-caption text-muted">
          <span className="flex items-center gap-1"><ClockCircle className="h-3.5 w-3.5" /> {formatRelativeTime(request.created_at)}</span>
          <span className="mr-auto font-bold text-primary">{request.offers_count} عرض</span>
        </div>

        {!isOwner && (
          <Button className="mt-4" fullWidth variant="primary" onClick={startChat} loading={startingChat}>
            <ChatRoundDots className="h-4 w-4" /> مراسلة صاحب الطلب
          </Button>
        )}
      </div>

      {/* عقارات مطابقة بالذكاء الاصطناعي */}
      <div className="bg-white rounded-2xl card-shadow p-6 mt-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-bold text-ink flex items-center gap-1.5">
            <Stars className="h-5 w-5 text-primary" /> عقارات مطابقة (ذكاء اصطناعي)
          </h2>
          {(!matchesLoaded || matches.length > 0) && (
            <Button variant="outline" size="sm" onClick={fetchMatches} loading={matchesLoading}>
              {matchesLoaded ? "تحديث" : "اعثر على مطابقات"}
            </Button>
          )}
        </div>
        {!matchesLoaded ? (
          <p className="text-body text-muted mt-3">
            دع الذكاء الاصطناعي يرشّح لك أنسب العقارات المتاحة لهذا الطلب.
          </p>
        ) : matches.length === 0 ? (
          <p className="text-body text-muted mt-3">لا توجد عقارات مطابقة متاحة حالياً.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {matches.map((p) => (
              <div key={p.id}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-caption font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    مطابقة {p.match_score}%
                  </span>
                  {p.match_reason && <span className="text-caption text-muted-500 line-clamp-1">{p.match_reason}</span>}
                </div>
                <PropertyCard property={p} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Owner view: offers list */}
      {isOwner ? (
        <div className="bg-white rounded-2xl card-shadow p-6 mt-6">
          <h2 className="font-bold text-ink mb-4 flex items-center gap-1.5">
            <ChatRound className="h-5 w-5 text-primary" /> العروض المستلمة ({offers.length})
          </h2>
          {offers.length === 0 ? (
            <EmptyState icon={asIcon(PenNewSquare)} title="لا توجد عروض بعد" message="سيظهر هنا كل من يقدّم عرضاً على طلبك" />
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => (
                <div key={offer.id} className="border border-muted-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {offer.offered_by_avatar ? <img src={offer.offered_by_avatar} className="w-full h-full object-cover" alt="" /> : <User className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <p className="font-semibold text-body text-ink flex items-center gap-1">
                        {offer.offered_by_name}
                        {offer.offered_by_verified && <CheckCircle className="h-3.5 w-3.5 text-primary" />}
                      </p>
                      <p className="text-caption text-muted">{formatRelativeTime(offer.created_at)}</p>
                    </div>
                    {offer.is_accepted && <span className="mr-auto text-caption bg-success-100 text-success-700 px-2 py-0.5 rounded-full font-semibold">مقبول</span>}
                  </div>
                  <p className="text-body text-muted-600 mb-2">{offer.message}</p>
                  {offer.property_details && (
                    <Link href={`/properties/${offer.property_details.id}`} className="flex items-center gap-2 bg-cream rounded-xl p-2 mb-2 hover:bg-primary/5 transition-colors">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted-100 flex-shrink-0">
                        {offer.property_details.main_image ? <img src={offer.property_details.main_image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center"><Buildings2 className="h-5 w-5 text-muted-200" /></div>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-body font-semibold text-ink truncate">{offer.property_details.title}</p>
                        <p className="text-caption text-primary font-bold">{formatPrice(offer.property_details.price, offer.property_details.currency)}</p>
                      </div>
                    </Link>
                  )}
                  {offer.contact_phone && (
                    <a href={`tel:${offer.contact_phone}`} className="inline-flex items-center gap-1 text-body text-primary font-semibold" dir="ltr">
                      <Phone className="h-3.5 w-3.5" /> {offer.contact_phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Non-owner: submit offer */
        <div className="bg-white rounded-2xl card-shadow p-6 mt-6">
          <h2 className="font-bold text-ink mb-4">قدّم عرضك</h2>
          {!user ? (
            <div className="flex items-center justify-between">
              <p className="text-body text-muted-500">سجّل الدخول لتقديم عرض على هذا الطلب</p>
              <Button size="sm" variant="outline" onClick={() => requireAuth()}>تسجيل الدخول</Button>
            </div>
          ) : !request.is_active ? (
            <p className="text-body text-muted-500">هذا الطلب مغلق ولا يقبل عروضاً جديدة.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-body font-semibold text-muted-700 mb-1.5 block">رسالة العرض <span className="text-danger-500">*</span></label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="اكتب تفاصيل ما تعرضه على صاحب الطلب..."
                  className="w-full border border-muted-200 rounded-xl px-4 py-3 text-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>
              {myProperties.length > 0 && (
                <Select
                  label="اربط بعقار (اختياري)"
                  options={myProperties.map((l) => ({ value: l.id, label: l.title }))}
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  placeholder="بدون عقار"
                />
              )}
              <div>
                <PhoneField label="رقم التواصل *" value={contactPhone} onChange={(v) => setContactPhone(v)} />
              </div>
              <Button onClick={submitOffer} loading={submitting} fullWidth>
                <PenNewSquare className="h-4 w-4" /> إرسال العرض
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
