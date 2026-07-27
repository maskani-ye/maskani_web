import type { Metadata } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API}/reports/${id}/`, { next: { revalidate: 300 } });
    if (!res.ok) return {};
    const r = await res.json();
    const title = r.title || "شكوى";
    const description = (r.description || "").slice(0, 160) || undefined;
    const img = r.first_image || r.images?.[0]?.image || undefined;
    return {
      title, description,
      openGraph: { title, description, images: img ? [{ url: img }] : undefined, type: "article" },
    };
  } catch {
    return {};
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
