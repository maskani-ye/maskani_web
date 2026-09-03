import { cn } from "@/lib/utils";

// ─── Badge ──────────────────────────────────────────────────────────────────
// شارة صغيرة ملوّنة. تدعم أسماء الألوان (green/gold/red/gray/blue/yellow)
// وأيضاً الأسماء الدلالية (success/warning/danger/info/default) — كلاهما يعمل.
// usage: <Badge variant="success">موثّق</Badge>  |  <Badge variant="gold">مميّز</Badge>

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    // color-named (existing — kept for backward compatibility)
    | "green"
    | "gold"
    | "red"
    | "gray"
    | "blue"
    | "yellow"
    // semantic aliases (new)
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "default";
  className?: string;
}

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  // ── color-named ──
  green: "bg-success-100 text-success-700 border border-success-200",
  gold: "bg-gold-100 text-gold-700 border border-gold-200", // reconciled: brand gold, not amber
  red: "bg-danger-100 text-danger-700 border border-danger-200",
  gray: "bg-muted-100 text-muted-600 border border-muted-200",
  blue: "bg-info-100 text-info-700 border border-info-200",
  yellow: "bg-warning-100 text-warning-700 border border-warning-200",
  // ── semantic aliases ──
  success: "bg-success-50 text-success-700 border border-success-100",
  warning: "bg-warning-50 text-warning-700 border border-warning-100",
  danger: "bg-danger-50 text-danger-700 border border-danger-100",
  info: "bg-info-50 text-info-700 border border-info-100",
  default: "bg-muted-100 text-muted-600 border border-muted-200",
};

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
}
