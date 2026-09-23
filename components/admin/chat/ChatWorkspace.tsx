"use client";

/**
 * إطار شاشات الدردشة في لوحة الإدارة — قائمةٌ يمينَ لوحةِ محادثة.
 *
 * ⚠️ **الإطار مشترك، ومحتوى الفقاعة ليس كذلك.** «المحادثات» تعرض رسائل نصّية
 * بين طرفين، و«مركز المساعدة» يعرض مغلّفات الفلو (بوت/مستخدم/موظّف) بأزرارها.
 * توحيدُ الفقاعتين قسراً في مكوّنٍ واحد يعني علماً (`kind`) يتشعّب داخله عند
 * كل اختلاف — فالمشترك هنا هو **الهيكل**: الشبكة، البطاقة، الارتفاع، منطقة
 * التمرير، مؤلِّف الردّ. وكلّ شاشة تمرّر صفوفها.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Plain } from "@solar-icons/react";

// ─── الشبكة ──────────────────────────────────────────────────────────────────

export function ChatWorkspace({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5 items-start">
      {children}
    </div>
  );
}

// ─── القائمة ─────────────────────────────────────────────────────────────────

export function ChatListCard({
  loading, isEmpty, emptyIcon, emptyText, skeletonRows = 5, children,
}: {
  loading: boolean;
  isEmpty: boolean;
  emptyIcon: ReactNode;
  emptyText: string;
  skeletonRows?: number;
  children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-e2 overflow-hidden">
      {loading ? (
        <div className="p-4 space-y-2">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <div key={i} className="h-14 bg-muted-50 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="py-16 text-center text-muted">
          <div className="h-10 w-10 mx-auto mb-2 opacity-30 [&>svg]:h-10 [&>svg]:w-10">{emptyIcon}</div>
          <p>{emptyText}</p>
        </div>
      ) : (
        <div className="divide-y divide-muted-50">{children}</div>
      )}
    </div>
  );
}

export function ChatListRow({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-right p-4 hover:bg-muted-50 transition-colors ${active ? "bg-primary/5" : ""}`}
    >
      {children}
    </button>
  );
}

// ─── لوحة المحادثة ───────────────────────────────────────────────────────────

/**
 * ارتفاعٌ ثابت لا `min-h` وحده: الدردشة يجب أن تملأ الشاشة ويبقى مؤلِّف الردّ
 * مرئياً أسفلها بلا تمرير الصفحة كلّها.
 */
export function ChatPanel({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-e2 flex flex-col h-[calc(100vh-230px)] min-h-[520px] lg:sticky lg:top-6">
      {children}
    </div>
  );
}

export function ChatPanelEmpty({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted text-body">
      <div className="mb-3 opacity-20 [&>svg]:h-12 [&>svg]:w-12">{icon}</div>
      {text}
    </div>
  );
}

export function ChatPanelHeader({
  title, meta, actions,
}: { title: ReactNode; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-muted-100 gap-2">
      <div className="min-w-0">
        <span className="font-bold text-ink block truncate">{title}</span>
        {meta && <div className="flex gap-1.5 flex-wrap mt-1">{meta}</div>}
      </div>
      {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
    </div>
  );
}

/**
 * منطقة الرسائل — تنزل تلقائياً إلى الأسفل حين يتغيّر `scrollKey`.
 *
 * ⚠️ المفتاح يجب أن يضمّ **عدد الرسائل ومعرّف المحادثة** معاً: بلا الأوّل لا
 * تنزل الشاشة بعد إرسال ردّ، وبلا الثاني تبقى في مكانها عند فتح محادثة أخرى
 * بالعدد نفسه.
 */
export function ChatScroll({
  scrollKey, children,
}: { scrollKey: string | number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [scrollKey]);
  return (
    <div ref={ref} className="flex-1 overflow-y-auto p-4 space-y-3 bg-cream">
      {children}
    </div>
  );
}

export function ChatScrollSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-muted-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

export function ChatScrollEmpty({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="py-16 text-center text-muted">
      <div className="h-10 w-10 mx-auto mb-2 opacity-30 [&>svg]:h-10 [&>svg]:w-10">{icon}</div>
      <p className="text-body">{text}</p>
    </div>
  );
}

// ─── مؤلِّف الردّ ──────────────────────────────────────────────────────────────

export function ChatComposer({
  value, onChange, onSend, sending, placeholder, hint,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  placeholder: string;
  hint?: string;
}) {
  return (
    <div className="p-3 border-t border-muted-100">
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          // Enter يُرسل وShift+Enter سطرٌ جديد — سلوك كل تطبيقات المحادثة.
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
          }}
          rows={1}
          placeholder={placeholder}
          className="flex-1 border border-muted-200 rounded-xl px-3 py-2 text-body resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Button size="icon" loading={sending} onClick={onSend} disabled={!value.trim()}>
          <Plain className="h-5 w-5" />
        </Button>
      </div>
      {hint && <p className="text-micro text-muted mt-1.5">{hint}</p>}
    </div>
  );
}
