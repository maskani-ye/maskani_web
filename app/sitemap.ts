import type { MetadataRoute } from "next";
import { citySlug } from "@/lib/seo";

const BASE = "https://maskani.homes";
const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

interface Row {
  id: number;
  updated?: string | null;
  image?: string | null;
}

// يجلب عناصر قسم (حتى 1000) لبناء خريطة الموقع الديناميكية — مع lastmod وصورة (إن وُجدت).
async function rows(path: string): Promise<Row[]> {
  try {
    const res = await fetch(`${API}${path}?limit=1000&offset=0`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map(
      (x: { id: number; updated_at?: string; created_at?: string; main_image?: string; first_image?: string }) => ({
        id: x.id,
        updated: x.updated_at || x.created_at || null,
        image: x.main_image || x.first_image || null,
      }),
    );
  } catch {
    return [];
  }
}

// يجلب المدن لبناء صفحات هبوط المدن (SEO — الذيل الطويل: «عقارات في صنعاء»).
async function cities(): Promise<{ slug: string }[]> {
  try {
    const res = await fetch(`${API}/cities/?limit=1000`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? [])
      .map((c: { name_en?: string }) => ({ slug: citySlug(c.name_en || "") }))
      .filter((c: { slug: string }) => c.slug);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/listings`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/services`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/requests`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/jobs`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/reports`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const [listings, services, requests, jobs, reports, cityList] = await Promise.all([
    rows("/listings/"),
    rows("/services/"),
    rows("/requests/"),
    rows("/jobs/"),
    rows("/reports/"),
    cities(),
  ]);

  const build = (
    items: Row[],
    prefix: string,
    changeFrequency: "daily" | "weekly",
    priority: number,
    withImages = false,
  ): MetadataRoute.Sitemap =>
    items.map((x) => ({
      url: `${BASE}${prefix}/${x.id}`,
      lastModified: x.updated ? new Date(x.updated) : now,
      changeFrequency,
      priority,
      ...(withImages && x.image ? { images: [x.image] } : {}),
    }));

  // صفحات هبوط المدن — /listings/city/<slug>
  const cityEntries: MetadataRoute.Sitemap = cityList.map((c) => ({
    url: `${BASE}/listings/city/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.75,
  }));

  return [
    ...staticEntries,
    ...cityEntries,
    ...build(listings, "/listings", "daily", 0.7, true),
    ...build(services, "/services", "weekly", 0.6),
    ...build(requests, "/requests", "weekly", 0.5),
    ...build(jobs, "/jobs", "weekly", 0.5),
    ...build(reports, "/reports", "weekly", 0.5, true),
  ];
}
