import type { Metadata } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API}/services/${id}/`, { next: { revalidate: 300 } });
    if (!res.ok) return {};
    const s = await res.json();
    const title = s.title || "خدمة";
    const description = (s.description || "").slice(0, 160) || undefined;
    const img = s.portfolio?.[0]?.image || s.user_avatar || undefined;
    return {
      title, description,
      openGraph: { title, description, images: img ? [{ url: img }] : undefined, type: "profile" },
    };
  } catch {
    return {};
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
