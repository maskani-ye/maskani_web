// مكوّن حَقن بيانات منظّمة (JSON-LD) — يُصيَّر على الخادم ضمن HTML الأولي فيقرأه
// Googlebot مباشرةً. يعمل داخل مكوّنات العميل والخادم على حدّ سواء.
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
