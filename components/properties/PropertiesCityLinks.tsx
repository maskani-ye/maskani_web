import Link from "next/link";
import { citySlug } from "@/lib/seo";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

interface City {
  id: number;
  name_ar: string;
  name_en: string;
}

// خادمي — يجلب المحافظات ويصيّرها روابط <a> إلى صفحات هبوط المدن
// (/properties/city/<slug>). يمرّر قوّة الزحف (internal link equity) لصفحات المدن
// الطويلة الذيل («عقارات في صنعاء») التي كانت في الـsitemap فقط بلا رابط قابل للزحف.
async function getCities(): Promise<City[]> {
  try {
    const res = await fetch(`${API}/cities/?limit=1000`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    return (await res.json()).results ?? [];
  } catch {
    return [];
  }
}

export default async function PropertiesCityLinks() {
  const cities = (await getCities()).filter((c) => citySlug(c.name_en));
  if (!cities.length) return null;

  return (
    <nav aria-labelledby="city-links-heading" className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 mb-12">
      <h2 id="city-links-heading" className="text-lg font-bold text-ink mb-4">
        تصفّح العقارات حسب المحافظة
      </h2>
      <ul className="flex flex-wrap gap-2">
        {cities.map((c) => (
          <li key={c.id}>
            <Link
              href={`/properties/city/${citySlug(c.name_en)}`}
              className="inline-block rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-ink hover:border-primary hover:text-primary transition-colors"
            >
              عقارات {c.name_ar}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
