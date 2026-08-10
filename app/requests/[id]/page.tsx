import { notFound } from "next/navigation";
import type { ClientRequest } from "@/types";
import RequestDetailClient from "./RequestDetailClient";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

// خادمي — يجلب الطلب العقاري ويُصيّره فورًا (محتوى في HTML الخام) ثم يُسلّمه للجزيرة.
async function getRequest(id: string): Promise<ClientRequest | "NOT_FOUND" | null> {
  try {
    const res = await fetch(`${API}/requests/${id}/`, { cache: "no-store" });
    if (res.status === 404) return "NOT_FOUND";
    if (!res.ok) return null;
    return (await res.json()) as ClientRequest;
  } catch {
    return null;
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await getRequest(id);
  if (request === "NOT_FOUND") notFound();
  return <RequestDetailClient id={id} initialRequest={request} />;
}
