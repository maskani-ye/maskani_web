import RequestsListClient from "./RequestsListClient";
import RecentItemsLinks from "@/components/RecentItemsLinks";
import SectionIntro from "@/components/SectionIntro";

// قشرة خادمية رفيعة: كتلة تعريفية فريدة + القائمة التفاعلية (عميل) + روابط أحدث الطلبات.
export default function RequestsPage() {
  return (
    <>
      <SectionIntro title="الطلبات العقارية — ابحث عن العقار المطلوب في اليمن">
        تصفّح طلبات العقارات في اليمن على مسكني: مستأجرون ومشترون يبحثون عن شقق وفلل وأراضٍ
        ومحلات في مختلف المحافظات. انشر طلبك العقاري ليصلك أصحاب العقارات المناسبون مباشرة
        بلا عمولات.
      </SectionIntro>
      <RequestsListClient />
      <RecentItemsLinks endpoint="/requests/" hrefPrefix="/requests" heading="أحدث الطلبات العقارية" />
    </>
  );
}
