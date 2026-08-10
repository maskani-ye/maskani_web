import type { Metadata } from "next";
import { notFound } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";
const BASE = "https://maskani.homes";

async function getJob(id: string) {
  try {
    const res = await fetch(`${API}/jobs/${id}/`, { cache: "no-store" });
    if (res.status === 404) return "NOT_FOUND";
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// بيانات مشاركة ديناميكية لطلب الخدمة (خادمية) — كرت غني عند المشاركة.
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const j = await getJob(id);
  if (!j || j === "NOT_FOUND") return {};
  const title = j.city_name ? `${j.title} — ${j.city_name}` : j.title || "طلب خدمة";
  const description = (j.description || "").slice(0, 160) || undefined;
  return {
    title,
    description,
    alternates: { canonical: `${BASE}/jobs/${id}` },
    openGraph: { title, description, images: [{ url: `${BASE}/og.webp` }], type: "article", url: `${BASE}/jobs/${id}` },
    twitter: { card: "summary_large_image", title, description, images: [`${BASE}/og.webp`] },
  };
}

export default async function Layout(
  { children, params }: { children: React.ReactNode; params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const j = await getJob(id);
  if (j === "NOT_FOUND") notFound(); // 404 حقيقي بدل soft-404

  const breadcrumb =
    j && j !== "NOT_FOUND"
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${BASE}/` },
            { "@type": "ListItem", position: 2, name: "طلبات الخدمات", item: `${BASE}/jobs` },
            { "@type": "ListItem", position: 3, name: j.title, item: `${BASE}/jobs/${id}` },
          ],
        }
      : null;

  return (
    <>
      {breadcrumb && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      )}
      {children}
    </>
  );
}
