import dynamic from "next/dynamic";
import { JsonLd } from "@/components/JsonLd";
import { homeFaq } from "@/lib/seo";

const HomeClient = dynamic(() => import("./HomeClient"), { ssr: true });

export default function HomePage() {
  return (
    <>
      {/* أسئلة شائعة (FAQ) — بيانات منظّمة تظهر كنتائج منسدلة في Google */}
      <JsonLd data={homeFaq} />
      <HomeClient />
    </>
  );
}
