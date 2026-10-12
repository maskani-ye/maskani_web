"use client";

/**
 * «مساعد مسكني» — واجهةٌ واحدة يكتب فيها الباحث ما يريد بكلامه، فيفهمه
 * المساعد ويعرض بطاقات العقارات والخدمات الحقيقية تحت ردّه.
 *
 * ⚠️ **البطاقات هي البطاقات نفسها** (`PropertyCard` · `ServiceCard`) لا نسخةً
 * مصغّرة للمحادثة: ما يراه هنا هو ما سيراه في القائمة، ونقرةٌ تفتح الصفحة نفسها.
 *
 * ⚠️ **المحادثة على الخادم**؛ المتصفّح يحفظ معرّفها فقط ليستعيدها بعد التحديث.
 * التخزين المحلّي قد يُمنع (نافذة خاصّة) — فكل قراءةٍ وكتابةٍ محاطة بـtry،
 * وغيابه يعني محادثةً جديدة لا عطلاً.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { api, getErrorMessage, getErrorStatus } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useCountry } from "@/context/CountryContext";
import { DEFAULT_MARKET, isMarket, marketPath } from "@/lib/markets";
import { PropertyCard, type PropertyCardData } from "@/components/properties/PropertyCard";
import { ServiceCard, type ServiceCardData } from "@/components/services/ServiceCard";
import Link from "next/link";
import { Stars, Plain, Refresh, AltArrowLeft } from "@solar-icons/react";

const STORE_KEY = "mk_assistant_cid";

type Query = Record<string, string | number> | null | undefined;

interface Turn {
  role: "user" | "assistant";
  content: string;
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
  "شقة للإيجار بغرفتين قريبة من وسط المدينة",
  "أرض للبيع بمساحة 400 متر",
  "أحتاج مقاول تشطيب",
  "فيلا للبيع بميزانية متوسطة",
];

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

export function AssistantChat() {
  const { code: countryCode } = useCountry();
  const market = isMarket((countryCode || "").toLowerCase()) ? countryCode!.toLowerCase() : DEFAULT_MARKET;

  const [turns, setTurns] = useState<Turn[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // استعادة المحادثة السابقة بعد التحديث.
  useEffect(() => {
    const id = readId();
    if (!id) { setRestoring(false); return; }
    api.get<{ conversation_id: string; messages: Turn[] }>(ep.aiAssistantHistory(id))
      .then((r) => { setConversationId(r.data.conversation_id); setTurns(r.data.messages || []); })
      .catch(() => writeId(null))
      .finally(() => setRestoring(false));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, sending]);

  const send = useCallback(async (text: string) => {
    const message = text.trim();
    if (message.length < 2 || sending) return;
    setInput("");
    setSuggestions([]);
    setTurns((t) => [...t, { role: "user", content: message }]);
    setSending(true);
    try {
      const { data } = await api.post<AssistantResponse>(ep.aiAssistant, {
        message, conversation_id: conversationId, country: countryCode, platform: "web",
      });
      setConversationId(data.conversation_id);
      writeId(data.conversation_id);
      setTurns((t) => [...t, {
        role: "assistant", content: data.reply,
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
      setTurns((t) => [...t, { role: "assistant", content: msg }]);
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

  const empty = !restoring && turns.length === 0;

  return (
    <div className="max-w-shell mx-auto px-4 sm:px-6 pt-6 pb-40 lg:pb-32">
      <header className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-h2 font-extrabold text-ink flex items-center gap-2">
            <Stars className="h-7 w-7 text-primary" /> مساعد مسكني
          </h1>
          <p className="text-body text-muted mt-1 max-w-2xl">
            اكتب ما تبحث عنه بكلامك — نوع العقار والمدينة والميزانية، أو الخدمة التي تحتاجها —
            وأعرض لك ما يناسبك من الإعلانات الحقيقية على المنصّة.
          </p>
        </div>
        {turns.length > 0 && (
          <button onClick={reset}
            className="shrink-0 inline-flex items-center gap-1.5 text-body font-semibold text-primary hover:bg-primary/5 rounded-xl px-3 py-2">
            <Refresh className="h-4 w-4" /> محادثة جديدة
          </button>
        )}
      </header>

      {restoring && <div className="h-24 rounded-2xl bg-muted-50 animate-pulse" />}

      {empty && (
        <div className="rounded-3xl bg-white shadow-e2 p-6">
          <p className="font-bold text-ink mb-3">جرّب أن تكتب:</p>
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button key={s} onClick={() => send(s)}
                className="text-body rounded-full border border-muted-100 bg-cream px-4 py-2 hover:border-primary hover:text-primary transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-5">
        {turns.map((t, i) => t.role === "user" ? (
          <div key={i} className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary text-white px-4 py-2.5 text-body whitespace-pre-wrap">
              {t.content}
            </div>
          </div>
        ) : (
          <div key={i} className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-[90%] rounded-2xl rounded-tl-md bg-white shadow-e1 border border-muted-100 px-4 py-3 text-body text-ink leading-relaxed">
                {t.content}
              </div>
            </div>
            {!!t.properties?.length && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {t.properties.map((p) => <PropertyCard key={p.id} property={p} />)}
                </div>
                <Link href={listHref(isMarket(t.market) ? t.market! : market, "properties", t.property_query)}
                  className="mt-3 inline-flex items-center gap-1 text-body font-semibold text-primary hover:underline">
                  عرض كل النتائج في قائمة العقارات <AltArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            )}
            {!!t.services?.length && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {t.services.map((s) => <ServiceCard key={s.id} provider={s} />)}
                </div>
                <Link href={marketPath(isMarket(t.market) ? t.market! : market, "services")}
                  className="mt-3 inline-flex items-center gap-1 text-body font-semibold text-primary hover:underline">
                  كل مزوّدي الخدمات <AltArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="flex justify-end">
            <div className="rounded-2xl bg-white shadow-e1 border border-muted-100 px-4 py-3 text-body text-muted inline-flex items-center gap-2">
              <Refresh className="h-4 w-4 animate-spin" /> أبحث لك…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* المؤلِّف ثابتٌ أسفل الشاشة — فوق الشريط السفلي في الجوّال. */}
      <div className="fixed inset-x-0 bottom-16 lg:bottom-0 z-40 bg-gradient-to-t from-cream via-cream/95 to-transparent pt-6 pb-3">
        <div className="max-w-shell mx-auto px-4 sm:px-6">
          {suggestions.length > 0 && !sending && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="shrink-0 text-caption font-semibold rounded-full bg-white border border-primary/30 text-primary px-3 py-1.5 hover:bg-primary/5">
                  {s}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-end gap-2 rounded-2xl bg-white shadow-e3 border border-muted-100 p-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              rows={1}
              maxLength={500}
              placeholder="اكتب ما تبحث عنه…"
              aria-label="اكتب ما تبحث عنه"
              className="flex-1 resize-none bg-transparent px-3 py-2.5 text-body text-ink placeholder:text-muted outline-none max-h-32"
            />
            <button type="submit" disabled={sending || input.trim().length < 2}
              aria-label="إرسال"
              className="h-11 w-11 shrink-0 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary/90">
              <Plain className="h-5 w-5 -scale-x-100" />
            </button>
          </form>
          <p className="text-caption text-muted mt-1.5 text-center">
            المساعد يفهم طلبك ويبحث في إعلانات مسكني — تحقّق من التفاصيل مع المعلن قبل أي اتفاق.
          </p>
        </div>
      </div>
    </div>
  );
}
