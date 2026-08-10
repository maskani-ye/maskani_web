import ReportsListClient from "./ReportsListClient";
import RecentItemsLinks from "@/components/RecentItemsLinks";
import SectionIntro from "@/components/SectionIntro";

// قشرة خادمية رفيعة: كتلة تعريفية فريدة + القائمة التفاعلية (عميل) + روابط أحدث البلاغات.
export default function ReportsPage() {
  return (
    <>
      <SectionIntro title="بلاغات الاحتيال العقاري — مجتمع مسكني للحماية">
        تصفّح بلاغات المستخدمين حول حالات الاحتيال والنصب العقاري في اليمن على مسكني،
        وشارك في حماية المجتمع عبر التصويت والتوثيق والإبلاغ عن أي تلاعب عقاري.
      </SectionIntro>
      <ReportsListClient />
      <RecentItemsLinks endpoint="/reports/" hrefPrefix="/reports" heading="أحدث البلاغات" />
    </>
  );
}
