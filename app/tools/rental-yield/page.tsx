import type { Metadata } from "next";
import { toolBySlug } from "@/lib/toolsMeta";
import { SITE_URL } from "@/lib/seo";
import { ToolPage } from "@/components/tools/ToolPage";
import RentalYieldCalc from "@/components/tools/RentalYieldCalc";

const tool = toolBySlug("rental-yield")!;
export const metadata: Metadata = {
  title: tool.metaTitle,
  description: tool.metaDescription,
  keywords: tool.keywords,
  alternates: { canonical: `/tools/${tool.slug}` },
  openGraph: { title: tool.metaTitle, description: tool.metaDescription, url: `${SITE_URL}/tools/${tool.slug}`, type: "website", images: [{ url: "/og.webp", width: 1200, height: 630, alt: "مسكني" }] },
};

export default function Page() {
  return <ToolPage tool={tool}><RentalYieldCalc /></ToolPage>;
}
