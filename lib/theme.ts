/**
 * نظام تصميم مسكني — مصدر JS الموحّد للتوكنات (نظير `AppColors`/`AppTypography` في تطبيق Flutter).
 *
 * الألوان في CSS تُستهلك عبر أصناف Tailwind (`bg-primary`, `text-danger-700`, `border-border`…)
 * المعرّفة في `tailwind.config.ts`. هذا الملف **للأماكن التي تحتاج القيمة الخام في JS** فقط —
 * رسوم Recharts، خريطة Leaflet، ألوان ديناميكية، ميتاداتا (themeColor/manifest). لا تُرمّز
 * لون العلامة (`#171539`…) في أي ملف؛ استورده من هنا.
 */

// ─── الألوان الأساسية للعلامة ──────────────────────────────────────────────
export const brand = {
  primary: "#171539", // كحليّ‑بنفسجيّ — اللون السائد في البوّابة (مقاس على البكسل)
  gold: "#FFC107", // أكسنت كهرماني
  cream: "#F6F6FB", // خلفية فاتحة
  ink: "#050536", // نصّ رئيسي (كحلي Gathern)
} as const;

// ─── الألوان الدلاليّة ─────────────────────────────────────────────────────
export const semantic = {
  success: "#16A34A",
  warning: "#FFC107",
  danger: "#DC2626",
  info: "#2563EB",
  muted: "#6B7280",
  border: "#E7E7F0",
} as const;

// ─── لوحة ألوان الرسوم البيانية (Recharts) — متّسقة مع العلامة ──────────────
export const chartPalette = [
  brand.primary,
  brand.gold,
  semantic.danger,
  semantic.info,
  "#8B5CF6",
] as const;

// ─── الزوايا والظلال (قيم خام للاستخدام في JS/inline عند الحاجة) ────────────
export const radii = { md: "0.75rem", lg: "1rem", xl: "1.5rem" } as const;

export const shadow = {
  card: "0 2px 16px rgba(23, 21, 57, 0.08)",
  cardHover: "0 8px 32px rgba(23, 21, 57, 0.16)",
} as const;

// ─── سلّم الطباعة المرجعي — أصناف Tailwind الموصى بها لكل دور ───────────────
// يوحّد الأدوار عبر الصفحات (استخدمها بدل ترميز أحجام/أوزان عشوائية).
export const typography = {
  pageTitle: "text-xl font-bold text-gray-900",
  sectionTitle: "text-lg font-bold text-gray-900",
  cardTitle: "text-base font-bold text-gray-900",
  label: "text-sm font-semibold text-gray-700",
  body: "text-sm text-gray-600",
  caption: "text-xs text-gray-400",
} as const;
