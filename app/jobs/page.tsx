import JobsListClient from "./JobsListClient";
import RecentItemsLinks from "@/components/RecentItemsLinks";
import SectionIntro from "@/components/SectionIntro";

// قشرة خادمية رفيعة: كتلة تعريفية فريدة + القائمة التفاعلية (عميل) + روابط أحدث الطلبات.
export default function JobsPage() {
  return (
    <>
      <SectionIntro title="طلبات الخدمات — اطلب خدمة عقارية في اليمن">
        تصفّح طلبات الخدمات في اليمن على مسكني واعرض خدماتك: أعمال بناء وصيانة وديكور
        وكهرباء وسباكة ونقل والمزيد، بتواصل مباشر بين طالب الخدمة ومزوّدها بلا عمولات.
      </SectionIntro>
      <JobsListClient />
      <RecentItemsLinks endpoint="/jobs/" hrefPrefix="/jobs" heading="أحدث طلبات الخدمات" />
    </>
  );
}
