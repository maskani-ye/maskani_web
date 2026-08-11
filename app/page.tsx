import dynamic from "next/dynamic";
import { JsonLd } from "@/components/JsonLd";
import { homeFaq } from "@/lib/seo";
import PropertiesCityLinks from "@/components/properties/PropertiesCityLinks";
import HomeBlogLinks from "@/components/HomeBlogLinks";

const HomeClient = dynamic(() => import("./HomeClient"), { ssr: true });

export default function HomePage() {
  return (
    <>
      {/* أسئلة شائعة (FAQ) — بيانات منظّمة تظهر كنتائج منسدلة في Google */}
      <JsonLd data={homeFaq} />
      <HomeClient />
      {/* روابط داخلية خادمية من الرئيسية (الصفحة المفهرسة) نحو صفحات هبوط المدن
          ومقالات المدوّنة — تمرّر قوّة الزحف وتقلّل عمق النقر للصفحات غير المفهرسة. */}
      <PropertiesCityLinks />
      <HomeBlogLinks />
    </>
  );
}
