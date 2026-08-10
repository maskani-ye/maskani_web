import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

interface Row {
  id: number;
  title?: string;
  full_name?: string;
  city_name?: string | null;
}

// خادمي عام — يجلب أحدث عناصر قسم ويصيّرها روابط <a> قابلة للزحف في HTML الخام.
// يُلحق أسفل قوائم الأقسام العميلة (التي تجلب عبر JS) كي تكتشف محرّكات البحث
// العناصر العميقة عبر الروابط لا الـsitemap وحده. يُرجع null عند غياب البيانات.
// no-store: تصيير وقت الطلب (طازج) لا وقت البناء — إذ كان بناء ISR يُخزّن قائمة فارغة
// حين يتعثّر الـAPI تحت حِمل البناء ويخدمها طوال النافذة. محاولتان بمسارين مختلفين
// (param زائد يتجاهله الـAPI) كي لا تُدمَجا في ذاكرة fetch فتتحقّق الإعادة فعلًا.
async function getRecent(endpoint: string, take: number): Promise<Row[]> {
  const base = `${API}${endpoint}?limit=${take}&offset=0`;
  for (const url of [base, `${base}&_r=1`]) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const rows = (data.results ?? data ?? []) as Row[];
        if (rows.length) return rows;
      }
    } catch {
      // نتجاهل ونجرّب المسار الثاني
    }
  }
  return [];
}

export default async function RecentItemsLinks({
  endpoint,
  hrefPrefix,
  heading,
  take = 20,
}: {
  endpoint: string;
  hrefPrefix: string;
  heading: string;
  take?: number;
}) {
  const items = await getRecent(endpoint, take);
  if (!items.length) return null;

  return (
    <nav aria-label={heading} className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 mb-12">
      <h2 className="text-lg font-bold text-ink mb-4">{heading}</h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((it) => {
          const label = it.title || it.full_name || `#${it.id}`;
          return (
            <li key={it.id}>
              <Link
                href={`${hrefPrefix}/${it.id}`}
                className="inline-block max-w-[16rem] truncate rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-ink hover:border-primary hover:text-primary transition-colors"
              >
                {label}
                {it.city_name ? ` — ${it.city_name}` : ""}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
