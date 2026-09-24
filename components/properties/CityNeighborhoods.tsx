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

  // ⚠️ **هذه أدواتُ تصفّحٍ لا روابطَ فهرسة.** قرار المالك: الحيّ **فلترة** في
  // تجربة الموقع لا وجهةٌ منفصلة — فالنقر هنا يفتح قائمة العقارات مفلترةً،
  // بتجربةٍ واحدة فيها كل الفلاتر الأخرى (السعر والنوع والمساحة) بدل شاشةٍ
  // موازية تنقصها.
  //
  // ⚠️ **وصفحات الأحياء تبقى مفهرسة** — وليست تناقضاً مع ما سبق: هي ثاني أكبر
  // مصدر زيارات للموقع (١٨٠ نقرة في ٩٠ يوماً مقابل ٧٤ لـ٦٬٩٢١ صفحة عقار)،
  // وحذفها جرّبناه شبيهاً فكلّفنا ربع نقرات البحث. من يأتي من جوجل يهبط
  // عليها، ومن يتصفّح من الداخل يمرّ بالفلتر. ورابطها الداخليّ الباقي هو
  // **جدول أسعار الأحياء** في `MarketStats` — مرجعٌ لا زرّ تصفّح.
  const listHref = (nid: number) =>
    `/properties?city=${cityId}&neighborhood_ref=${nid}`;

  // الأحياء التي فيها عقارات أولاً — فلترةٌ إلى قائمة فارغة لا تنفع أحداً،
  // لكنّنا نعرض الباقي أيضاً لأن الحيّ اسمٌ يبحث عنه الناس ولو لم يُنشر فيه بعد.
  const withStock = all.filter((n) => (n.properties_count ?? 0) > 0);
  const rest = all.filter((n) => !(n.properties_count ?? 0));
  const shown = [...withStock, ...rest].slice(0, 40);

  return (
    <section aria-labelledby="city-neighborhoods" className="mt-10">
      <h2 id="city-neighborhoods" className="text-h3 font-bold text-ink mb-1">
        أحياء {cityName}
      </h2>
      <p className="text-body text-muted-500 mb-3">
        اختر حيّك لعرض عقاراته وحدها — {all.length} حيّاً في {cityName}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((n) => (
          <Link
            key={n.id}
            href={listHref(n.id)}
            className="text-body rounded-xl border border-muted-200 bg-white px-3 py-1.5 text-muted-700 hover:border-primary hover:text-primary transition-colors"
          >
            {n.name}
            {n.properties_count ? (
              <span className="text-muted text-caption"> ({n.properties_count})</span>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
