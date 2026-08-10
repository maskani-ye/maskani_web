import type { Metadata } from "next";
import { notFound } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";
const BASE = "https://maskani.homes";

async function getReport(id: string) {
  try {
    const res = await fetch(`${API}/reports/${id}/`, { cache: "no-store" });
    if (res.status === 404) return "NOT_FOUND";
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const r = await getReport(id);
  if (!r || r === "NOT_FOUND") return {};
  const title = r.title || "بلاغ احتيال";
  const description = (r.description || "").slice(0, 160) || undefined;
  const img = r.first_image || r.images?.[0]?.image || `${BASE}/og.webp`;
  return {
    title,
    description,
    alternates: { canonical: `${BASE}/reports/${id}` },
    openGraph: { title, description, images: [{ url: img }], type: "article", url: `${BASE}/reports/${id}` },
  };
}

export default async function Layout(
  { children, params }: { children: React.ReactNode; params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const r = await getReport(id);
  if (r === "NOT_FOUND") notFound(); // 404 حقيقي بدل soft-404

  const breadcrumb =
    r && r !== "NOT_FOUND"
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${BASE}/` },
            { "@type": "ListItem", position: 2, name: "بلاغات الاحتيال", item: `${BASE}/reports` },
            { "@type": "ListItem", position: 3, name: r.title, item: `${BASE}/reports/${id}` },
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
