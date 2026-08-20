import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

interface Row { id: number; name: string; slug: string; properties_count?: number }

// خادميّ — أحياء المحافظة وروابط صفحاتها.
//
// 432 حياً مبنيّة بصفحاتها وخريطتها، ولا يصلها زائر ولا زاحف من أي صفحة: صفحة
// المحافظة لا تذكرها إطلاقاً. هذه الكتلة تصل الحلقة المقطوعة — وهي أيضاً أدقّ
// نيّة بحثية عندنا: من يبحث عن «شقة في حدّة» لا يريد صنعاء كلّها.
async function getNeighborhoods(cityId: number): Promise<Row[]> {
  try {
    const res = await fetch(`${API}/cities/neighborhoods/?city=${cityId}&limit=1000`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : data.results ?? []) as Row[];
  } catch {
    return [];
  }
}

export default async function CityNeighborhoods({
  cityId, cityName,
}: { cityId: number; cityName: string }) {
  const all = await getNeighborhoods(cityId);
  if (!all.length) return null;

  // الأحياء التي فيها عقارات أولاً — رابطٌ إلى صفحة فارغة لا ينفع أحداً،
  // لكنّنا نعرض الباقي أيضاً لأن الحيّ اسمٌ يبحث عنه الناس ولو لم يُنشر فيه بعد.
  const withStock = all.filter((n) => (n.properties_count ?? 0) > 0);
  const rest = all.filter((n) => !(n.properties_count ?? 0));
  const shown = [...withStock, ...rest].slice(0, 40);

  return (
    <section aria-labelledby="city-neighborhoods" className="mt-10">
      <h2 id="city-neighborhoods" className="text-lg font-bold text-ink mb-1">
        أحياء {cityName}
      </h2>
      <p className="text-sm text-gray-500 mb-3">
        اختر حيّك لعرض عقاراته وحدها — {all.length} حيّاً في {cityName}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((n) => (
          <Link
            key={n.id}
            href={`/properties/neighborhood/${n.slug}`}
            className="text-sm rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-gray-700 hover:border-primary hover:text-primary transition-colors"
          >
            {n.name}
            {n.properties_count ? (
              <span className="text-gray-400 text-xs"> ({n.properties_count})</span>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
