import { createMarketSection } from "@/lib/marketSection";
import RequestsListClient from "@/app/requests/RequestsListClient";

/**
 * طلبات العقارات في السوق — تُبنى من مصنع أقسام السوق.
 *
 * ⚠️ **لا تنسخ هيكل الصفحة هنا**: `revalidate` وقاعدة `noindex` للسوق الفارغ
 * و`generateStaticParams` كلّها في `lib/marketSection` — تعديلها هناك يسري على
 * الأقسام الأربعة دفعةً واحدة. ما يخصّ هذا القسم وحده: عنوانه ووصفه ومكوّنه.
 */
const section = createMarketSection({
  slug: "requests",
  title: (m) => `طلبات العقارات في ${m.nameAr}`,
  description: (m, cities) => `ما يبحث عنه الناس في ${m.nameAr}: طلبات شراء وإيجار بميزانياتها ومدنها (${cities} وغيرها).`,
  render: () => <RequestsListClient />,
});

// ⚠️ **قيمتان حرفيّتان لا مُستوردتان.** يرفض Next أي `revalidate` أو
// `dynamicParams` لا يستطيع قراءتها ساكنةً وقت البناء («It needs to be a
// static boolean») — فهذان السطران وحدهما لا يمكن استخراجهما إلى المصنع مهما
// تكرّرا. الباقي (البيانات الوصفية والمسارات والصفحة) مستخرَجٌ كلّه.
export const revalidate = 3600;
export const dynamicParams = false;
export const generateStaticParams = section.generateStaticParams;
export const generateMetadata = section.generateMetadata;
export default section.Page;
