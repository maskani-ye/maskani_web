"use client";

/**
 * محادثات «مساعد مسكني» (الإدارة) — ماذا يطلب الناس بكلامهم، وماذا فهم
 * المساعد، وما الذي عُرض لهم.
 *
 * ⚠️ **أهمّ ما في الصفحة فلتر «بلا نتيجة»:** محادثةٌ انتهت آخر رسائلها بلا
 * عقارٍ ولا خدمة هي طلبٌ حقيقيٌّ لا يغطّيه المخزون — أي فجوةٌ في السوق تعرف
 * منها الإدارة أين تستقطب معلنين. ولذلك الفلتر زرٌّ ظاهر لا خيارٌ مدفون.
 *
 * للقراءة فقط: الإدارة لا تكتب في محادثة المساعد (الردّ آليّ بطبيعته).
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { formatPrice, formatRelativeTime, NUMERIC_LOCALE } from "@/lib/utils";
import type { PaginatedResponse } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ChatWorkspace, ChatListCard, ChatListRow, ChatPanel, ChatPanelEmpty,
  ChatPanelHeader, ChatScroll, ChatScrollSkeleton,
} from "@/components/admin/chat/ChatWorkspace";
import { toast } from "sonner";
import { Stars, Magnifer, AltArrowLeft, AltArrowRight, User } from "@solar-icons/react";

const LIMIT = 20;

interface ConvRow {
  id: string;
  user: number | null;
  user_name: string | null;
  country_code: string;
  platform: string;
  message_count: number;
  last_empty: boolean;
  first_message: string;
  created_at: string;
  updated_at: string;
}
interface Msg {
  id: number;
  role: "user" | "assistant";
  content: string;
  results_count: number;
  created_at: string;
  meta: {
    intent?: string;
    ai_ok?: boolean;
    property_filters?: Record<string, unknown>;
    service_filters?: Record<string, unknown>;
    property_relaxed?: string[];
    service_relaxed?: string[];
    property_ids?: number[];
    service_ids?: number[];
  };
}
interface ConvDetail extends ConvRow {
  messages: Msg[];
  shown: {
    properties: Record<string, { id: number; title: string; price: string; currency: string; city__name_ar: string }>;
    services: Record<string, { id: number; title: string; category__name_ar: string }>;
  };
}
interface Stats { total: number; week: number; empty: number; registered: number; user_messages: number }

const INTENTS: Record<string, string> = {
  properties: "عقارات", services: "خدمات", both: "عقارات وخدمات", other: "حديث عامّ",
};
const FILTER_LABELS: Record<string, string> = {
  city: "مدينة", property_type: "نوع", offer_type: "العرض", rooms_min: "غرف≥",
  price_min: "سعر≥", price_max: "سعر≤", price_currency: "العملة", area_min: "مساحة≥",
  area_max: "مساحة≤", area_text: "الحيّ", search: "كلمات", category: "تصنيف",
};
const OFFER: Record<string, string> = { sale: "بيع", rent_monthly: "إيجار شهري", rent_yearly: "إيجار سنوي", rent_daily: "إيجار يومي" };

function FilterChips({ filters }: { filters?: Record<string, unknown> }) {
  const entries = Object.entries(filters || {}).filter(([k]) => k !== "country");
  if (!entries.length) return <span className="text-caption text-muted">بلا فلاتر</span>;
  return (
    <>
      {entries.map(([k, v]) => (
        <span key={k} className="text-caption bg-muted-100 text-muted-600 rounded-full px-2 py-0.5">
          {FILTER_LABELS[k] || k.replace("has_", "")}: {k === "offer_type" ? OFFER[String(v)] || String(v) : String(v)}
        </span>
      ))}
    </>
  );
}

export default function AdminAssistantPage() {
  const [rows, setRows] = useState<ConvRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [emptyOnly, setEmptyOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [active, setActive] = useState<ConvDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { offset, limit: LIMIT };
      if (emptyOnly) params.empty = 1;
      if (query) params.search = query;
      const { data } = await api.get<PaginatedResponse<ConvRow>>(ep.admin.assistantConversations, { params });
      setRows(data.results);
      setTotal(data.count);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [offset, emptyOnly, query]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get<Stats>(ep.admin.assistantStats).then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const open = async (id: string) => {
    setLoadingDetail(true);
    try {
      const { data } = await api.get<ConvDetail>(ep.admin.assistantConversation(id));
      setActive(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingDetail(false);
    }
  };

  const n = (v?: number) => (v ?? 0).toLocaleString(NUMERIC_LOCALE);
  const pct = stats && stats.total ? Math.round((stats.empty / stats.total) * 100) : 0;

  return (
    <div className="space-y-5">
      <PageHeader icon={<Stars />} title="مساعد مسكني"
        subtitle="ما يطلبه الزوّار بكلامهم، وما فهمه المساعد، وما عرضه لهم" />

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ["محادثة", n(stats.total), `${n(stats.week)} هذا الأسبوع`],
            ["رسالة من الزوّار", n(stats.user_messages), "كل ما كُتب للمساعد"],
            ["من مستخدمين مسجّلين", n(stats.registered), "والباقي زوّار"],
            ["انتهت بلا نتيجة", n(stats.empty), `${pct.toLocaleString(NUMERIC_LOCALE)}٪ — فجوات المخزون`],
          ].map(([label, value, hint]) => (
            <div key={label} className="bg-white rounded-2xl shadow-e2 p-4">
              <p className="text-h3 font-extrabold text-primary">{value}</p>
              <p className="font-bold text-ink text-body">{label}</p>
              <p className="text-caption text-muted">{hint}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <Button variant={emptyOnly ? "outline" : "primary"} size="sm"
          onClick={() => { setEmptyOnly(false); setOffset(0); }}>كل المحادثات</Button>
        <Button variant={emptyOnly ? "primary" : "outline"} size="sm"
          onClick={() => { setEmptyOnly(true); setOffset(0); }}>بلا نتيجة فقط</Button>
        <form className="flex gap-2 flex-1 min-w-[220px]"
          onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); setOffset(0); }}>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث في نصّ الرسائل…" />
          <Button type="submit" variant="outline" size="icon" aria-label="بحث"><Magnifer className="h-4 w-4" /></Button>
        </form>
      </div>

      <ChatWorkspace>
        <div className="space-y-3">
          <ChatListCard loading={loading} isEmpty={!rows.length} emptyIcon={<Stars />}
            emptyText={emptyOnly ? "لا محادثات انتهت بلا نتيجة" : "لا محادثات بعد"}>
            {rows.map((c) => (
              <ChatListRow key={c.id} active={active?.id === c.id} onClick={() => open(c.id)}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink text-body line-clamp-2">{c.first_message || "—"}</p>
                  <span className="text-caption text-muted shrink-0">{formatRelativeTime(c.updated_at)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                  <Badge variant="gray">{c.country_code || "—"}</Badge>
                  {c.platform && <Badge variant="info">{c.platform === "app" ? "التطبيق" : "الويب"}</Badge>}
                  <span className="text-caption text-muted">{n(c.message_count)} رسالة · {c.user_name || "زائر"}</span>
                  {c.last_empty && <Badge variant="danger">بلا نتيجة</Badge>}
                </div>
              </ChatListRow>
            ))}
          </ChatListCard>
          {total > LIMIT && (
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - LIMIT))}><AltArrowRight className="h-4 w-4" /> السابق</Button>
              <span className="text-caption text-muted">{n(offset + 1)}–{n(Math.min(offset + LIMIT, total))} من {n(total)}</span>
              <Button variant="ghost" size="sm" disabled={offset + LIMIT >= total}
                onClick={() => setOffset(offset + LIMIT)}>التالي <AltArrowLeft className="h-4 w-4" /></Button>
            </div>
          )}
        </div>

        <ChatPanel>
          {!active && !loadingDetail ? (
            <ChatPanelEmpty icon={<Stars />} text="اختر محادثة لعرضها" />
          ) : (
            <>
              {active && (
                <ChatPanelHeader
                  title={<span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" />{active.user_name || "زائر"}</span>}
                  meta={<>
                    <Badge variant="gray">{active.country_code}</Badge>
                    <Badge variant="info">{active.platform === "app" ? "التطبيق" : "الويب"}</Badge>
                    <span className="text-caption text-muted">بدأت {formatRelativeTime(active.created_at)}</span>
                  </>}
                />
              )}
              <ChatScroll scrollKey={`${active?.id}-${active?.messages.length}`}>
                {loadingDetail || !active ? <ChatScrollSkeleton /> : active.messages.map((m) => m.role === "user" ? (
                  <div key={m.id} className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl bg-primary text-white px-3.5 py-2 text-body whitespace-pre-wrap">{m.content}</div>
                  </div>
                ) : (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[92%] rounded-2xl bg-white border border-muted-100 px-3.5 py-2.5 space-y-2">
                      <p className="text-body text-ink">{m.content}</p>
                      <div className="flex flex-wrap gap-1 items-center">
                        <Badge variant={m.results_count ? "success" : "danger"}>{n(m.results_count)} نتيجة</Badge>
                        {m.meta.intent && <Badge variant="gray">{INTENTS[m.meta.intent] || m.meta.intent}</Badge>}
                        {m.meta.ai_ok === false && <Badge variant="warning">النموذج متعطّل — بحث نصّي</Badge>}
                      </div>
                      {m.meta.property_filters && (
                        <div className="flex flex-wrap gap-1"><FilterChips filters={m.meta.property_filters} /></div>
                      )}
                      {m.meta.service_filters && (
                        <div className="flex flex-wrap gap-1"><FilterChips filters={m.meta.service_filters} /></div>
                      )}
                      {[...(m.meta.property_relaxed || []), ...(m.meta.service_relaxed || [])].length > 0 && (
                        <p className="text-caption text-warning-700">
                          أُرخي: {[...(m.meta.property_relaxed || []), ...(m.meta.service_relaxed || [])].join("، ")}
                        </p>
                      )}
                      {(m.meta.property_ids || []).length > 0 && (
                        <ul className="text-caption space-y-0.5 border-t border-muted-100 pt-1.5">
                          {m.meta.property_ids!.map((id) => {
                            const p = active.shown.properties[String(id)];
                            return (
                              <li key={id}>
                                <Link href={`/properties/${id}`} target="_blank" className="text-primary hover:underline">
                                  {p ? p.title : `عقار #${id} (حُذف)`}
                                </Link>
                                {p && <span className="text-muted"> · {p.city__name_ar} · {formatPrice(p.price, p.currency)}</span>}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {(m.meta.service_ids || []).length > 0 && (
                        <ul className="text-caption space-y-0.5 border-t border-muted-100 pt-1.5">
                          {m.meta.service_ids!.map((id) => {
                            const s = active.shown.services[String(id)];
                            return (
                              <li key={id}>
                                <Link href={`/services/${id}`} target="_blank" className="text-primary hover:underline">
                                  {s ? s.title : `خدمة #${id}`}
                                </Link>
                                {s && <span className="text-muted"> · {s.category__name_ar}</span>}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </ChatScroll>
            </>
          )}
        </ChatPanel>
      </ChatWorkspace>
    </div>
  );
}
