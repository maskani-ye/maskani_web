import type { Metadata } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API}/auth/users/${id}/`, { next: { revalidate: 300 } });
    if (!res.ok) return {};
    const u = await res.json();
    const title = u.full_name || "مستخدم";
    const description = (u.bio || `ملف ${u.full_name || "مستخدم"} على مسكني`).slice(0, 160);
    return {
      title, description,
      openGraph: { title, description, images: u.avatar ? [{ url: u.avatar }] : undefined, type: "profile" },
    };
  } catch {
    return {};
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
