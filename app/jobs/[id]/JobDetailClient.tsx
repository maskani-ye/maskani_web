"use client";

import { useState, useEffect, useCallback, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/nav/MarketLink";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useStartConversation } from "@/hooks/useStartConversation";
import { useAuthGate } from "@/context/AuthGate";
import { formatPrice, formatRelativeTime } from "@/lib/utils";
import type { PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { ServiceCard, type ServiceCardData } from "@/components/services/ServiceCard";
import { Stars } from "@solar-icons/react";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Settings, MapPoint, Dollar, ClockCircle, User, CheckCircle,
  Phone, AltArrowRight, ChatRound, ChatRoundDots,
} from "@solar-icons/react";
import { toast } from "sonner";
import { YouTubePlayer } from "@/components/ui/YouTubePlayer";
import { ShareButton } from "@/components/ui/ShareButton";

const asIcon = (I: ComponentType<{ className?: string }>) => I;

export interface ServiceRequest {
  id: number;
  title: string;
  description: string;
  category: { id: number; name_ar: string } | null;
  city_name: string;
  client: number;
  client_name: string;
  budget_min: string | null;
  budget_max: string | null;
  currency: string;
  contact_phone: string;
  is_active: boolean;
  status: string;
  offers_count: number;
  /** رابط فيديو يوتيوب اختياري */
  video_url?: string | null;
  created_at: string;
}
interface ServiceOffer {
  id: number;
  message: string;
  price: string | null;
  currency: string;
  is_accepted: boolean;
  created_at: string;
  provider_name: string;
  provider_avatar: string | null;
  provider_verified: boolean;
  offerer_phone: string | null;
}

export default function JobDetailClient({ id, initialRequest }: { id: string; initialRequest: ServiceRequest | null }) {
  const router = useRouter();
  const { start: startChatRaw, starting: startingChat } = useStartConversation();
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const [request, setRequest] = useState<ServiceRequest | null>(initialRequest);
  const [offers, setOffers] = useState<ServiceOffer[]>([]);
  const [loading, setLoading] = useState(!initialRequest);
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("YER");
  const [submitting, setSubmitting] = useState(false);
  const [busy, setBusy] = useState(false);

  // مطابقة مزوّدي الخدمة بالذكاء الاصطناعي (عند الطلب)
  type MatchProvider = ServiceCardData & { match_score?: number; match_reason?: string };
  const [matches, setMatches] = useState<MatchProvider[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesLoaded, setMatchesLoaded] = useState(false);

  const fetchMatches = async () => {
    setMatchesLoading(true);
    try {
      const res = await api.get<{ matches: MatchProvider[] }>(`/jobs/${id}/matches/`);
      setMatches(res.data.matches ?? []);
      setMatchesLoaded(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMatchesLoading(false);
    }
  };

  const isOwner = !!user && !!request && user.id === request.client;

  const loadRequest = useCallback(() => {
    api.get<ServiceRequest>(`/jobs/${id}/`)
      .then((r) => setRequest(r.data))
      .catch(() => toast.error("لم يتم العثور على الطلب"))
      .finally(() => setLoading(false));
  }, [id]);

  // `request` قد يكون null قبل التحميل — الخطّاف نفسه يتجاهل المعرّف الفارغ.
  const startChat = () => startChatRaw(request?.client);

  const loadOffers = useCallback(() => {
    api.get(`/jobs/${id}/offers/`)
      .then((r) => setOffers(r.data.results ?? r.data ?? []))
      .catch(() => {});
  }, [id]);

  useEffect(() => { loadRequest(); }, [loadRequest]);
  useEffect(() => { if (isOwner) loadOffers(); }, [isOwner, loadOffers]);
  useEffect(() => {
    if (user?.phone && !price) setCurrency("YER");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  const submitOffer = async () => {
    if (!requireAuth()) return;
    if (!message.trim()) { toast.error("اكتب رسالة العرض"); return; }
    setSubmitting(true);
    try {
      await api.post(`/jobs/${id}/offers/`, {
        message, currency, ...(price ? { price } : {}),
      });
      toast.success("تم إرسال عرضك");
      setMessage(""); setPrice("");
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSubmitting(false); }
  };

  const acceptOffer = async (offerId: number) => {
    setBusy(true);
    try {
      await api.post(`/jobs/${id}/offers/${offerId}/accept/`);
      toast.success("تم قبول العرض");
      loadRequest(); loadOffers();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setBusy(false); }
  };

  const closeRequest = async () => {
    setBusy(true);
    try {
      await api.post(`/jobs/${id}/close/`);
      toast.success("تم إغلاق الطلب");
      loadRequest();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setBusy(false); }
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
      <Link href="/jobs"><Button className="mt-4">العودة للطلبات</Button></Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 text-body text-muted mb-6">
        <Link href="/jobs" className="hover:text-primary">طلبات الخدمات</Link>
        <AltArrowRight className="h-3.5 w-3.5" />
        <span className="text-muted-700 font-medium">تفاصيل الطلب</span>
        <ShareButton title={request.title} text={`طلب خدمة على مسكني: ${request.title}`} className="mr-auto w-9 h-9 bg-muted-50 rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors" />
      </div>

      <div className="bg-white rounded-2xl card-shadow p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {request.category && (
            <span className="text-caption font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">{request.category.name_ar}</span>
          )}
          {!request.is_active && <span className="text-caption bg-muted-100 text-muted-500 px-2.5 py-1 rounded-full">مغلق</span>}
        </div>

        <h1 className="text-h3 font-bold text-ink mb-3">{request.title}</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-cream rounded-xl p-3">
            <div className="flex items-center gap-1 text-caption text-muted mb-0.5"><MapPoint className="h-3.5 w-3.5" /> المدينة</div>
            <p className="text-body font-bold text-ink">{request.city_name}</p>
          </div>
          {(request.budget_min || request.budget_max) && (
            <div className="bg-cream rounded-xl p-3">
              <div className="flex items-center gap-1 text-caption text-muted mb-0.5"><Dollar className="h-3.5 w-3.5" /> الميزانية</div>
              <p className="text-body font-bold text-ink">
                {request.budget_min ? formatPrice(request.budget_min, request.currency) : "—"}{" - "}
                {request.budget_max ? formatPrice(request.budget_max, request.currency) : "—"}
              </p>
            </div>
          )}
        </div>

        {request.description && (
          <div className="mb-4">
            <h3 className="font-bold text-ink text-body mb-1">التفاصيل</h3>
            <p className="text-body text-muted-600 leading-relaxed whitespace-pre-line">{request.description}</p>
          </div>
        )}

        {/* فيديو الطلب — بعد التفاصيل حيث يبحث عنه المهتمّ. */}
        {request.video_url && (
          <div className="mb-4">
            <h3 className="font-bold text-ink text-body mb-1">فيديو</h3>
            <YouTubePlayer url={request.video_url} title={request.title} />
          </div>
        )}

        <div className="flex items-center gap-3 pt-3 border-t border-muted-100 text-caption text-muted">
          <span className="flex items-center gap-1"><ClockCircle className="h-3.5 w-3.5" /> {formatRelativeTime(request.created_at)}</span>
          <span className="mr-auto font-bold text-primary">{request.offers_count} عرض</span>
        </div>

        {isOwner ? (
          request.is_active && (
            <Button className="mt-4" fullWidth variant="outline" onClick={closeRequest} loading={busy}>إغلاق الطلب</Button>
          )
        ) : (
          <Button className="mt-4" fullWidth variant="primary" onClick={startChat} loading={startingChat}>
            <ChatRoundDots className="h-4 w-4" /> مراسلة صاحب الطلب
          </Button>
        )}
      </div>

      {/* مزوّدو خدمة مطابقون بالذكاء الاصطناعي */}
      <div className="bg-white rounded-2xl card-shadow p-6 mt-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-bold text-ink flex items-center gap-1.5">
            <Stars className="h-5 w-5 text-primary" /> مزوّدون مطابقون (ذكاء اصطناعي)
          </h2>
          {(!matchesLoaded || matches.length > 0) && (
            <Button variant="outline" size="sm" onClick={fetchMatches} loading={matchesLoading}>
              {matchesLoaded ? "تحديث" : "اعثر على مطابقات"}
            </Button>
          )}
        </div>
        {!matchesLoaded ? (
          <p className="text-body text-muted mt-3">
            دع الذكاء الاصطناعي يرشّح لك أنسب مزوّدي الخدمة لهذا الطلب.
          </p>
        ) : matches.length === 0 ? (
          <p className="text-body text-muted mt-3">لا يوجد مزوّدون مطابقون حالياً.</p>
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
                <ServiceCard provider={p} />
              </div>
            ))}
          </div>
        )}
      </div>

      {isOwner ? (
        <div className="bg-white rounded-2xl card-shadow p-6 mt-6">
          <h2 className="font-bold text-ink mb-4 flex items-center gap-1.5">
            <ChatRound className="h-5 w-5 text-primary" /> العروض المستلمة ({offers.length})
          </h2>
          {offers.length === 0 ? (
            <EmptyState icon={asIcon(Settings)} title="لا توجد عروض بعد" message="سيظهر هنا كل مزوّد يقدّم عرضاً على طلبك" />
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => (
                <div key={offer.id} className="border border-muted-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {offer.provider_avatar ? <img src={offer.provider_avatar} className="w-full h-full object-cover" alt="" /> : <User className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <p className="font-semibold text-body text-ink flex items-center gap-1">
                        {offer.provider_name}
                        {offer.provider_verified && <CheckCircle className="h-3.5 w-3.5 text-primary" />}
                      </p>
                      <p className="text-caption text-muted">{formatRelativeTime(offer.created_at)}</p>
                    </div>
                    {offer.is_accepted && <span className="mr-auto text-caption bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">مقبول</span>}
                  </div>
                  <p className="text-body text-muted-600 mb-2">{offer.message}</p>
                  {offer.price && <p className="text-body font-bold text-gold mb-2">السعر المقترح: {formatPrice(offer.price, offer.currency)}</p>}
                  {offer.offerer_phone && (
                    <a href={`tel:${offer.offerer_phone}`} className="inline-flex items-center gap-1 text-body text-primary font-semibold" dir="ltr">
                      <Phone className="h-3.5 w-3.5" /> {offer.offerer_phone}
                    </a>
                  )}
                  {request.is_active && !offer.is_accepted && (
                    <Button className="mt-3" size="sm" onClick={() => acceptOffer(offer.id)} loading={busy}>قبول العرض</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl card-shadow p-6 mt-6">
          <h2 className="font-bold text-ink mb-4">قدّم عرضك</h2>
          {!user ? (
            <div className="flex items-center justify-between">
              <p className="text-body text-muted-500">سجّل الدخول لتقديم عرض</p>
              <Button size="sm" variant="outline" onClick={() => requireAuth()}>تسجيل الدخول</Button>
            </div>
          ) : !request.is_active ? (
            <p className="text-body text-muted-500">هذا الطلب مغلق ولا يقبل عروضاً جديدة.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-body font-semibold text-muted-700 mb-1.5 block">رسالة العرض <span className="text-red-500">*</span></label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="اكتب ما تعرضه على صاحب الطلب..." className="w-full border border-muted-200 rounded-xl px-4 py-3 text-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-body font-semibold text-muted-700 mb-1.5 block">السعر المقترح (اختياري)</label>
                  <MoneyInput value={price} onChange={setPrice} placeholder="السعر عند التواصل" />
                </div>
                <div>
                  <label className="text-body font-semibold text-muted-700 mb-1.5 block">العملة</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full h-11 border border-muted-200 rounded-xl px-3 text-body bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="YER">ريال يمني</option>
                    <option value="SAR">ريال سعودي</option>
                    <option value="USD">دولار</option>
                  </select>
                </div>
              </div>
              <Button onClick={submitOffer} loading={submitting} fullWidth>
                <Settings className="h-4 w-4" /> إرسال العرض
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
