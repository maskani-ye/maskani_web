import { ReactNode } from "react";

/**
 * ترويسة صفحة موحّدة — أيقونة داخل مربّع + عنوان + سطر وصفي + إجراءات اختيارية.
 * مصدر واحد لكل الصفحات (إدارة + عامة) — لا تُكرّر ترويسة `<h1>` في أي صفحة.
 *
 * <PageHeader icon={<Case />} title="طلبات الخدمة" subtitle="12 طلب"
 *   actions={<Button>…</Button>} />
 *
 * الأيقونة تُقاس وتُلوّن تلقائياً (h-6 w-6 text-primary) — مرّر مكوّن الأيقونة فقط.
 */
export function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  as: Heading = "h1",
}: {
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  // مستوى الترويسة — الافتراضي h1. تُضبط h2 حين يوجد h1 آخر مُصيَّر خادميًا فوقها
  // (كتلة SectionIntro) لتفادي تكرار h1 على الصفحة (SEO).
  as?: "h1" | "h2";
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 min-w-0">
        <span className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 [&>svg]:h-6 [&>svg]:w-6">
          {icon}
        </span>
        <div className="min-w-0">
          <Heading className="text-xl font-bold text-gray-900 truncate">{title}</Heading>
          {subtitle != null && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
}
