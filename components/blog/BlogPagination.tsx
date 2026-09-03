import Link from "next/link";
import { NUMERIC_LOCALE } from "@/lib/utils";

/**
 * ترقيم صفحي للمدونة — مبنيّ على روابط (صديق للفهرسة، يعمل بلا JS).
 * صفحة خادمية: يمرّر `hrefFor(page)` لبناء رابط كل صفحة مع الحفاظ على المسار/الفلاتر.
 */
export function BlogPagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (p: number) => string;
}) {
  if (totalPages <= 1) return null;

  // نافذة أرقام حول الصفحة الحالية (مع أوّل/آخر صفحة دائماً)
  const nums: (number | "…")[] = [];
  const add = (n: number) => { if (!nums.includes(n)) nums.push(n); };
  add(1);
  for (let p = page - 1; p <= page + 1; p++) if (p > 1 && p < totalPages) add(p);
  add(totalPages);
  // إدراج فواصل «…» عند القفزات
  const withGaps: (number | "…")[] = [];
  nums.sort((a, b) => (a as number) - (b as number)).forEach((n, i) => {
    if (i > 0 && (n as number) - (nums[i - 1] as number) > 1) withGaps.push("…");
    withGaps.push(n);
  });

  const cellBase =
    "min-w-10 h-10 px-3 inline-flex items-center justify-center rounded-xl text-body font-medium transition-colors";

  return (
    <nav className="flex items-center justify-center gap-1.5 flex-wrap mt-10" aria-label="ترقيم الصفحات">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev"
          className={`${cellBase} bg-white text-muted-600 border border-muted-200 hover:border-primary`}>السابق</Link>
      ) : (
        <span className={`${cellBase} bg-muted-50 text-muted-200 border border-muted-100 cursor-not-allowed`}>السابق</span>
      )}

      {withGaps.map((n, i) =>
        n === "…" ? (
          <span key={`gap-${i}`} className={`${cellBase} text-muted`}>…</span>
        ) : n === page ? (
          <span key={n} aria-current="page" className={`${cellBase} bg-primary text-white`}>
            {n.toLocaleString(NUMERIC_LOCALE)}
          </span>
        ) : (
          <Link key={n} href={hrefFor(n)}
            className={`${cellBase} bg-white text-muted-600 border border-muted-200 hover:border-primary tabular-nums`}>
            {n.toLocaleString(NUMERIC_LOCALE)}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next"
          className={`${cellBase} bg-white text-muted-600 border border-muted-200 hover:border-primary`}>التالي</Link>
      ) : (
        <span className={`${cellBase} bg-muted-50 text-muted-200 border border-muted-100 cursor-not-allowed`}>التالي</span>
      )}
    </nav>
  );
}
