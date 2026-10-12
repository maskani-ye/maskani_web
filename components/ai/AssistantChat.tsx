"use client";

/**
 * «مساعد مسكني» — واجهة شات: نافذةٌ واحدة بترويسة المساعد، ومنطقة رسائل
 * بخلفيتها، وفقاعات بصورة المرسل ووقته، ومؤلِّفٌ مثبَّت **داخل** النافذة.
 *
 * ⚠️ **أُعيد تصميمها من الصفر (2026-10-12) بطلب المالك:** النسخة الأولى كانت
 * «صفحة» لا محادثة — عنوانٌ كبير، ونتائج بشبكة بطاقاتٍ كاملة العرض تُغرق
 * الرسائل، ومؤلِّفٌ عائم فوق المحتوى بتدرّجٍ يغطّي آخر البطاقات. هنا:
 *   • النتائج **شريطٌ أفقيّ داخل ردّ المساعد** — المحادثة تبقى محادثة،
 *     والبطاقة هي `PropertyCard`/`ServiceCard` نفسها (لا نسخة مصغّرة).
 *   • المؤلِّف جزءٌ من النافذة لا طبقةٌ فوقها، فلا يحجب شيئاً.
 *   • الترحيب رسالةٌ من المساعد نفسه، والأمثلة ردودٌ سريعة تحتها.
 *
 * ⚠️ **المحادثة على الخادم**؛ المتصفّح يحفظ معرّفها فقط. التخزين المحلّي قد
 * يُمنع (نافذة خاصّة) — كل وصولٍ إليه داخل try، وغيابه = محادثة جديدة.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, getErrorMessage, getErrorStatus } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useCountry } from "@/context/CountryContext";
import { DEFAULT_MARKET, isMarket, marketPath } from "@/lib/markets";
import { NUMERIC_LOCALE } from "@/lib/utils";
import { PropertyCard, type PropertyCardData } from "@/components/properties/PropertyCard";
import { ServiceCard, type ServiceCardData } from "@/components/services/ServiceCard";
import { Stars, Plain, AddCircle, AltArrowLeft, User } from "@solar-icons/react";

const STORE_KEY = "mk_assistant_cid";

type Query = Record<string, string | number> | null | undefined;

interface Turn {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  properties?: PropertyCardData[];
  services?: ServiceCardData[];
  property_query?: Query;
  service_query?: Query;
  /** سوق النتائج — قد يخالف سوق الزائر إن سمّى مدينةً في سوقٍ آخر. */
  market?: string;
}

interface AssistantResponse extends Turn {
  conversation_id: string;
  reply: string;
  suggestions: string[];
}

const STARTERS = [
  "شقة للإيجار بغرفتين",
  "أرض للبيع بمساحة 400 متر",
  "أحتاج مقاول تشطيب",
  "فيلا للبيع بميزانية متوسطة",
];

/** خلفية منطقة الرسائل — نقاطٌ خفيفة بلون العلامة كخلفيات تطبيقات المحادثة. */
const WALLPAPER: React.CSSProperties = {
  backgroundColor: "#F4F4FA",
  backgroundImage: "radial-gradient(rgba(23, 21, 57, 0.07) 1px, transparent 1px)",
  backgroundSize: "1.25rem 1.25rem",
};

/** فقاعة المساعد — سطحٌ أبيض بظلٍّ خفيف. */
const BOT_BUBBLE = "rounded-2xl bg-white px-4 py-3 shadow-e1 ring-1 ring-ink/5 text-body text-ink leading-relaxed";

function readId(): string | null {
  try { return localStorage.getItem(STORE_KEY); } catch { return null; }
}
function writeId(id: string | null) {
  try {
    if (id) localStorage.setItem(STORE_KEY, id);
    else localStorage.removeItem(STORE_KEY);
  } catch { /* التخزين ممنوع — المحادثة تبقى ما دامت الصفحة مفتوحة */ }
}

function listHref(market: string, section: "properties" | "services", q: Query): string {
  const params = new URLSearchParams();
  Object.entries(q || {}).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") params.set(k, String(v));
  });
  const qs = params.toString();
  return marketPath(market, section) + (qs ? `?${qs}` : "");
}

const clock = (iso?: string) =>
  new Date(iso || Date.now()).toLocaleTimeString(NUMERIC_LOCALE, { hour: "numeric", minute: "2-digit" });

function BotAvatar() {
  return (
    <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-primary-400 to-primary text-white flex items-center justify-center shadow-e1">
      <Stars className="h-5 w-5 text-gold" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="h-9 w-9 shrink-0 rounded-full bg-white ring-1 ring-ink/10 text-primary flex items-center justify-center">
      <User className="h-5 w-5" />
    </div>
  );
}

function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}
      className="inline-flex items-center gap-1 rounded-full bg-white ring-1 ring-primary/20 px-3 py-1.5 text-caption font-bold text-primary hover:bg-primary-50">
      {children} <AltArrowLeft className="h-3.5 w-3.5" />
    </Link>
  );
}

function Results({ turn, fallbackMarket }: { turn: Turn; fallbackMarket: string }) {
  const market = isMarket(turn.market) ? turn.market! : fallbackMarket;
  const nP = turn.properties?.length ?? 0;
  const nS = turn.services?.length ?? 0;
  if (!nP && !nS) return null;
  return (
    <div className="mt-2 space-y-3">
      {nP > 0 && (
        <div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
            {turn.properties!.map((p) => (
              <div key={p.id} className="w-64 shrink-0 snap-start">
                <PropertyCard property={p} />
              </div>
            ))}
          </div>
          <MoreLink href={listHref(market, "properties", turn.property_query)}>عرض كل النتائج</MoreLink>
        </div>
      )}
      {nS > 0 && (
        <div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
            {turn.services!.map((s) => (
              <div key={s.id} className="w-72 shrink-0 snap-start">
                <ServiceCard provider={s} />
              </div>
            ))}
          </div>
          <MoreLink href={marketPath(market, "services")}>كل مزوّدي الخدمات</MoreLink>
        </div>
      )}
    </div>
  );
}

function QuickReplies({ items, onPick }: { items: string[]; onPick: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s) => (
        <button key={s} type="button" onClick={() => onPick(s)}
          className="rounded-full bg-white ring-1 ring-primary/25 px-3.5 py-1.5 text-caption font-semibold text-primary hover:bg-primary hover:text-white transition-colors">
          {s}
        </button>
      ))}
    </div>
  );
}

export function AssistantChat() {
  const { code: countryCode } = useCountry();
  const market = isMarket((countryCode || "").toLowerCase()) ? countryCode!.toLowerCase() : DEFAULT_MARKET;

  const [turns, setTurns] = useState<Turn[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const id = readId();
    if (!id) { setRestoring(false); return; }
    api.get<{ conversation_id: string; messages: Turn[] }>(ep.aiAssistantHistory(id))
      .then((r) => { setConversationId(r.data.conversation_id); setTurns(r.data.messages || []); })
      .catch(() => writeId(null))
      .finally(() => setRestoring(false));
  }, []);

  // النزول إلى آخر رسالة داخل النافذة (لا تمرير الصفحة كلّها).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns.length, sending, restoring]);

  // حقل الإدخال ينمو مع النصّ حتى ثمانية أسطر ثم يمرّر داخله.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

  const send = useCallback(async (text: string) => {
    const message = text.trim();
    if (message.length < 2 || sending) return;
    setInput("");
    setSuggestions([]);
    setTurns((t) => [...t, { role: "user", content: message, created_at: new Date().toISOString() }]);
    setSending(true);
    try {
      const { data } = await api.post<AssistantResponse>(ep.aiAssistant, {
        message, conversation_id: conversationId, country: countryCode, platform: "web",
      });
      setConversationId(data.conversation_id);
      writeId(data.conversation_id);
      setTurns((t) => [...t, {
        role: "assistant", content: data.reply, created_at: new Date().toISOString(),
        properties: data.properties, services: data.services,
        property_query: data.property_query, service_query: data.service_query,
        market: data.market,
      }]);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      // محادثةٌ حُذفت أو لم تعد تخصّ هذا الزائر — نبدأ جديدة بدل التعلّق بها.
      if (getErrorStatus(err) === 404) { writeId(null); setConversationId(null); }
      const msg = getErrorStatus(err) === 429
        ? "أرسلتَ رسائل كثيرة خلال دقيقة — انتظر قليلاً ثم أعِد المحاولة."
        : getErrorMessage(err);
      setTurns((t) => [...t, { role: "assistant", content: msg, created_at: new Date().toISOString() }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [conversationId, countryCode, sending]);

  const reset = () => {
    writeId(null);
    setConversationId(null);
    setTurns([]);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className="bg-cream lg:px-6 lg:py-4">
      <section
        aria-label="محادثة مساعد مسكني"
        className="mx-auto flex h-[calc(100dvh-4rem)] max-w-4xl flex-col overflow-hidden bg-white lg:h-[calc(100dvh-6rem)] lg:rounded-3xl lg:shadow-e3 lg:ring-1 lg:ring-ink/5"
      >
        {/* ─── الترويسة ─── */}
        <header className="flex items-center gap-3 border-b border-muted-100 bg-white px-4 py-3">
          <div className="relative">
            <BotAvatar />
            <span className="absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-white" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-body-lg font-extrabold leading-tight text-ink">مساعد مسكني</h1>
            <p className="truncate text-caption text-muted" aria-live="polite">
              {sending ? "يبحث لك الآن…" : "يفهم طلبك ويبحث في إعلانات مسكني الحقيقية"}
            </p>
          </div>
          {turns.length > 0 && (
            <button type="button" onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-caption font-bold text-primary hover:bg-primary-50">
              <AddCircle className="h-4 w-4" />
              <span className="hidden sm:inline">محادثة جديدة</span>
            </button>
          )}
        </header>

        {/* ─── الرسائل ─── */}
        <div ref={scrollRef} style={WALLPAPER} className="flex-1 space-y-5 overflow-y-auto px-3 py-5 sm:px-5">
          {restoring ? (
            <div className="space-y-3">
              <div className="h-14 w-2/3 animate-pulse rounded-2xl bg-white/80" />
              <div className="ms-auto h-10 w-1/2 animate-pulse rounded-2xl bg-white/80" />
            </div>
          ) : (
            <>
              {/* الترحيب: رسالةٌ من المساعد لا صفحة تعريف. */}
              <div className="flex items-start gap-2">
                <BotAvatar />
                <div className="max-w-[85%] space-y-3">
                  <div className={`${BOT_BUBBLE} rounded-tl-md`}>
                    أهلاً بك 👋 أنا مساعد مسكني. اكتب ما تبحث عنه بكلامك — نوع العقار والمدينة،
                    بيعاً أم إيجاراً، والميزانية، أو الخدمة التي تحتاجها — وأعرض لك ما يناسبك.
                  </div>
                  {turns.length === 0 && <QuickReplies items={STARTERS} onPick={send} />}
                </div>
              </div>

              {turns.map((t, i) => t.role === "user" ? (
                <div key={i} className="flex flex-row-reverse items-end gap-2">
                  <UserAvatar />
                  <div className="max-w-[80%]">
                    <div className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-body text-white shadow-e1">
                      {t.content}
                    </div>
                    <p className="mt-1 text-left text-micro text-muted">{clock(t.created_at)}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex items-start gap-2">
                  <BotAvatar />
                  <div className="min-w-0 flex-1">
                    <div className={`${BOT_BUBBLE} w-fit max-w-[90%] rounded-tl-md`}>{t.content}</div>
                    <p className="mt-1 text-micro text-muted">{clock(t.created_at)}</p>
                    <Results turn={t} fallbackMarket={market} />
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex items-end gap-2">
                  <BotAvatar />
                  <div className={`${BOT_BUBBLE} flex gap-1.5 rounded-bl-md py-4`} aria-label="يكتب">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-primary-300"
                        style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ─── المؤلِّف (جزءٌ من النافذة لا طبقةٌ فوقها) ─── */}
        <div className="border-t border-muted-100 bg-white px-3 pb-3 pt-2.5 sm:px-4">
          {suggestions.length > 0 && !sending && (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2.5">
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => send(s)}
                  className="shrink-0 rounded-full bg-primary-50 px-3 py-1.5 text-caption font-semibold text-primary hover:bg-primary-100">
                  {s}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              rows={1}
              maxLength={500}
              placeholder="اكتب رسالتك…"
              aria-label="اكتب ما تبحث عنه"
              className="flex-1 resize-none rounded-3xl bg-cream px-4 py-3 text-body text-ink outline-none ring-1 ring-transparent placeholder:text-muted focus:ring-primary-200"
            />
            <button type="submit" disabled={sending || input.trim().length < 2} aria-label="إرسال"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-e2 transition-colors hover:bg-primary-600 disabled:opacity-40 disabled:shadow-none">
              <Plain className="h-5 w-5 -scale-x-100" />
            </button>
          </form>
          <p className="mt-1.5 text-center text-micro text-muted">
            يبحث في إعلانات مسكني — تحقّق من التفاصيل مع المعلن قبل أي اتفاق.
          </p>
        </div>
      </section>
    </div>
  );
}
