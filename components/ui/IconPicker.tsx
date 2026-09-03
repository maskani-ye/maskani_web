"use client";

// ─── مُنتقي الأيقونات ────────────────────────────────────────────────────────
// يعرض زراً بالأيقونة الحالية + اسمها، وعند الضغط يفتح نافذة شبكية لكل
// مفاتيح ICON_KEYS مع بحث. اختيار خلية يستدعي onChange ويغلق النافذة.

import { useState, useMemo, useEffect } from "react";
import { CloseCircle, Magnifer } from "@solar-icons/react";
import { ServiceIcon, ICON_KEYS } from "@/lib/serviceIcons";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value: string;
  onChange: (key: string) => void;
  label?: string;
}

export function IconPicker({ value, onChange, label = "الأيقونة" }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ICON_KEYS;
    return ICON_KEYS.filter((k) => k.toLowerCase().includes(q));
  }, [query]);

  // إغلاق بمفتاح Escape + منع تمرير الخلفية أثناء فتح النافذة
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const select = (key: string) => {
    onChange(key);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <span className="text-body font-semibold text-muted-700">{label}</span>}

      {/* الزر الظاهر */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-3 h-11 px-3 border rounded-xl bg-white text-right",
          "transition-all duration-200 hover:border-primary/60",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary border-muted-200"
        )}
      >
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0">
          <ServiceIcon icon={value} className="h-4 w-4" />
        </span>
        <span className="flex-1 text-body font-mono text-muted-700 truncate">
          {value?.trim() ? value : <span className="text-muted font-sans">اختر أيقونة…</span>}
        </span>
        <span className="text-caption text-primary font-medium shrink-0">تغيير</span>
      </button>

      {/* النافذة */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-cream rounded-2xl card-shadow w-full max-w-lg p-5 relative max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* الرأس */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-ink text-h3">اختر أيقونة</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted hover:text-muted-600"
              >
                <CloseCircle className="h-5 w-5" />
              </button>
            </div>

            {/* البحث */}
            <div className="relative flex items-center mb-4">
              <span className="absolute right-3 text-muted pointer-events-none">
                <Magnifer className="h-4 w-4" />
              </span>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن أيقونة… (buildings، home، key)"
                className={cn(
                  "w-full h-11 border border-muted-200 rounded-xl bg-white text-ink placeholder-muted",
                  "pr-10 pl-4 text-body transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                )}
              />
            </div>

            {/* الشبكة */}
            <div className="overflow-y-auto -mx-1 px-1">
              {filtered.length === 0 ? (
                <p className="text-center text-muted text-body py-10">لا توجد أيقونة مطابقة</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {filtered.map((key) => {
                    const active = key === value;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => select(key)}
                        title={key}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all duration-150",
                          active
                            ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                            : "border-muted-200 bg-white text-muted-600 hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        <ServiceIcon icon={key} className="h-6 w-6" />
                        <span className="text-micro font-mono truncate max-w-full leading-tight">{key}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
