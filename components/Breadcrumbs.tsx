import Link from "next/link";
import { AltArrowLeft } from "@solar-icons/react";

// مسار تنقّل مرئي (breadcrumbs) — يحسّن تجربة المستخدم والربط الداخلي بين الصفحات.
// RTL: العناصر تتدفّق من اليمين، والسهم يشير لليسار نحو العنصر التالي.
export interface Crumb {
  name: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="مسار التنقّل" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {c.href && !last ? (
                <Link
                  href={c.href}
                  className="hover:text-primary transition-colors"
                >
                  {c.name}
                </Link>
              ) : (
                <span
                  className={last ? "text-gray-900 font-medium" : ""}
                  aria-current={last ? "page" : undefined}
                >
                  {c.name}
                </span>
              )}
              {!last && (
                <AltArrowLeft className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
