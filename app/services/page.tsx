import ServicesListClient from "./ServicesListClient";
import RecentItemsLinks from "@/components/RecentItemsLinks";
import SectionIntro from "@/components/SectionIntro";

// قشرة خادمية رفيعة: كتلة تعريفية فريدة + القائمة التفاعلية (عميل) + روابط أحدث الخدمات.
export default function ServicesPage() {
  return (
    <>
      <SectionIntro title="مزوّدو الخدمات العقارية في اليمن">
        اعثر على أفضل مزوّدي الخدمات في اليمن على مسكني: مقاولو بناء ومهندسون وفنيّو كهرباء
        وسباكة وتكييف، وخدمات ديكور وصيانة وتنظيف، مع معرض أعمال وتقييمات المستخدمين
        وتواصل مباشر مع مزوّد الخدمة بلا عمولات.
      </SectionIntro>
      <ServicesListClient />
      <RecentItemsLinks endpoint="/services/" hrefPrefix="/services" heading="أحدث مزوّدي الخدمات" />
    </>
  );
}
