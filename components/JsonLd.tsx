import { jsonLdHtml } from "@/lib/jsonLd";

// مكوّن حَقن بيانات منظّمة (JSON-LD) — يُصيَّر على الخادم ضمن HTML الأولي فيقرأه
// Googlebot مباشرةً. يعمل داخل مكوّنات العميل والخادم على حدّ سواء.
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdHtml(data) }}
    />
  );
}
