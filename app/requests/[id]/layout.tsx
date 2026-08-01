import type { Metadata } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

// بيانات مشاركة ديناميكية لطلب العميل (خادمية) — كرت غني عند المشاركة.
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API}/requests/${id}/`, { next: { revalidate: 300 } });
    if (!res.ok) return {};
    const r = await res.json();
    const title = r.city_name ? `${r.title} — ${r.city_name}` : r.title || "طلب عميل";
    const description = (r.description || "").slice(0, 160) || undefined;
    return { title, description, openGraph: { title, description, type: "article" } };
  } catch {
    return {};
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
