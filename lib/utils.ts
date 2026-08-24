import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CURRENCY_LABELS: Record<string, string> = {
  // الريال اليمني عملتان: صنعاء وعدن (الفرق ثلاثة أضعاف في سعر الصرف).
  YER: "ريال يمني (صنعاء)",
  YEA: "ريال يمني (عدن)",
  SAR: "ريال سعودي",
  JOD: "دينار أردني",
  EGP: "جنيه مصري",
  IQD: "دينار عراقي",
  OMR: "ريال عُماني",
  USD: "دولار",
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  YER: "ر.ي",
  YEA: "ر.ي (عدن)",
  SAR: "ر.س",
  JOD: "د.أ",
  EGP: "ج.م",
  IQD: "د.ع",
  OMR: "ر.ع",
  USD: "$",
};

// المصدر الوحيد لقائمة العملات في الويب — الترتيب مقصود: اليمن أولاً (السوق
// الأساسي)، ويطابق `Currency` في الباك اند و`Currency` في تطبيقَي Flutter.
export const CURRENCIES: { value: string; symbol: string; label: string }[] = [
  { value: "YER", symbol: CURRENCY_SYMBOLS.YER, label: CURRENCY_LABELS.YER },
  { value: "YEA", symbol: CURRENCY_SYMBOLS.YEA, label: CURRENCY_LABELS.YEA },
  { value: "SAR", symbol: CURRENCY_SYMBOLS.SAR, label: CURRENCY_LABELS.SAR },
  { value: "JOD", symbol: CURRENCY_SYMBOLS.JOD, label: CURRENCY_LABELS.JOD },
  { value: "EGP", symbol: CURRENCY_SYMBOLS.EGP, label: CURRENCY_LABELS.EGP },
  { value: "IQD", symbol: CURRENCY_SYMBOLS.IQD, label: CURRENCY_LABELS.IQD },
  { value: "OMR", symbol: CURRENCY_SYMBOLS.OMR, label: CURRENCY_LABELS.OMR },
  { value: "USD", symbol: CURRENCY_SYMBOLS.USD, label: CURRENCY_LABELS.USD },
];

// العملة الافتراضية — يجب أن تطابق `Currency.YER` في الباك اند.
export const DEFAULT_CURRENCY = "YER";

// نصّ موحّد لغياب السعر — «السعر عند التواصل» يشجّع على النقر/التواصل.
export const PRICE_ON_REQUEST = "السعر عند التواصل";

/**
 * تنسيق عدد بالأرقام العربية-الهندية — **مصدر واحد** لكل رقم في المنصّة.
 *
 * ⚠️ `toLocaleString("ar")` بلا إقليم يُنتج نتيجتين مختلفتين:
 *   Node (SSR):     (1234).toLocaleString("ar") → "1,234"   أرقام غربية
 *   Chrome (عميل):  (1234).toLocaleString("ar") → "١٬٢٣٤"   أرقام هندية
 * فكل رقم يُرسَم على الخادم ثم يُرطَّب في المتصفّح يختلف بين النسختين — عدم
 * تطابق ترطيب صامت، وأرقام مختلطة على الشاشة الواحدة. والوسم بالإقليم يحسم
 * الأمر في البيئتين.
 */
export const NUMERIC_LOCALE = "ar-EG";

export function formatNumber(
  n: number | string | null | undefined,
  options?: Intl.NumberFormatOptions,
): string {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (num == null || isNaN(num)) return "";
  return num.toLocaleString(NUMERIC_LOCALE, options);
}

export function formatPrice(price: string | number | null | undefined, currency?: string | null): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (num == null || isNaN(num)) return PRICE_ON_REQUEST;
  // عملة غير صالحة/فارغة → افتراضي YER (تفادي: "Currency code is required with currency style").
  const cur = (currency || "YER").toUpperCase();
  // YEA (ريال عدن) رمز داخلي لا يعرفه Intl — يسقط عمداً إلى صيغة الرمز أدناه.
  const localeMap: Record<string, string> = { SAR: "ar-SA", JOD: "ar-JO", EGP: "ar-EG", IQD: "ar-IQ", OMR: "ar-OM", YER: "ar-YE", USD: "en-US" };
  const locale = localeMap[cur] ?? "ar-SA";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    // رمز عملة غير معياري (ISO) → صيغة رقمية بسيطة + الرمز.
    return `${num.toLocaleString("ar")} ${CURRENCY_SYMBOLS[cur] ?? cur}`;
  }
}

export function formatRelativeTime(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ar });
}

export function formatDate(date: string): string {
  return format(new Date(date), "d MMMM yyyy", { locale: ar });
}

// خريطة احتياطية للأنواع الأربعة القديمة فقط. الأنواع تُدار من اللوحة (22 نوعاً
// وتزيد)، والمصدر الصحيح لاسمها العربيّ هو `property_type_name` من الخادم —
// هذه الخريطة لِما وصل قبل إضافة ذلك الحقل.
export const propertyTypeLabels: Record<string, string> = {
  apartment: "شقة",
  house: "بيت / فيلا",
  land: "أرض",
  commercial: "محل تجاري",
  any: "أي نوع",
};

// property_type may arrive as a nested object {id,name_ar,icon} (current API),
// a legacy slug string, or a bare id — always render a safe label, never an object.
export function propertyTypeName(pt: unknown): string {
  if (pt && typeof pt === "object" && "name_ar" in pt) {
    return String((pt as { name_ar: string }).name_ar);
  }
  if (typeof pt === "string") return propertyTypeLabels[pt] ?? pt;
  return "—";
}

export const offerTypeLabels: Record<string, string> = {
  sale: "للبيع",
  rent_monthly: "إيجار شهري",
  rent_yearly: "إيجار سنوي",
};

export const furnishingLabels: Record<string, string> = {
  furnished: "مفروشة",
  unfurnished: "غير مفروشة",
  semi_furnished: "نصف مفروشة",
};

export const statusLabels: Record<string, string> = {
  available: "متاح",
  reserved: "محجوز",
  sold_rented: "مباع / مؤجّر",
};

export const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  reserved: "bg-yellow-100 text-yellow-700",
  sold_rented: "bg-gray-100 text-gray-600",
};

export const fraudTypeLabels: Record<string, string> = {
  fake_property: "عقار وهمي",
  scam: "احتيال / نصب",
  fake_owner: "انتحال صفة المالك",
  double_rent: "تأجير مزدوج",
  deposit_theft: "سرقة عربون",
  other: "أخرى",
};

export const reportStatusLabels: Record<string, string> = {
  pending: "قيد المراجعة",
  verified: "موثّق",
  rejected: "مرفوض",
};

export const reportStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  verified: "bg-red-100 text-red-700",
  rejected: "bg-gray-100 text-gray-600",
};

export const serviceCategoryLabels: Record<string, string> = {
  architect: "مهندس معماري",
  interior_designer: "مصمم داخلي",
  contractor: "مقاول",
  supervisor: "مشرف بناء",
  electrician: "كهربائي",
  plumber: "سباك",
  ac_technician: "فني تكييف",
  painter: "دهان",
  cleaner: "شركة تنظيف",
  maintenance: "صيانة عامة",
  other: "أخرى",
};

export const roleLabels: Record<string, string> = {
  user: "مستخدم",
  admin: "مشرف",
};
