import type { Metadata } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

// بيانات SEO/المشاركة ديناميكية للإعلان (خادمية). `no_count=1` كي لا نُضاعف عدّ الزيارات.
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API}/listings/${id}/?no_count=1`, { next: { revalidate: 300 } });
    if (!res.ok) return {};
    const l = await res.json();
    const title = l.city_name ? `${l.title} — ${l.city_name}` : l.title;
    const description = (l.description || "").slice(0, 160) || undefined;
    const images = l.main_image ? [{ url: l.main_image }] : undefined;
    return { title, description, openGraph: { title, description, images, type: "article" } };
  } catch {
    return {};
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
