import type { Metadata } from "next";
import { notFound } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";
const BASE = "https://maskani.homes";

async function getRequest(id: string) {
  try {
    const res = await fetch(`${API}/requests/${id}/`, { cache: "no-store" });
    if (res.status === 404) return "NOT_FOUND";
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// بيانات مشاركة ديناميكية لطلب العميل (خادمية) — كرت غني عند المشاركة.
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const r = await getRequest(id);
  if (!r || r === "NOT_FOUND") return {};
  const title = r.city_name ? `${r.title} — ${r.city_name}` : r.title || "طلب عقاري";
  const description = (r.description || "").slice(0, 160) || undefined;
  return {
    title,
    description,
    alternates: { canonical: `${BASE}/requests/${id}` },
    openGraph: { title, description, images: [{ url: `${BASE}/og.webp` }], type: "article", url: `${BASE}/requests/${id}` },
    twitter: { card: "summary_large_image", title, description, images: [`${BASE}/og.webp`] },
  };
}

export default async function Layout(
  { children, params }: { children: React.ReactNode; params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const r = await getRequest(id);
  if (r === "NOT_FOUND") notFound(); // 404 حقيقي بدل soft-404

  const breadcrumb =
    r && r !== "NOT_FOUND"
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${BASE}/` },
            { "@type": "ListItem", position: 2, name: "الطلبات العقارية", item: `${BASE}/requests` },
            { "@type": "ListItem", position: 3, name: r.title, item: `${BASE}/requests/${id}` },
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
