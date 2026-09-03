"use client";

import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { AltArrowDown, Magnifer } from "@solar-icons/react";
import { toEnglishDigits } from "@/lib/digits";

// ─── نموذج الدولة (منقول من تطبيق Flutter) ──────────────────────────────────
export interface CountryCode {
  name: string;
  nameAr: string;
  code: string; // dial code, e.g. "+967"
  flag: string;
  maxLength: number;
}

// ─── قائمة الدول المدعومة — اليمن هو الافتراضي ───────────────────────────────
export const COUNTRIES: CountryCode[] = [
  { name: "Yemen", nameAr: "اليمن", code: "+967", flag: "🇾🇪", maxLength: 9 },
  { name: "Saudi Arabia", nameAr: "السعودية", code: "+966", flag: "🇸🇦", maxLength: 9 },
  { name: "United Arab Emirates", nameAr: "الإمارات", code: "+971", flag: "🇦🇪", maxLength: 9 },
  { name: "Kuwait", nameAr: "الكويت", code: "+965", flag: "🇰🇼", maxLength: 8 },
  { name: "Qatar", nameAr: "قطر", code: "+974", flag: "🇶🇦", maxLength: 8 },
  { name: "Bahrain", nameAr: "البحرين", code: "+973", flag: "🇧🇭", maxLength: 8 },
  { name: "Oman", nameAr: "عُمان", code: "+968", flag: "🇴🇲", maxLength: 8 },
  { name: "Jordan", nameAr: "الأردن", code: "+962", flag: "🇯🇴", maxLength: 9 },
  { name: "Egypt", nameAr: "مصر", code: "+20", flag: "🇪🇬", maxLength: 10 },
  { name: "Iraq", nameAr: "العراق", code: "+964", flag: "🇮🇶", maxLength: 10 },
  { name: "Lebanon", nameAr: "لبنان", code: "+961", flag: "🇱🇧", maxLength: 8 },
  { name: "Syria", nameAr: "سوريا", code: "+963", flag: "🇸🇾", maxLength: 9 },
  { name: "Libya", nameAr: "ليبيا", code: "+218", flag: "🇱🇾", maxLength: 9 },
  { name: "Tunisia", nameAr: "تونس", code: "+216", flag: "🇹🇳", maxLength: 8 },
  { name: "Algeria", nameAr: "الجزائر", code: "+213", flag: "🇩🇿", maxLength: 9 },
  { name: "Morocco", nameAr: "المغرب", code: "+212", flag: "🇲🇦", maxLength: 9 },
  { name: "Sudan", nameAr: "السودان", code: "+249", flag: "🇸🇩", maxLength: 9 },
  { name: "Palestine", nameAr: "فلسطين", code: "+970", flag: "🇵🇸", maxLength: 9 },
];

export const DEFAULT_COUNTRY: CountryCode =
  COUNTRIES.find((c) => c.code === "+967") ?? COUNTRIES[0];

const onlyDigits = (s: string) => s.replace(/\D/g, "");

// يفكّك الرقم الكامل (+9677XXXX) إلى دولة + رقم محلي بمطابقة أطول كود اتصال
function parsePhone(value: string): { country: CountryCode; local: string } {
  if (value && value.startsWith("+")) {
    const sorted = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
    for (const c of sorted) {
      if (value.startsWith(c.code)) {
        return { country: c, local: onlyDigits(value.slice(c.code.length)) };
      }
    }
  }
  return { country: DEFAULT_COUNTRY, local: onlyDigits(value ?? "") };
}

interface PhoneFieldProps {
  label?: string;
  value?: string; // الرقم الكامل بصيغة دولية: +9677XXXXXXXX
  onChange: (fullPhone: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

// حقل هاتف مع قائمة أكواد الدول — يُخرج الرقم الكامل عبر onChange بصيغة +9677XXXXXXXX
export function PhoneField({
  label = "رقم الهاتف",
  value,
  onChange,
  error,
  hint,
  required,
  disabled,
  placeholder = "7XXXXXXXX",
  autoFocus,
}: PhoneFieldProps) {
  const initial = useMemo(() => parsePhone(value ?? ""), []); // seed مرة واحدة
  const [country, setCountry] = useState<CountryCode>(initial.country);
  const [local, setLocal] = useState<string>(initial.local);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const wrapRef = useRef<HTMLDivElement>(null);

  // مزامنة مع value الخارجي إن اختلف عن الحالة الداخلية
  useEffect(() => {
    const full = country.code + local;
    if ((value ?? "") !== full && value !== undefined) {
      const p = parsePhone(value);
      setCountry(p.country);
      setLocal(p.local);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const emit = (c: CountryCode, l: string) => onChange(c.code + l);

  const handleLocalChange = (raw: string) => {
    const digits = onlyDigits(raw).slice(0, country.maxLength);
    setLocal(digits);
    emit(country, digits);
  };

  const pickCountry = (c: CountryCode) => {
    const trimmed = local.slice(0, c.maxLength);
    setCountry(c);
    setLocal(trimmed);
    setOpen(false);
    setQuery("");
    emit(c, trimmed);
  };

  const filtered = query.trim()
    ? COUNTRIES.filter((c) => {
        const q = query.trim().toLowerCase();
        return (
          c.nameAr.includes(query.trim()) ||
          c.name.toLowerCase().includes(q) ||
          c.code.includes(q)
        );
      })
    : COUNTRIES;

  const fieldId = label?.replace(/\s/g, "-").toLowerCase();

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={wrapRef}>
      {label && (
        <label htmlFor={fieldId} className="text-body font-semibold text-muted-700">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div
          className={cn(
            "flex items-stretch h-11 border rounded-xl bg-white overflow-hidden",
            "transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary",
            error ? "border-red-400" : "border-muted-200",
            disabled && "opacity-60"
          )}
        >
          {/* زر اختيار الدولة (يمين في RTL) */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 border-l border-muted-200 bg-muted-50 hover:bg-muted-100 transition-colors shrink-0 disabled:cursor-not-allowed"
            aria-label="اختر الدولة"
          >
            <AltArrowDown className="h-4 w-4 text-muted" />
            <span className="text-body text-muted-700 dir-ltr" dir="ltr">
              {country.code}
            </span>
            <span className="text-body-lg leading-none">{country.flag}</span>
          </button>

          {/* رقم الهاتف المحلي */}
          <input
            id={fieldId}
            type="tel"
            inputMode="numeric"
            dir="ltr"
            autoFocus={autoFocus}
            disabled={disabled}
            value={local}
            onChange={(e) => handleLocalChange(toEnglishDigits(e.target.value))}
            placeholder={placeholder}
            className="flex-1 min-w-0 px-4 text-body text-ink placeholder-muted bg-white focus:outline-none text-left"
          />
        </div>

        {/* قائمة الدول */}
        {open && (
          <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-xl border border-muted-100 overflow-hidden">
            <div className="p-2 border-b border-muted-100">
              <div className="relative flex items-center">
                <span className="absolute right-3 text-muted pointer-events-none">
                  <Magnifer className="h-4 w-4" />
                </span>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث عن دولة..."
                  className="w-full h-9 border border-muted-200 rounded-lg bg-white text-body pr-9 pl-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>
            <ul className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-body text-muted text-center">لا توجد نتائج</li>
              ) : (
                filtered.map((c) => {
                  const selected = c.code === country.code && c.name === country.name;
                  return (
                    <li key={`${c.code}-${c.name}`}>
                      <button
                        type="button"
                        onClick={() => pickCountry(c)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-body hover:bg-muted-50 transition-colors",
                          selected && "bg-primary/5"
                        )}
                      >
                        <span className="text-h3 leading-none">{c.flag}</span>
                        <span className="flex-1 text-right text-muted-700">{c.nameAr}</span>
                        <span
                          dir="ltr"
                          className={cn(
                            "text-body font-semibold",
                            selected ? "text-primary" : "text-muted"
                          )}
                        >
                          {c.code}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {error && <p className="text-caption text-red-500">{error}</p>}
      {hint && !error && <p className="text-caption text-muted">{hint}</p>}
    </div>
  );
}
