import { notFound } from "next/navigation";
import type { ServiceProvider } from "@/types";
import ServiceDetailClient from "./ServiceDetailClient";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

// خادمي — يجلب مزوّد الخدمة ويُصيّره فورًا (محتوى في HTML الخام) ثم يُسلّمه للجزيرة.
async function getService(id: string): Promise<ServiceProvider | "NOT_FOUND" | null> {
  try {
    const res = await fetch(`${API}/services/${id}/`, { cache: "no-store" });
    if (res.status === 404) return "NOT_FOUND";
    if (!res.ok) return null;
    return (await res.json()) as ServiceProvider;
  } catch {
    return null;
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const provider = await getService(id);
  if (provider === "NOT_FOUND") notFound();
  return <ServiceDetailClient id={id} initialProvider={provider} />;
}
