import type { MetadataRoute } from "next";

const BASE = "https://maskani.homes";
const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

interface Row {
  id: number;
  updated?: string | null;
}

// يجلب معرّفات قسم (حتى 1000) لبناء خريطة الموقع الديناميكية.
async function rows(path: string): Promise<Row[]> {
  try {
    const res = await fetch(`${API}${path}?limit=1000&offset=0`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((x: { id: number; updated_at?: string; created_at?: string }) => ({
      id: x.id,
      updated: x.updated_at || x.created_at || null,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/listings`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/services`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/requests`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/jobs`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/reports`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const [listings, services, requests, jobs, reports] = await Promise.all([
    rows("/listings/"),
    rows("/services/"),
    rows("/requests/"),
    rows("/jobs/"),
    rows("/reports/"),
  ]);

  const build = (
    items: Row[],
    prefix: string,
    changeFrequency: "daily" | "weekly",
    priority: number,
  ): MetadataRoute.Sitemap =>
    items.map((x) => ({
      url: `${BASE}${prefix}/${x.id}`,
      lastModified: x.updated ? new Date(x.updated) : undefined,
      changeFrequency,
      priority,
    }));

  return [
    ...staticEntries,
    ...build(listings, "/listings", "daily", 0.7),
    ...build(services, "/services", "weekly", 0.6),
    ...build(requests, "/requests", "weekly", 0.5),
    ...build(jobs, "/jobs", "weekly", 0.5),
    ...build(reports, "/reports", "weekly", 0.5),
  ];
}
