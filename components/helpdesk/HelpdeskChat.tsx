"use client";

// عناصر عرض محادثة مركز المساعدة — مصدر تصميم **واحد** يُستعمل في شات المستخدم
// (/help) ولوحة الإدارة (/admin/helpdesk)، فيبقى التصميم متطابقًا 100% مع
// تطبيق الجوال (بنية عبر): فقاعات بوت/مستخدم/موظّف + صفوف خيارات بأيقونة+chevron
// + بطاقات قائمة + تأكيد + نتيجة ملوّنة. `readOnly` يعطّل التفاعل (عرض الإدارة).
import { useMemo } from "react";
import { AltArrowLeft, QuestionCircle, CheckCircle, DangerTriangle, DangerCircle, HeadphonesRound } from "@solar-icons/react";

export interface HdBtn { id: string; label: string; style: string; icon: string; has_action: boolean; is_item_action: boolean }
export interface HdCard { id: string; label: string; subtitle?: string; image?: string | null; buttons?: HdBtn[]; [k: string]: unknown }
export interface Envelope {
  type: string; node_key?: string; title?: string; body?: string; seq?: number;
  buttons?: HdBtn[]; cards?: HdCard[]; note?: string; ok?: boolean; button_id?: string; item_id?: string;
}
export interface HdMessage { id: number; sender: string; payload: Envelope }

type Handlers = {
  onButton?: (b: HdBtn, itemId?: string) => void;
  onConfirm?: (yes: boolean) => void;
  busy?: boolean;
  isLatest: boolean;
  readOnly?: boolean;
};

/* ── صفّ رسالة: المستخدم يمين (start)، البوت/الموظّف يسار (end) ── */
export function HelpdeskMessageRow({ m, ...h }: { m: HdMessage } & Handlers) {
  const e = m.payload;
  const isUser = m.sender === "user" || e.type === "user_text";
  const isAgent = m.sender === "agent";

  if (isUser) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[82%] bg-gradient-to-b from-primary to-[#255c44] text-white rounded-2xl rounded-tr-md px-3.5 py-2 text-sm leading-relaxed shadow-sm">
          {e.body}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[88%] w-fit">
        {isAgent && (
          <div className="flex items-center gap-1.5 mb-1 pr-1 justify-end">
            <span className="text-xs font-semibold text-primary">فريق الدعم</span>
            <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
              <HeadphonesRound className="h-3 w-3 text-primary" />
            </div>
          </div>
        )}
        <BotEnvelope e={e} isAgent={isAgent} {...h} />
      </div>
    </div>
  );
}

function Bubble({ children, tone = "bot" }: { children: React.ReactNode; tone?: "bot" | "success" | "error" | "confirm" }) {
  const cls = {
    bot: "bg-white border-gray-100",
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    confirm: "bg-white border-primary/60",
  }[tone];
  return <div className={`rounded-2xl rounded-tl-md border px-3.5 py-2.5 text-sm shadow-sm ${cls}`}>{children}</div>;
}

function BotEnvelope({ e, onButton, onConfirm, busy, isAgent, isLatest, readOnly }: { e: Envelope; isAgent: boolean } & Handlers) {
  const question = [e.title, e.body].filter(Boolean).join("\n");
  // الأزرار تبقى ظاهرة دائمًا، لكنها **معطّلة** (لا تختفي) متى لم تكن آخر رسالة
  // أو في وضع العرض (الإدارة) أو أثناء الإرسال — فلا يُعاد التفاعل مع خطوة ماضية.
  const disabled = !isLatest || !!readOnly || !!busy;
  const navButtons = (e.buttons ?? []).filter((b) => !b.is_item_action);

  if (e.type === "action_result") {
    return (
      <Bubble tone={e.ok ? "success" : "error"}>
        <div className="flex items-start gap-2.5">
          {e.ok ? <CheckCircle weight="Bold" className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            : <DangerTriangle weight="Bold" className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
          <p className={`font-semibold leading-relaxed ${e.ok ? "text-green-800" : "text-red-700"}`}>{e.body}</p>
        </div>
      </Bubble>
    );
  }

  if (e.type === "confirm") {
    return (
      <Bubble tone="confirm">
        <div className="flex items-start gap-2">
          <DangerCircle weight="Bold" className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="font-bold text-gray-900 leading-relaxed">{e.body}</p>
        </div>
        <p className="text-center text-gray-600 mt-2.5">هل تريد المتابعة؟</p>
        <div className="flex gap-2 mt-2.5">
          <button disabled={disabled} onClick={() => onConfirm?.(true)}
            className="flex-1 py-2 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90">نعم، تابع</button>
          <button disabled={disabled} onClick={() => onConfirm?.(false)}
            className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">لا</button>
        </div>
      </Bubble>
    );
  }

  if (e.type === "handoff") {
    return <div className="mx-auto text-center bg-gold/10 text-[#8a6d10] rounded-full px-4 py-1.5 text-xs font-medium">{e.body || "جارٍ تحويلك لموظّف الدعم…"}</div>;
  }
  if (e.type === "end") {
    return <Bubble><p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{e.body}</p></Bubble>;
  }

  if (e.type === "list") {
    const cards = e.cards ?? [];
    return (
      <Bubble>
        {question && <p className="font-bold text-gray-900 whitespace-pre-wrap mb-2">{question}</p>}
        {e.note && <p className="text-xs text-gray-400 mb-2">{e.note}</p>}
        {cards.length === 0 ? <p className="text-sm text-gray-400 py-1">لا توجد عناصر متاحة حاليًا</p> : (
          <div className="space-y-2">
            {cards.map((c) => <ListItemRow key={c.id} c={c} onButton={onButton} disabled={disabled} />)}
          </div>
        )}
        {navButtons.length > 0 && <ChoiceRows buttons={navButtons} onButton={onButton} disabled={disabled} className="mt-2" />}
      </Bubble>
    );
  }

  return (
    <Bubble>
      {question && (
        <p className={`whitespace-pre-wrap leading-relaxed ${navButtons.length > 0 ? "font-bold text-gray-900" : "text-gray-800"} ${isAgent ? "font-normal" : ""}`}>{question}</p>
      )}
      {navButtons.length > 0 && <ChoiceRows buttons={navButtons} onButton={onButton} disabled={disabled} className="mt-2" />}
    </Bubble>
  );
}

function ChoiceRows({ buttons, onButton, disabled, className = "" }: { buttons: HdBtn[]; onButton?: (b: HdBtn, itemId?: string) => void; disabled?: boolean; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {buttons.map((b) => (
        <button key={b.id} disabled={disabled} onClick={() => onButton?.(b)}
          className="w-full flex items-center gap-2.5 bg-primary/[0.07] hover:bg-primary/[0.12] rounded-xl px-3 py-2.5 text-right transition-colors disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-primary/[0.07]">
          <QuestionCircle className="h-[18px] w-[18px] text-primary shrink-0" />
          <span className="flex-1 text-sm text-gray-800 font-medium">{b.label}</span>
          <AltArrowLeft className="h-4 w-4 text-gray-300 shrink-0" />
        </button>
      ))}
    </div>
  );
}

function ListItemRow({ c, onButton, disabled }: { c: HdCard; onButton?: (b: HdBtn, itemId?: string) => void; disabled?: boolean }) {
  const buttons = c.buttons ?? [];
  const subtitle = useMemo(() => {
    if (c.subtitle) return String(c.subtitle);
    const vals = Object.entries(c).filter(([k]) => !["id", "label", "buttons", "image", "subtitle"].includes(k))
      .map(([, v]) => v).filter((v) => typeof v === "string" || typeof v === "number");
    return vals.slice(0, 2).join(" · ");
  }, [c]);

  // زرّ إجراء واحد على البطاقة (مثل «خيارات هذا العقار») → البطاقة كلها قابلة
  // للنقر. أكثر من زرّ → تُعرض كرقائق (chips). بلا أزرار → عرض فقط.
  const single = buttons.length === 1 ? buttons[0] : null;

  const inner = (
    <div className="flex items-center gap-3 p-2.5 w-full text-right">
      {c.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={String(c.image)} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
      ) : null}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-800 truncate">{c.label}</p>
        {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
      </div>
      {single && <AltArrowLeft className="h-4 w-4 text-gray-300 shrink-0" />}
    </div>
  );

  if (single) {
    return (
      <button disabled={disabled} onClick={() => onButton?.(single, c.id)}
        className="w-full rounded-xl border border-gray-100 bg-white overflow-hidden hover:border-primary/40 hover:bg-primary/[0.03] transition-colors disabled:opacity-45 disabled:cursor-not-allowed">
        {inner}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      {inner}
      {buttons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-2.5 pb-2.5">
          {buttons.map((b) => (
            <button key={b.id} disabled={disabled} onClick={() => onButton?.(b, c.id)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/[0.08] text-primary hover:bg-primary/15 disabled:opacity-45 disabled:cursor-not-allowed">{b.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TypingDots() {
  return (
    <div className="flex justify-end">
      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-sm">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
        </div>
      </div>
    </div>
  );
}
