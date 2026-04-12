import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CURRENCY_LABELS: Record<string, string> = {
  SAR: "ريال سعودي",
  YER: "ريال يمني",
  USD: "دولار",
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  SAR: "ر.س",
  YER: "ر.ي",
  USD: "$",
};

export function formatPrice(price: string | number, currency: string = "SAR"): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  const localeMap: Record<string, string> = { SAR: "ar-SA", YER: "ar-YE", USD: "en-US" };
  const locale = localeMap[currency] ?? "ar-SA";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatRelativeTime(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ar });
}

export function formatDate(date: string): string {
  return format(new Date(date), "d MMMM yyyy", { locale: ar });
}

export const propertyTypeLabels: Record<string, string> = {
  apartment: "شقة",
  house: "بيت / فيلا",
  land: "أرض",
  commercial: "محل تجاري",
};

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
  fake_listing: "إعلان وهمي",
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
  owner: "مالك عقار",
  broker: "دلال / وسيط",
  client: "عميل",
  service_provider: "مزود خدمة",
  admin: "مشرف",
};
