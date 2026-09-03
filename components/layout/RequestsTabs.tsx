"use client";

// شريط تبويبات «مركز الطلبات» — موحّد أعلى صفحتَي /requests (طلبات عقارية)
// و /jobs (طلبات خدمات)، مطابق لمركز الطلبات بقسمين في تطبيق Flutter.
import Link from "@/components/nav/MarketLink";

const TABS = [
  { href: "/requests", label: "طلبات عقارية", key: "property" },
  { href: "/jobs", label: "طلبات خدمات", key: "service" },
] as const;

export function RequestsTabs({ active }: { active: "property" | "service" }) {
  return (
    <div className="flex gap-1 border-b border-muted-200 mb-5">
      {TABS.map((t) => {
        const on = active === t.key;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={`-mb-px border-b-2 px-5 py-2.5 text-body font-semibold transition ${
              on
                ? "border-primary text-primary"
                : "border-transparent text-muted-500 hover:text-primary"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
